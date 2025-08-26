use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use time::{Date, OffsetDateTime};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum OrderStatus {
    #[serde(rename = "order_received")]
    OrderReceived,
    #[serde(rename = "in_production")]
    InProduction,
    #[serde(rename = "ready_for_delivery")]
    ReadyForDelivery,
    #[serde(rename = "delivered")]
    Delivered,
}

impl Default for OrderStatus {
    fn default() -> Self {
        OrderStatus::OrderReceived
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Order {
    pub id: String,
    pub name: String,
    pub client_id: String,
    pub order_number: i32,
    pub client_requisition_number: i32,
    pub due_date: Date,
    pub discount: f64,
    pub iva: f64,
    pub subtotal: f64,
    pub total: f64,
    pub status: String, // Will be converted to/from OrderStatus in DTOs
    pub paid: bool,
    pub created_at: OffsetDateTime,
    pub updated_at: OffsetDateTime,
}
