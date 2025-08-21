use serde::{Deserialize, Serialize};
use time::{Date, OffsetDateTime};
use crate::models::OrderStatus;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateOrderDto {
    pub name: String,
    pub client_id: String,
    pub due_date: Date,
    pub iva: f64,
    pub discount: Option<f64>,
    pub status: Option<OrderStatus>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateOrderDto {
    pub name: Option<String>,
    pub client_id: Option<String>,
    pub due_date: Option<Date>,
    pub discount: Option<f64>,
    pub iva: Option<f64>,
    pub subtotal: Option<f64>,
    pub total: Option<f64>,
    pub status: Option<OrderStatus>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrderResponseDto {
    pub id: String,
    pub name: String,
    pub client_id: String,
    pub client_name: String,
    pub client_contact: String,
    pub due_date: Date,
    pub discount: f64,
    pub iva: f64,
    pub subtotal: f64,
    pub total: f64,
    pub status: OrderStatus,
    #[serde(with = "time::serde::rfc3339")]
    pub created_at: OffsetDateTime,
    #[serde(with = "time::serde::rfc3339")]
    pub updated_at: OffsetDateTime,
}

impl From<(crate::models::Order, String, String)> for OrderResponseDto {
    fn from((order, client_name, client_contact): (crate::models::Order, String, String)) -> Self {
        let status = match order.status.as_str() {
            "payment_pending" => OrderStatus::PaymentPending,
            "paid" => OrderStatus::Paid,
            "cancelled" => OrderStatus::Cancelled,
            _ => OrderStatus::Pending,
        };
        
        Self {
            id: order.id,
            name: order.name,
            client_id: order.client_id,
            client_name,
            client_contact,
            due_date: order.due_date,
            discount: order.discount,
            iva: order.iva,
            subtotal: order.subtotal,
            total: order.total,
            status,
            created_at: order.created_at,
            updated_at: order.updated_at,
        }
    }
}
