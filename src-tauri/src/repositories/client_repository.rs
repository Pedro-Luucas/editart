use crate::database::get_db_pool;
use crate::models::Client;
use time::OffsetDateTime;
use uuid::Uuid;

pub struct ClientRepository;

impl ClientRepository {
    pub async fn create(&self, name: String, nuit: String, contact: String, category: String, requisition: String, observations: String) -> Result<Client, String> {
        let pool = get_db_pool()?;
        let id = Uuid::new_v4().to_string();
        let now = OffsetDateTime::now_utc();

        let client = sqlx::query_as::<_, Client>(
            r#"
            INSERT INTO clients (id, name, nuit, contact, category, requisition, observations, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
            "#,
        )
        .bind(&id)
        .bind(&name)
        .bind(&nuit)
        .bind(&contact)
        .bind(&category)
        .bind(&requisition)
        .bind(&observations)
        .bind(now)
        .bind(now)
        .fetch_one(pool)
        .await
        .map_err(|e| format!("Failed to create client: {}", e))?;

        Ok(client)
    }

    pub async fn get_by_id(&self, id: &str) -> Result<Option<Client>, String> {
        let pool = get_db_pool()?;

        let client = sqlx::query_as::<_, Client>(
            "SELECT * FROM clients WHERE id = $1"
        )
        .bind(id)
        .fetch_optional(pool)
        .await
        .map_err(|e| format!("Failed to get client by id: {}", e))?;

        Ok(client)
    }

    pub async fn get_by_name(&self, name: &str) -> Result<Vec<Client>, String> {
        let pool = get_db_pool()?;

        let clients = sqlx::query_as::<_, Client>(
            "SELECT * FROM clients WHERE name ILIKE $1 ORDER BY name"
        )
        .bind(format!("%{}%", name))
        .fetch_all(pool)
        .await
        .map_err(|e| format!("Failed to get clients by name: {}", e))?;

        Ok(clients)
    }

    pub async fn list(&self) -> Result<Vec<Client>, String> {
        let pool = get_db_pool()?;

        let clients = sqlx::query_as::<_, Client>(
            "SELECT * FROM clients ORDER BY created_at DESC"
        )
        .fetch_all(pool)
        .await
        .map_err(|e| format!("Failed to list clients: {}", e))?;

        Ok(clients)
    }

    pub async fn update(&self, id: &str, name: Option<String>, nuit: Option<String>, contact: Option<String>, category: Option<String>, requisition: Option<String>, observations: Option<String>) -> Result<Option<Client>, String> {
        let pool = get_db_pool()?;
        let now = OffsetDateTime::now_utc();

        // First, get the current client
        let current_client = self.get_by_id(id).await?;
        let current_client = match current_client {
            Some(client) => client,
            None => return Ok(None),
        };

        // Use provided values or keep current values
        let updated_name = name.unwrap_or(current_client.name);
        let updated_nuit = nuit.unwrap_or(current_client.nuit);
        let updated_contact = contact.unwrap_or(current_client.contact);
        let updated_category = category.unwrap_or(current_client.category);
        let updated_requisition = requisition.unwrap_or(current_client.requisition);
        let updated_observations = observations.unwrap_or(current_client.observations);

        let client = sqlx::query_as::<_, Client>(
            r#"
            UPDATE clients 
            SET name = $2, nuit = $3, contact = $4, category = $5, requisition = $6, observations = $7, updated_at = $8
            WHERE id = $1
            RETURNING *
            "#,
        )
        .bind(id)
        .bind(updated_name)
        .bind(updated_nuit)
        .bind(updated_contact)
        .bind(updated_category)
        .bind(updated_requisition)
        .bind(updated_observations)
        .bind(now)
        .fetch_optional(pool)
        .await
        .map_err(|e| format!("Failed to update client: {}", e))?;

        Ok(client)
    }

    pub async fn delete(&self, id: &str) -> Result<bool, String> {
        let pool = get_db_pool()?;

        let result = sqlx::query("DELETE FROM clients WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await
            .map_err(|e| format!("Failed to delete client: {}", e))?;

        Ok(result.rows_affected() > 0)
    }
}
