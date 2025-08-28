use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use time::OffsetDateTime;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Client {
    pub id: String,
    pub name: String,
    pub nuit: String,
    pub contact: String,
    pub category: String,
    pub observations: String,
    pub debt: f64,
    pub created_at: OffsetDateTime,
    pub updated_at: OffsetDateTime,
}
