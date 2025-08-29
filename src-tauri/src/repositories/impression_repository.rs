
use crate::database::get_db_pool;
use crate::models::Impression;
use time::OffsetDateTime;
use uuid::Uuid;

pub struct ImpressionRepository;

impl ImpressionRepository {
    pub async fn create(
        &self,
        order_id: String,
        name: String,
        size: String,
        material: String,
        description: String,
        price: f64,
    ) -> Result<Impression, String> {
        let pool = get_db_pool()?;
        
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
        
        let id = Uuid::new_v4().to_string();
        let now = OffsetDateTime::now_utc();

        let impression = sqlx::query_as::<_, Impression>(
            r#"
            INSERT INTO impressions (id, order_id, name, size, material, description, price, created_at, updated_at) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
            RETURNING *
            "#
        )
        .bind(&id)
        .bind(&order_id)
        .bind(&name)
        .bind(&size)
        .bind(&material)
        .bind(&description)
        .bind(price)
        .bind(now)
        .bind(now)
        .fetch_one(pool)
        .await
        .map_err(|e| format!("Failed to create impression: {}", e))?;

        Ok(impression)
    }

    pub async fn get_by_id(&self, id: &str) -> Result<Option<Impression>, String> {
        let pool = get_db_pool()?;
        
        let impression = sqlx::query_as::<_, Impression>(
            "SELECT * FROM impressions WHERE id = $1"
        )
        .bind(id)
        .fetch_optional(pool)
        .await
        .map_err(|e| format!("Failed to get impression by id: {}", e))?;

        Ok(impression)
    }

    pub async fn get_by_order_id(&self, order_id: &str) -> Result<Vec<Impression>, String> {
        let pool = get_db_pool()?;
        
        let impressions = sqlx::query_as::<_, Impression>(
            "SELECT * FROM impressions WHERE order_id = $1 ORDER BY created_at ASC"
        )
        .bind(order_id)
        .fetch_all(pool)
        .await
        .map_err(|e| format!("Failed to get impressions by order_id: {}", e))?;

        Ok(impressions)
    }

    pub async fn update(
        &self,
        id: &str,
        name: String,
        size: String,
        material: String,
        description: String,
        price: f64,
    ) -> Result<Option<Impression>, String> {
        let pool = get_db_pool()?;
        let now = OffsetDateTime::now_utc();

        let impression = sqlx::query_as::<_, Impression>(
            r#"
            UPDATE impressions 
            SET name = $2, size = $3, material = $4, description = $5, price = $6, updated_at = $7
            WHERE id = $1
            RETURNING *
            "#
        )
        .bind(id)
        .bind(&name)
        .bind(&size)
        .bind(&material)
        .bind(&description)
        .bind(price)
        .bind(now)
        .fetch_optional(pool)
        .await
        .map_err(|e| format!("Failed to update impression: {}", e))?;

        Ok(impression)
    }

    pub async fn delete(&self, id: &str) -> Result<bool, String> {
        let pool = get_db_pool()?;
        
        let result = sqlx::query("DELETE FROM impressions WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await
            .map_err(|e| format!("Failed to delete impression: {}", e))?;

        Ok(result.rows_affected() > 0)
    }
}