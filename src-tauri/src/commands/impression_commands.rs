use crate::dto::{ImpressionDto, CreateImpressionDto, UpdateImpressionDto};
use crate::services::ImpressionService;

#[tauri::command]
pub async fn create_impression(dto: CreateImpressionDto) -> Result<ImpressionDto, String> {
    let service = ImpressionService::new();
    service.create_impression(dto).await
}

#[tauri::command]
pub async fn get_impression_by_id(id: String) -> Result<Option<ImpressionDto>, String> {
    let service = ImpressionService::new();
    service.get_impression_by_id(&id).await
}

#[tauri::command]
pub async fn get_impressions_by_order_id(order_id: String) -> Result<Vec<ImpressionDto>, String> {
    let service = ImpressionService::new();
    service.get_impressions_by_order_id(&order_id).await
}

#[tauri::command]
pub async fn update_impression(id: String, dto: UpdateImpressionDto) -> Result<Option<ImpressionDto>, String> {
    let service = ImpressionService::new();
    service.update_impression(&id, dto).await
}

#[tauri::command]
pub async fn delete_impression(id: String) -> Result<bool, String> {
    let service = ImpressionService::new();
    service.delete_impression(&id).await
}