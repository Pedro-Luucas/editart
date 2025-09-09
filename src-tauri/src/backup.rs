use crate::database::get_db_pool;
use serde::{Deserialize, Serialize};
use sqlx::{Row, FromRow};
use std::path::PathBuf;
use time::{OffsetDateTime, macros::format_description};

#[derive(Debug, Serialize, Deserialize)]
pub struct DatabaseBackup {
    pub version: String,
    pub created_at: String,
    pub users: Vec<UserBackup>,
    pub clients: Vec<ClientBackup>,
    pub orders: Vec<OrderBackup>,
    pub impressions: Vec<ImpressionBackup>,
    pub clothes: Vec<ClothesBackup>,
    pub clothing_services: Vec<ClothingServiceBackup>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct UserBackup {
    pub id: String,
    pub login: String,
    pub password: String,
    pub role: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct ClientBackup {
    pub id: String,
    pub name: String,
    pub nuit: String,
    pub contact: String,
    pub category: String,
    pub observations: String,
    pub debt: f64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct OrderBackup {
    pub id: String,
    pub name: String,
    pub client_id: String,
    pub order_number: i32,
    pub client_requisition_number: i32,
    pub due_date: Option<String>,
    pub discount: Option<f64>,
    pub iva: Option<f64>,
    pub subtotal: f64,
    pub total: f64,
    pub status: String,
    pub debt: f64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct ImpressionBackup {
    pub id: String,
    pub order_id: String,
    pub name: String,
    pub size: String,
    pub material: String,
    pub description: String,
    pub price: f64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct ClothesBackup {
    pub id: String,
    pub order_id: String,
    pub clothing_type: String,
    pub custom_type: Option<String>,
    pub unit_price: f64,
    pub sizes: String,
    pub color: String,
    pub total_quantity: i32,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct ClothingServiceBackup {
    pub id: String,
    pub clothes_id: String,
    pub service_type: String,
    pub location: String,
    pub description: Option<String>,
    pub unit_price: f64,
    pub created_at: String,
    pub updated_at: String,
}

pub struct BackupService;

impl BackupService {
    pub async fn create_backup() -> Result<String, String> {
        log::info!("Starting database backup process...");
        
        let pool = get_db_pool()?;
        let mut backup = DatabaseBackup {
            version: "1.0.0".to_string(),
            created_at: OffsetDateTime::now_utc().to_string(),
            users: Vec::new(),
            clients: Vec::new(),
            orders: Vec::new(),
            impressions: Vec::new(),
            clothes: Vec::new(),
            clothing_services: Vec::new(),
        };

        // Backup users
        log::info!("Backing up users table...");
        let users_rows = sqlx::query("SELECT id, login, password, role, created_at, updated_at FROM users ORDER BY created_at")
            .fetch_all(pool)
            .await
            .map_err(|e| {
                log::error!("Failed to fetch users: {}", e);
                format!("Failed to fetch users: {}", e)
            })?;

        for row in users_rows {
            backup.users.push(UserBackup {
                id: row.get("id"),
                login: row.get("login"),
                password: row.get("password"),
                role: row.get("role"),
                created_at: row.get::<OffsetDateTime, _>("created_at").to_string(),
                updated_at: row.get::<OffsetDateTime, _>("updated_at").to_string(),
            });
        }
        log::info!("Backed up {} users", backup.users.len());

        // Backup clients
        log::info!("Backing up clients table...");
        let clients_rows = sqlx::query("SELECT * FROM clients ORDER BY created_at")
            .fetch_all(pool)
            .await
            .map_err(|e| {
                log::error!("Failed to fetch clients: {}", e);
                format!("Failed to fetch clients: {}", e)
            })?;

        for row in clients_rows {
            backup.clients.push(ClientBackup {
                id: row.get("id"),
                name: row.get("name"),
                nuit: row.get("nuit"),
                contact: row.get("contact"),
                category: row.get("category"),
                observations: row.get("observations"),
                debt: row.get("debt"),
                created_at: row.get::<OffsetDateTime, _>("created_at").to_string(),
                updated_at: row.get::<OffsetDateTime, _>("updated_at").to_string(),
            });
        }
        log::info!("Backed up {} clients", backup.clients.len());

        // Backup orders
        log::info!("Backing up orders table...");
        let orders_rows = sqlx::query("SELECT * FROM orders ORDER BY created_at")
            .fetch_all(pool)
            .await
            .map_err(|e| {
                log::error!("Failed to fetch orders: {}", e);
                format!("Failed to fetch orders: {}", e)
            })?;

        for row in orders_rows {
            backup.orders.push(OrderBackup {
                id: row.get("id"),
                name: row.get("name"),
                client_id: row.get("client_id"),
                order_number: row.get("order_number"),
                client_requisition_number: row.get("client_requisition_number"),
                due_date: row.get::<Option<time::Date>, _>("due_date").map(|d| d.to_string()),
                discount: row.get("discount"),
                iva: row.get("iva"),
                subtotal: row.get("subtotal"),
                total: row.get("total"),
                status: row.get("status"),
                debt: row.get("debt"),
                created_at: row.get::<OffsetDateTime, _>("created_at").to_string(),
                updated_at: row.get::<OffsetDateTime, _>("updated_at").to_string(),
            });
        }
        log::info!("Backed up {} orders", backup.orders.len());

        // Backup impressions
        log::info!("Backing up impressions table...");
        let impressions_rows = sqlx::query("SELECT * FROM impressions ORDER BY created_at")
            .fetch_all(pool)
            .await
            .map_err(|e| {
                log::error!("Failed to fetch impressions: {}", e);
                format!("Failed to fetch impressions: {}", e)
            })?;

        for row in impressions_rows {
            backup.impressions.push(ImpressionBackup {
                id: row.get("id"),
                order_id: row.get("order_id"),
                name: row.get("name"),
                size: row.get("size"),
                material: row.get("material"),
                description: row.get("description"),
                price: row.get("price"),
                created_at: row.get::<OffsetDateTime, _>("created_at").to_string(),
                updated_at: row.get::<OffsetDateTime, _>("updated_at").to_string(),
            });
        }
        log::info!("Backed up {} impressions", backup.impressions.len());

        // Backup clothes
        log::info!("Backing up clothes table...");
        let clothes_rows = sqlx::query("SELECT * FROM clothes ORDER BY created_at")
            .fetch_all(pool)
            .await
            .map_err(|e| {
                log::error!("Failed to fetch clothes: {}", e);
                format!("Failed to fetch clothes: {}", e)
            })?;

        for row in clothes_rows {
            backup.clothes.push(ClothesBackup {
                id: row.get("id"),
                order_id: row.get("order_id"),
                clothing_type: row.get("clothing_type"),
                custom_type: row.get("custom_type"),
                unit_price: row.get("unit_price"),
                sizes: row.get("sizes"),
                color: row.get("color"),
                total_quantity: row.get("total_quantity"),
                created_at: row.get::<OffsetDateTime, _>("created_at").to_string(),
                updated_at: row.get::<OffsetDateTime, _>("updated_at").to_string(),
            });
        }
        log::info!("Backed up {} clothes", backup.clothes.len());

        // Backup clothing_services
        log::info!("Backing up clothing_services table...");
        let services_rows = sqlx::query("SELECT * FROM clothing_services ORDER BY created_at")
            .fetch_all(pool)
            .await
            .map_err(|e| {
                log::error!("Failed to fetch clothing_services: {}", e);
                format!("Failed to fetch clothing_services: {}", e)
            })?;

        for row in services_rows {
            backup.clothing_services.push(ClothingServiceBackup {
                id: row.get("id"),
                clothes_id: row.get("clothes_id"),
                service_type: row.get("service_type"),
                location: row.get("location"),
                description: row.get("description"),
                unit_price: row.get("unit_price"),
                created_at: row.get::<OffsetDateTime, _>("created_at").to_string(),
                updated_at: row.get::<OffsetDateTime, _>("updated_at").to_string(),
            });
        }
        log::info!("Backed up {} clothing services", backup.clothing_services.len());

        // Save to JSON file
        let backup_path = Self::get_backup_file_path()?;
        let json_content = serde_json::to_string_pretty(&backup)
            .map_err(|e| {
                log::error!("Failed to serialize backup to JSON: {}", e);
                format!("Failed to serialize backup: {}", e)
            })?;

        std::fs::write(&backup_path, json_content)
            .map_err(|e| {
                log::error!("Failed to write backup file to {:?}: {}", backup_path, e);
                format!("Failed to write backup file: {}", e)
            })?;

        let success_message = format!("Database backup completed successfully! Saved to: {:?}", backup_path);
        log::info!("{}", success_message);
        Ok(success_message)
    }

    pub async fn restore_backup() -> Result<String, String> {
        log::info!("Starting database restore process...");
        
        let backup_path = Self::get_backup_file_path()?;
        
        if !backup_path.exists() {
            let error_msg = format!("Backup file not found at: {:?}", backup_path);
            log::error!("{}", error_msg);
            return Err(error_msg);
        }

        // Read and parse backup file
        log::info!("Reading backup file from: {:?}", backup_path);
        let json_content = std::fs::read_to_string(&backup_path)
            .map_err(|e| {
                log::error!("Failed to read backup file: {}", e);
                format!("Failed to read backup file: {}", e)
            })?;

        let backup: DatabaseBackup = serde_json::from_str(&json_content)
            .map_err(|e| {
                log::error!("Failed to parse backup JSON: {}", e);
                format!("Failed to parse backup file: {}", e)
            })?;

        log::info!("Backup file loaded successfully. Version: {}, Created: {}", 
                  backup.version, backup.created_at);

        let pool = get_db_pool()?;

        // Clear all existing data (in reverse order due to foreign keys)
        log::info!("Clearing existing database data...");
        
        sqlx::query("DELETE FROM clothing_services")
            .execute(pool)
            .await
            .map_err(|e| format!("Failed to clear clothing_services: {}", e))?;
        log::info!("Cleared clothing_services table");

        sqlx::query("DELETE FROM clothes")
            .execute(pool)
            .await
            .map_err(|e| format!("Failed to clear clothes: {}", e))?;
        log::info!("Cleared clothes table");

        sqlx::query("DELETE FROM impressions")
            .execute(pool)
            .await
            .map_err(|e| format!("Failed to clear impressions: {}", e))?;
        log::info!("Cleared impressions table");

        sqlx::query("DELETE FROM orders")
            .execute(pool)
            .await
            .map_err(|e| format!("Failed to clear orders: {}", e))?;
        log::info!("Cleared orders table");

        sqlx::query("DELETE FROM clients")
            .execute(pool)
            .await
            .map_err(|e| format!("Failed to clear clients: {}", e))?;
        log::info!("Cleared clients table");

        sqlx::query("DELETE FROM users")
            .execute(pool)
            .await
            .map_err(|e| format!("Failed to clear users: {}", e))?;
        log::info!("Cleared users table");

        // Restore data (in order of dependencies)
        log::info!("Restoring users... ({} records)", backup.users.len());
        for user in &backup.users {
            let created_at = OffsetDateTime::parse(&user.created_at, &time::format_description::well_known::Rfc3339)
                .map_err(|e| format!("Failed to parse created_at for user {}: {}", user.id, e))?;
            let updated_at = OffsetDateTime::parse(&user.updated_at, &time::format_description::well_known::Rfc3339)
                .map_err(|e| format!("Failed to parse updated_at for user {}: {}", user.id, e))?;

            sqlx::query(
                r#"
                INSERT INTO users (id, login, password, role, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6)
                "#,
            )
            .bind(&user.id)
            .bind(&user.login)
            .bind(&user.password)
            .bind(&user.role)
            .bind(created_at)
            .bind(updated_at)
            .execute(pool)
            .await
            .map_err(|e| format!("Failed to restore user {}: {}", user.id, e))?;
        }
        log::info!("Restored {} users", backup.users.len());

        log::info!("Restoring clients... ({} records)", backup.clients.len());
        for client in &backup.clients {
            let created_at = OffsetDateTime::parse(&client.created_at, &time::format_description::well_known::Rfc3339)
                .map_err(|e| format!("Failed to parse created_at for client {}: {}", client.id, e))?;
            let updated_at = OffsetDateTime::parse(&client.updated_at, &time::format_description::well_known::Rfc3339)
                .map_err(|e| format!("Failed to parse updated_at for client {}: {}", client.id, e))?;

            sqlx::query(
                r#"
                INSERT INTO clients (id, name, nuit, contact, category, observations, debt, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                "#,
            )
            .bind(&client.id)
            .bind(&client.name)
            .bind(&client.nuit)
            .bind(&client.contact)
            .bind(&client.category)
            .bind(&client.observations)
            .bind(client.debt)
            .bind(created_at)
            .bind(updated_at)
            .execute(pool)
            .await
            .map_err(|e| format!("Failed to restore client {}: {}", client.id, e))?;
        }
        log::info!("Restored {} clients", backup.clients.len());

        log::info!("Restoring orders... ({} records)", backup.orders.len());
        for order in &backup.orders {
            let created_at = OffsetDateTime::parse(&order.created_at, &time::format_description::well_known::Rfc3339)
                .map_err(|e| format!("Failed to parse created_at for order {}: {}", order.id, e))?;
            let updated_at = OffsetDateTime::parse(&order.updated_at, &time::format_description::well_known::Rfc3339)
                .map_err(|e| format!("Failed to parse updated_at for order {}: {}", order.id, e))?;

            let due_date = match &order.due_date {
                Some(date_str) => {
                    Some(time::Date::parse(&date_str, &time::format_description::well_known::Iso8601::DATE)
                        .map_err(|e| format!("Failed to parse due_date for order {}: {}", order.id, e))?)
                },
                None => None,
            };

            sqlx::query(
                r#"
                INSERT INTO orders (id, name, client_id, order_number, client_requisition_number, due_date, discount, iva, subtotal, total, status, debt, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                "#,
            )
            .bind(&order.id)
            .bind(&order.name)
            .bind(&order.client_id)
            .bind(order.order_number)
            .bind(order.client_requisition_number)
            .bind(due_date)
            .bind(order.discount)
            .bind(order.iva)
            .bind(order.subtotal)
            .bind(order.total)
            .bind(&order.status)
            .bind(order.debt)
            .bind(created_at)
            .bind(updated_at)
            .execute(pool)
            .await
            .map_err(|e| format!("Failed to restore order {}: {}", order.id, e))?;
        }
          log::info!("Restored {} orders", backup.orders.len());

          log::info!("Restoring impressions... ({} records)", backup.impressions.len());
          for impression in &backup.impressions {
            let format = format_description!("[year]-[month]-[day] [hour]:[minute]:[second]");
            
              let created_at = OffsetDateTime::parse(&impression.created_at, &format)
                .map_err(|e| format!("Failed to parse created_at for impression {}: {}", impression.id, e))?;
            
            let updated_at = OffsetDateTime::parse(&impression.updated_at, &format)
                  .map_err(|e| format!("Failed to parse updated_at for impression {}: {}", impression.id, e))?;

              sqlx::query(
                r#"
                INSERT INTO impressions (id, order_id, name, size, material, description, price, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                "#,
            )
            .bind(&impression.id)
            .bind(&impression.order_id)
            .bind(&impression.name)
            .bind(&impression.size)
            .bind(&impression.material)
            .bind(&impression.description)
            .bind(impression.price)
            .bind(created_at)
            .bind(updated_at)
            .execute(pool)
            .await
            .map_err(|e| format!("Failed to restore impression {}: {}", impression.id, e))?;
        }
        log::info!("Restored {} impressions", backup.impressions.len());

        log::info!("Restoring clothes... ({} records)", backup.clothes.len());
        for clothes in &backup.clothes {
            let created_at = OffsetDateTime::parse(&clothes.created_at, &time::format_description::well_known::Rfc3339)
                .map_err(|e| format!("Failed to parse created_at for clothes {}: {}", clothes.id, e))?;
            let updated_at = OffsetDateTime::parse(&clothes.updated_at, &time::format_description::well_known::Rfc3339)
                .map_err(|e| format!("Failed to parse updated_at for clothes {}: {}", clothes.id, e))?;

            sqlx::query(
                r#"
                INSERT INTO clothes (id, order_id, clothing_type, custom_type, unit_price, sizes, color, total_quantity, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                "#,
            )
            .bind(&clothes.id)
            .bind(&clothes.order_id)
            .bind(&clothes.clothing_type)
            .bind(&clothes.custom_type)
            .bind(clothes.unit_price)
            .bind(&clothes.sizes)
            .bind(&clothes.color)
            .bind(clothes.total_quantity)
            .bind(created_at)
            .bind(updated_at)
            .execute(pool)
            .await
            .map_err(|e| format!("Failed to restore clothes {}: {}", clothes.id, e))?;
        }
        log::info!("Restored {} clothes", backup.clothes.len());

        log::info!("Restoring clothing services... ({} records)", backup.clothing_services.len());
        for service in &backup.clothing_services {
            let created_at = OffsetDateTime::parse(&service.created_at, &time::format_description::well_known::Rfc3339)
                .map_err(|e| format!("Failed to parse created_at for service {}: {}", service.id, e))?;
            let updated_at = OffsetDateTime::parse(&service.updated_at, &time::format_description::well_known::Rfc3339)
                .map_err(|e| format!("Failed to parse updated_at for service {}: {}", service.id, e))?;

            sqlx::query(
                r#"
                INSERT INTO clothing_services (id, clothes_id, service_type, location, description, unit_price, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                "#,
            )
            .bind(&service.id)
            .bind(&service.clothes_id)
            .bind(&service.service_type)
            .bind(&service.location)
            .bind(&service.description)
            .bind(service.unit_price)
            .bind(created_at)
            .bind(updated_at)
            .execute(pool)
            .await
            .map_err(|e| format!("Failed to restore clothing service {}: {}", service.id, e))?;
        }
        log::info!("Restored {} clothing services", backup.clothing_services.len());

        let success_message = format!("Database restored successfully from backup created on {}", backup.created_at);
        log::info!("{}", success_message);
        Ok(success_message) 
    }

    fn get_backup_file_path() -> Result<PathBuf, String> {
      let app_data_dir = dirs::data_dir()
            .ok_or_else(|| "Failed to get app data directory".to_string())?;

        std::fs::create_dir_all(&app_data_dir)
            .map_err(|e| format!("Failed to create app data directory: {}", e))?;

        Ok(app_data_dir.join("database_backup.json"))
    }

    pub fn get_backup_info() -> Result<Option<String>, String> {
        let backup_path = Self::get_backup_file_path()?;
        
        if !backup_path.exists() {
            return Ok(None);
        }

        let metadata = std::fs::metadata(&backup_path)
            .map_err(|e| format!("Failed to read backup file metadata: {}", e))?;



        // Read just the header info for backup details
        match std::fs::read_to_string(&backup_path) {
            Ok(content) => {
                match serde_json::from_str::<serde_json::Value>(&content) {
                    Ok(json) => {
                        let version = json.get("version").and_then(|v| v.as_str()).unwrap_or("unknown");
                        let created_at = json.get("created_at").and_then(|v| v.as_str()).unwrap_or("unknown");
                        
                        Ok(Some(format!(
                            "Backup found - Version: {}, Created: {}, File size: {} bytes", 
                            version, created_at, metadata.len()
                        )))
                    }
                    Err(_) => Ok(Some(format!("Backup file found but corrupted - Size: {} bytes", metadata.len())))
                }
            }
            Err(_) => Ok(Some(format!("Backup file found but unreadable - Size: {} bytes", metadata.len())))
        }
    }
}