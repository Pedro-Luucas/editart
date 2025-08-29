use sqlx::{Pool, Postgres, PgPool};
use std::sync::OnceLock;

static DB_POOL: OnceLock<Pool<Postgres>> = OnceLock::new();

pub async fn init_database() -> Result<(), String> {
    dotenv::dotenv().ok();
    
    let database_url = std::env::var("DATABASE_URL")
        .map_err(|_| "DATABASE_URL must be set in .env file".to_string())?;

    let pool = PgPool::connect(&database_url)
        .await
        .map_err(|e| format!("Failed to connect to database: {}", e))?;

    // Create table if not exists
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS clients (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            nuit TEXT NOT NULL,
            contact TEXT NOT NULL,
            category TEXT NOT NULL,
            observations TEXT NOT NULL,
            debt DOUBLE PRECISION NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        "#,
    )
    .execute(&pool)
    .await
    .map_err(|e| format!("Failed to create clients table: {}", e))?;

    // Add debt column to existing clients table if it doesn't exist
    sqlx::query(
        r#"
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'clients' 
                AND column_name = 'debt'
            ) THEN
                ALTER TABLE clients ADD COLUMN debt DOUBLE PRECISION NOT NULL DEFAULT 0;
            END IF;
        END $$;
        "#,
    )
    .execute(&pool)
    .await
    .map_err(|e| format!("Failed to add debt column to clients table: {}", e))?;

    // Remove requisition column if it exists (migration)
    sqlx::query(
        r#"
        DO $$ 
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'clients' 
                AND column_name = 'requisition'
            ) THEN
                ALTER TABLE clients DROP COLUMN requisition;
            END IF;
        END $$;
        "#,
    )
    .execute(&pool)
    .await
    .map_err(|e| format!("Failed to remove requisition column: {}", e))?;

    // Migrate existing table if columns are TIMESTAMP instead of TIMESTAMPTZ
    sqlx::query(
        r#"
        DO $$ 
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'clients' 
                AND column_name = 'created_at' 
                AND data_type = 'timestamp without time zone'
            ) THEN
                ALTER TABLE clients 
                ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
                ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';
            END IF;
        END $$;
        "#,
    )
    .execute(&pool)
    .await
    .map_err(|e| format!("Failed to migrate clients table: {}", e))?;

    // Create orders table if not exists
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
            order_number INTEGER NOT NULL,
            client_requisition_number INTEGER NOT NULL,
            due_date DATE,
            discount DOUBLE PRECISION DEFAULT 0,
            iva DOUBLE PRECISION DEFAULT 0,
            subtotal DOUBLE PRECISION NOT NULL,
            total DOUBLE PRECISION NOT NULL,
            status TEXT NOT NULL DEFAULT 'order_received',
            debt DOUBLE PRECISION NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        "#,
    )
    .execute(&pool)
    .await
    .map_err(|e| format!("Failed to create orders table: {}", e))?;

    // Add order_number column to existing orders table if it doesn't exist
    sqlx::query(
        r#"
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'orders' 
                AND column_name = 'order_number'
            ) THEN
                ALTER TABLE orders ADD COLUMN order_number INTEGER NOT NULL DEFAULT 0;
            END IF;
        END $$;
        "#,
    )
    .execute(&pool)
    .await
    .map_err(|e| format!("Failed to add order_number column to orders table: {}", e))?;

    // Add client_requisition_number column to existing orders table if it doesn't exist
    sqlx::query(
        r#"
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'orders' 
                AND column_name = 'client_requisition_number'
            ) THEN
                ALTER TABLE orders ADD COLUMN client_requisition_number INTEGER NOT NULL DEFAULT 0;
            END IF;
        END $$;
        "#,
    )
    .execute(&pool)
    .await
    .map_err(|e| format!("Failed to add client_requisition_number column to orders table: {}", e))?;

    // Update existing orders with sequential numbers
    sqlx::query(
        r#"
        DO $$ 
        DECLARE
            order_rec RECORD;
            order_counter INTEGER := 1;
            client_counter INTEGER := 1;
            current_client_id TEXT := '';
        BEGIN
            -- Update order_number for all orders
            FOR order_rec IN SELECT id FROM orders ORDER BY created_at ASC LOOP
                UPDATE orders SET order_number = order_counter WHERE id = order_rec.id;
                order_counter := order_counter + 1;
            END LOOP;
            
            -- Update client_requisition_number for each client
            FOR order_rec IN SELECT id, client_id FROM orders ORDER BY created_at ASC LOOP
                IF order_rec.client_id != current_client_id THEN
                    current_client_id := order_rec.client_id;
                    client_counter := 1;
                ELSE
                    client_counter := client_counter + 1;
                END IF;
                UPDATE orders SET client_requisition_number = client_counter WHERE id = order_rec.id;
            END LOOP;
        END $$;
        "#,
    )
    .execute(&pool)
    .await
    .map_err(|e| format!("Failed to update existing orders with sequential numbers: {}", e))?;

    // Add status column to existing orders table if it doesn't exist
    sqlx::query(
        r#"
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'orders' 
                AND column_name = 'status'
            ) THEN
                ALTER TABLE orders ADD COLUMN status TEXT NOT NULL DEFAULT 'order_received';
            END IF;
        END $$;
        "#,
    )
    .execute(&pool)
    .await
    .map_err(|e| format!("Failed to add status column to orders table: {}", e))?;

    // Migrate from paid to debt column
    sqlx::query(
        r#"
        DO $$ 
        BEGIN
            -- Add debt column if it doesn't exist
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'orders' 
                AND column_name = 'debt'
            ) THEN
                ALTER TABLE orders ADD COLUMN debt DOUBLE PRECISION NOT NULL DEFAULT 0;
            END IF;
            
            -- If paid column exists, migrate data and remove it
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'orders' 
                AND column_name = 'paid'
            ) THEN
                -- Update debt based on paid status and total
                UPDATE orders 
                SET debt = CASE 
                    WHEN paid = true THEN 0 
                    ELSE total 
                END 
                WHERE debt = 0;
                
                -- Remove paid column
                ALTER TABLE orders DROP COLUMN paid;
            END IF;
        END $$;
        "#,
    )
    .execute(&pool)
    .await
    .map_err(|e| format!("Failed to migrate from paid to debt column: {}", e))?;

    // Add name column to existing orders table if it doesn't exist
    sqlx::query(
        r#"
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'orders' 
                AND column_name = 'name'
            ) THEN
                ALTER TABLE orders ADD COLUMN name TEXT NOT NULL DEFAULT 'Pedido sem nome';
            END IF;
        END $$;
        "#,
    )
    .execute(&pool)
    .await
    .map_err(|e| format!("Failed to add name column to orders table: {}", e))?;

    // Migrate existing REAL columns to DOUBLE PRECISION if they exist
    sqlx::query(
        r#"
        DO $$ 
        BEGIN
            -- Check if any column is still REAL and convert to DOUBLE PRECISION
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'orders' 
                AND column_name IN ('discount', 'iva', 'subtotal', 'total')
                AND data_type = 'real'
            ) THEN
                ALTER TABLE orders 
                    ALTER COLUMN discount TYPE DOUBLE PRECISION,
                    ALTER COLUMN iva TYPE DOUBLE PRECISION,
                    ALTER COLUMN subtotal TYPE DOUBLE PRECISION,
                    ALTER COLUMN total TYPE DOUBLE PRECISION;
            END IF;
        END $$;
        "#,
    )
    .execute(&pool)
    .await
    .map_err(|e| format!("Failed to migrate orders table column types: {}", e))?;


    sqlx::query(
        r#"
            CREATE TABLE IF NOT EXISTS impressions (
            id TEXT PRIMARY KEY NOT NULL,
            order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            size TEXT NOT NULL,
            material TEXT NOT NULL,
            description TEXT NOT NULL,
            price DOUBLE PRECISION NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        )"#
    )
    .execute(&pool)
    .await
    .map_err(|e| format!("Failed to create impressions table: {}", e))?;

    // Create users table if not exists
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            login TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        "#,
    )
    .execute(&pool)
    .await
    .map_err(|e| format!("Failed to create users table: {}", e))?;

    // Create clothes table if not exists
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS clothes (
            id TEXT PRIMARY KEY,
            order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
            clothing_type TEXT NOT NULL,
            custom_type TEXT,
            unit_price DOUBLE PRECISION NOT NULL DEFAULT 0,
            sizes TEXT NOT NULL, -- JSON string: {"S": 2, "M": 5, "L": 3}
            color TEXT NOT NULL,
            total_quantity INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        "#,
    )
    .execute(&pool)
    .await
    .map_err(|e| format!("Failed to create clothes table: {}", e))?;

            // Create clothing_services table if not exists
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS clothing_services (
                id TEXT PRIMARY KEY,
                clothes_id TEXT NOT NULL REFERENCES clothes(id) ON DELETE CASCADE,
                service_type TEXT NOT NULL,
                location TEXT NOT NULL,
                description TEXT,
                unit_price DOUBLE PRECISION NOT NULL DEFAULT 0,
                created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            "#,
        )
            .execute(&pool)
        .await
        .map_err(|e| format!("Failed to create clothing_services table: {}", e))?;

        // Add description column to existing clothing_services table if it doesn't exist
        sqlx::query(
            r#"
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'clothing_services' 
                    AND column_name = 'description'
                ) THEN
                    ALTER TABLE clothing_services ADD COLUMN description TEXT;
                END IF;
            END $$;
            "#,
        )
        .execute(&pool)
        .await
        .map_err(|e| format!("Failed to add description column to clothing_services table: {}", e))?;

    // Insert default users if table is empty
    let user_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM users")
        .fetch_one(&pool)
        .await
        .map_err(|e| format!("Failed to count users: {}", e))?;

    if user_count == 0 {
        // Insert default admin user
        let admin_id = uuid::Uuid::new_v4().to_string();
        let now = time::OffsetDateTime::now_utc();
        
        sqlx::query(
            r#"
            INSERT INTO users (id, login, password, role, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            "#,
        )
        .bind(&admin_id)
        .bind("admin")
        .bind("admin123")
        .bind("admin")
        .bind(now)
        .bind(now)
        .execute(&pool)
        .await
        .map_err(|e| format!("Failed to create admin user: {}", e))?;

        // Insert default user
        let user_id = uuid::Uuid::new_v4().to_string();
        
        sqlx::query(
            r#"
            INSERT INTO users (id, login, password, role, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            "#,
        )
        .bind(&user_id)
        .bind("admin")
        .bind("user123")
        .bind("user")
        .bind(now)
        .bind(now)
        .execute(&pool)
        .await
        .map_err(|e| format!("Failed to create default user: {}", e))?;
    }

    DB_POOL
        .set(pool)
        .map_err(|_| "Failed to set database pool".to_string())?;

    Ok(())
}

pub fn get_db_pool() -> Result<&'static Pool<Postgres>, String> {
    DB_POOL
        .get()
        .ok_or_else(|| "Database pool not initialized".to_string())
}
