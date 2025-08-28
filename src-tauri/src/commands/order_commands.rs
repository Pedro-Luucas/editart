use crate::dto::{CreateOrderDto, UpdateOrderDto, OrderResponseDto};
use crate::services::OrderService;
use time::Date;

#[tauri::command]
pub async fn create_order(dto: CreateOrderDto) -> Result<OrderResponseDto, String> {
    let service = OrderService::new();
    service.create_order(dto).await
}

#[tauri::command]
pub async fn get_order_by_id(id: String) -> Result<Option<OrderResponseDto>, String> {
    let service = OrderService::new();
    service.get_order_by_id(&id).await
}

#[tauri::command]
pub async fn get_orders_by_client_id(client_id: String) -> Result<Vec<OrderResponseDto>, String> {
    let service = OrderService::new();
    service.get_orders_by_client_id(&client_id).await
}

#[tauri::command]
pub async fn get_orders_by_date_range(start_date: Date, end_date: Date) -> Result<Vec<OrderResponseDto>, String> {
    let service = OrderService::new();
    service.get_orders_by_date_range(start_date, end_date).await
}

#[tauri::command]
pub async fn list_orders() -> Result<Vec<OrderResponseDto>, String> {
    let service = OrderService::new();
    service.list_orders().await
}

#[tauri::command]
pub async fn update_order(id: String, dto: UpdateOrderDto) -> Result<Option<OrderResponseDto>, String> {
    let service = OrderService::new();
    service.update_order(&id, dto).await
}

#[tauri::command]
pub async fn delete_order(id: String) -> Result<bool, String> {
    let service = OrderService::new();
    service.delete_order(&id).await
}

#[tauri::command]
pub async fn pay_order_debt(id: String, payment_amount: f64) -> Result<bool, String> {
    let service = OrderService::new();
    service.pay_order_debt(&id, payment_amount).await
}
