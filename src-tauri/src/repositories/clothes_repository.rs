use crate::database::get_db_pool;
use crate::models::{Clothes, ClothingService};
use time::OffsetDateTime;
use uuid::Uuid;

pub struct ClothesRepository;

impl ClothesRepository {
    pub async fn create(&self, 
        order_id: String, 
        clothing_type: String, 
        custom_type: Option<String>,
        unit_price: f64,
        sizes: String, // JSON string
        color: String,
        total_quantity: i32
    ) -> Result<Clothes, String> {
        let pool = get_db_pool()?;
        let id = Uuid::new_v4().to_string();
        let now = OffsetDateTime::now_utc();

        // Validate that order exists
        let order_exists = sqlx::query_scalar::<_, bool>(
            "SELECT EXISTS(SELECT 1 FROM orders WHERE id = $1)"
        )
        .bind(&order_id)
        .fetch_one(pool)
        .await
        .map_err(|e| format!("Failed to validate order: {}", e))?;

        if !order_exists {
            return Err("Order not found".to_string());
        }

        let clothes = sqlx::query_as::<_, Clothes>(
            r#"
            INSERT INTO clothes (id, order_id, clothing_type, custom_type, unit_price, sizes, color, total_quantity, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
            "#,
        )
        .bind(&id)
        .bind(&order_id)
        .bind(&clothing_type)
        .bind(&custom_type)
        .bind(unit_price)
        .bind(&sizes)
        .bind(&color)
        .bind(total_quantity)
        .bind(now)
        .bind(now)
        .fetch_one(pool)
        .await
        .map_err(|e| format!("Failed to create clothes: {}", e))?;

        Ok(clothes)
    }

    pub async fn get_by_id(&self, id: &str) -> Result<Option<Clothes>, String> {
        let pool = get_db_pool()?;

        let clothes = sqlx::query_as::<_, Clothes>(
            "SELECT * FROM clothes WHERE id = $1"
        )
        .bind(id)
        .fetch_optional(pool)
        .await
        .map_err(|e| format!("Failed to get clothes by id: {}", e))?;

        Ok(clothes)
    }

    pub async fn get_by_order_id(&self, order_id: &str) -> Result<Vec<Clothes>, String> {
        let pool = get_db_pool()?;

        let clothes = sqlx::query_as::<_, Clothes>(
            "SELECT * FROM clothes WHERE order_id = $1 ORDER BY created_at ASC"
        )
        .bind(order_id)
        .fetch_all(pool)
        .await
        .map_err(|e| format!("Failed to get clothes by order_id: {}", e))?;

        Ok(clothes)
    }

    pub async fn update(&self, 
        id: &str, 
        clothing_type: Option<String>,
        custom_type: Option<Option<String>>,
        unit_price: Option<f64>,
        sizes: Option<String>,
        color: Option<String>,
        total_quantity: Option<i32>
    ) -> Result<Option<Clothes>, String> {
        let pool = get_db_pool()?;
        let now = OffsetDateTime::now_utc();

        // Get current clothes data
        let current = self.get_by_id(id).await?;
        let current = match current {
            Some(clothes) => clothes,
            None => return Ok(None),
        };

        let updated_clothes = sqlx::query_as::<_, Clothes>(
            r#"
            UPDATE clothes 
            SET clothing_type = $2, 
                custom_type = $3, 
                unit_price = $4, 
                sizes = $5, 
                color = $6, 
                total_quantity = $7, 
                updated_at = $8
            WHERE id = $1
            RETURNING *
            "#,
        )
        .bind(id)
        .bind(clothing_type.unwrap_or(current.clothing_type))
        .bind(custom_type.unwrap_or(current.custom_type))
        .bind(unit_price.unwrap_or(current.unit_price))
        .bind(sizes.unwrap_or(current.sizes))
        .bind(color.unwrap_or(current.color))
        .bind(total_quantity.unwrap_or(current.total_quantity))
        .bind(now)
        .fetch_one(pool)
        .await
        .map_err(|e| format!("Failed to update clothes: {}", e))?;

        Ok(Some(updated_clothes))
    }

    pub async fn delete(&self, id: &str) -> Result<bool, String> {
        let pool = get_db_pool()?;

        let result = sqlx::query("DELETE FROM clothes WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await
            .map_err(|e| format!("Failed to delete clothes: {}", e))?;

        Ok(result.rows_affected() > 0)
    }
}

pub struct ClothingServiceRepository;

impl ClothingServiceRepository {
    pub async fn create(&self, 
        clothes_id: String, 
        service_type: String, 
        location: String,
        description: Option<String>,
        unit_price: f64
    ) -> Result<ClothingService, String> {
        let pool = get_db_pool()?;
        let id = Uuid::new_v4().to_string();
        let now = OffsetDateTime::now_utc();

        // Validate that clothes exists
        let clothes_exists = sqlx::query_scalar::<_, bool>(
            "SELECT EXISTS(SELECT 1 FROM clothes WHERE id = $1)"
        )
        .bind(&clothes_id)
        .fetch_one(pool)
        .await
        .map_err(|e| format!("Failed to validate clothes: {}", e))?;

        if !clothes_exists {
            return Err("Clothes not found".to_string());
        }

        let service = sqlx::query_as::<_, ClothingService>(
            r#"
            INSERT INTO clothing_services (id, clothes_id, service_type, location, description, unit_price, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
            "#,
        )
        .bind(&id)
        .bind(&clothes_id)
        .bind(&service_type)
        .bind(&location)
        .bind(&description)
        .bind(unit_price)
        .bind(now)
        .bind(now)
        .fetch_one(pool)
        .await
        .map_err(|e| format!("Failed to create clothing service: {}", e))?;

        Ok(service)
    }

    pub async fn get_by_id(&self, id: &str) -> Result<Option<ClothingService>, String> {
        let pool = get_db_pool()?;

        let service = sqlx::query_as::<_, ClothingService>(
            "SELECT * FROM clothing_services WHERE id = $1"
        )
        .bind(id)
        .fetch_optional(pool)
        .await
        .map_err(|e| format!("Failed to get clothing service by id: {}", e))?;

        Ok(service)
    }

    pub async fn get_by_clothes_id(&self, clothes_id: &str) -> Result<Vec<ClothingService>, String> {
        let pool = get_db_pool()?;

        let services = sqlx::query_as::<_, ClothingService>(
            "SELECT * FROM clothing_services WHERE clothes_id = $1 ORDER BY created_at ASC"
        )
        .bind(clothes_id)
        .fetch_all(pool)
        .await
        .map_err(|e| format!("Failed to get clothing services by clothes_id: {}", e))?;

        Ok(services)
    }

    pub async fn update(&self, 
        id: &str, 
        service_type: Option<String>,
        location: Option<String>,
        description: Option<Option<String>>,
        unit_price: Option<f64>
    ) -> Result<Option<ClothingService>, String> {
        let pool = get_db_pool()?;
        let now = OffsetDateTime::now_utc();

        // Get current service data
        let current = self.get_by_id(id).await?;
        let current = match current {
            Some(service) => service,
            None => return Ok(None),
        };

        let updated_service = sqlx::query_as::<_, ClothingService>(
            r#"
            UPDATE clothing_services 
            SET service_type = $2, 
                location = $3, 
                description = $4, 
                unit_price = $5, 
                updated_at = $6
            WHERE id = $1
            RETURNING *
            "#,
        )
        .bind(id)
        .bind(service_type.unwrap_or(current.service_type))
        .bind(location.unwrap_or(current.location))
        .bind(description.unwrap_or(current.description))
        .bind(unit_price.unwrap_or(current.unit_price))
        .bind(now)
        .fetch_one(pool)
        .await
        .map_err(|e| format!("Failed to update clothing service: {}", e))?;

        Ok(Some(updated_service))
    }

    pub async fn delete(&self, id: &str) -> Result<bool, String> {
        let pool = get_db_pool()?;

        let result = sqlx::query("DELETE FROM clothing_services WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await
            .map_err(|e| format!("Failed to delete clothing service: {}", e))?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn delete_by_clothes_id(&self, clothes_id: &str) -> Result<u64, String> {
        let pool = get_db_pool()?;

        let result = sqlx::query("DELETE FROM clothing_services WHERE clothes_id = $1")
            .bind(clothes_id)
            .execute(pool)
            .await
            .map_err(|e| format!("Failed to delete clothing services by clothes_id: {}", e))?;

        Ok(result.rows_affected())
    }
}
