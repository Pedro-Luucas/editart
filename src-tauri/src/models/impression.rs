use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use time::OffsetDateTime;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Impression {
    pub id: String,
    pub order_id: String,
    pub name: String,
    pub size: String,
    pub material: String,
    pub description: String,
    pub price: f64,
    pub created_at: OffsetDateTime,
    pub updated_at: OffsetDateTime,
}