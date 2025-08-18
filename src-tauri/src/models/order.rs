use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use time::{Date, OffsetDateTime};

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Order {
    pub id: String,
    pub client_id: String,
    pub due_date: Date,
    pub discount: f64,
    pub iva: f64,
    pub subtotal: f64,
    pub total: f64,
    pub created_at: OffsetDateTime,
    pub updated_at: OffsetDateTime,
}
