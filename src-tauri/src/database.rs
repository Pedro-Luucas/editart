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
            client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
            due_date DATE,
            discount REAL DEFAULT 0,
            iva REAL DEFAULT 0,
            subtotal REAL NOT NULL,
            total REAL NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        "#,
    )
    .execute(&pool)
    .await
    .map_err(|e| format!("Failed to create orders table: {}", e))?;

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
