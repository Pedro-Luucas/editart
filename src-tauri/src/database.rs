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
            requisition TEXT NOT NULL,
            observations TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        "#,
    )
    .execute(&pool)
    .await
    .map_err(|e| format!("Failed to create clients table: {}", e))?;

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
            due_date DATE,
            discount DOUBLE PRECISION DEFAULT 0,
            iva DOUBLE PRECISION DEFAULT 0,
            subtotal DOUBLE PRECISION NOT NULL,
            total DOUBLE PRECISION NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        "#,
    )
    .execute(&pool)
    .await
    .map_err(|e| format!("Failed to create orders table: {}", e))?;

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
                ALTER TABLE orders ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';
            END IF;
        END $$;
        "#,
    )
    .execute(&pool)
    .await
    .map_err(|e| format!("Failed to add status column to orders table: {}", e))?;

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
