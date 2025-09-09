use sqlx::{Pool, Postgres, PgPool};
use std::sync::OnceLock;
use crate::config::{load_config};

static DB_POOL: OnceLock<Pool<Postgres>> = OnceLock::new();

pub async fn init_database() -> Result<(), String> {
    // Load configuration from AppData
    let config = load_config()?;
    let database_url = config.database.to_connection_string();

    let pool = PgPool::connect(&database_url)
        .await
        .map_err(|e| format!("Failed to connect to database: {}", e))?;


    // Create users table
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

    // Create clients table
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

    // Create orders table
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

    // Create impressions table
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
        )
        "#,
    )
    .execute(&pool)
    .await
    .map_err(|e| format!("Failed to create impressions table: {}", e))?;

    // Create clothes table
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

    // Create clothing_services table
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

    // Insert default users
    let admin_id = uuid::Uuid::new_v4().to_string();
    let user_id = uuid::Uuid::new_v4().to_string();
    let now = time::OffsetDateTime::now_utc();
    
    // Insert default admin user
    sqlx::query(
        r#"
        INSERT INTO users (id, login, password, role, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (login) DO NOTHING
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
    sqlx::query(
        r#"
        INSERT INTO users (id, login, password, role, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (login) DO NOTHING
        "#,
    )
    .bind(&user_id)
    .bind("user")
    .bind("user123")
    .bind("user")
    .bind(now)
    .bind(now)
    .execute(&pool)
    .await
    .map_err(|e| format!("Failed to create default user: {}", e))?;

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