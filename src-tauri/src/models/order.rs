use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use time::{Date, OffsetDateTime};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum OrderStatus {
    #[serde(rename = "pending")]
    Pending,
    #[serde(rename = "payment_pending")]
    PaymentPending,
    #[serde(rename = "paid")]
    Paid,
    #[serde(rename = "cancelled")]
    Cancelled,
}

impl Default for OrderStatus {
    fn default() -> Self {
        OrderStatus::Pending
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Order {
    pub id: String,
    pub name: String,
    pub client_id: String,
    pub due_date: Date,
    pub discount: f64,
    pub iva: f64,
    pub subtotal: f64,
    pub total: f64,
    pub status: String, // Will be converted to/from OrderStatus in DTOs
    pub created_at: OffsetDateTime,
    pub updated_at: OffsetDateTime,
}
