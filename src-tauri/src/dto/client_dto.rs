use serde::{Deserialize, Serialize};
use time::OffsetDateTime;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateClientDto {
    pub name: String,
    pub nuit: String,
    pub contact: String,
    pub category: String,
    pub observations: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateClientDto {
    pub name: Option<String>,
    pub nuit: Option<String>,
    pub contact: Option<String>,
    pub category: Option<String>,
    pub observations: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClientResponseDto {
    pub id: String,
    pub name: String,
    pub nuit: String,
    pub contact: String,
    pub category: String,
    pub observations: String,
    pub debt: f64,
    #[serde(with = "time::serde::rfc3339")]
    pub created_at: OffsetDateTime,
    #[serde(with = "time::serde::rfc3339")]
    pub updated_at: OffsetDateTime,
}

impl From<crate::models::Client> for ClientResponseDto {
    fn from(client: crate::models::Client) -> Self {
        Self {
            id: client.id,
            name: client.name,
            nuit: client.nuit,
            contact: client.contact,
            category: client.category,
            observations: client.observations,
            debt: client.debt,
            created_at: client.created_at,
            updated_at: client.updated_at,
        }
    }
}
