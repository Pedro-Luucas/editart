use crate::dto::{ClothesDto, CreateClothesDto, UpdateClothesDto, CreateClothingServiceDto, UpdateClothingServiceDto, ClothingServiceDto};
use crate::services::ClothesService;

#[tauri::command]
pub async fn create_clothes(dto: CreateClothesDto) -> Result<ClothesDto, String> {
    let service = ClothesService::new();
    service.create_clothes(dto).await
}

#[tauri::command]
pub async fn get_clothes_by_id(id: String) -> Result<Option<ClothesDto>, String> {
    let service = ClothesService::new();
    service.get_clothes_by_id(&id).await
}

#[tauri::command]
pub async fn get_clothes_by_order_id(order_id: String) -> Result<Vec<ClothesDto>, String> {
    let service = ClothesService::new();
    service.get_clothes_by_order_id(&order_id).await
}

#[tauri::command]
pub async fn update_clothes(id: String, dto: UpdateClothesDto) -> Result<Option<ClothesDto>, String> {
    let service = ClothesService::new();
    service.update_clothes(&id, dto).await
}

#[tauri::command]
pub async fn delete_clothes(id: String) -> Result<bool, String> {
    let service = ClothesService::new();
    service.delete_clothes(&id).await
}

#[tauri::command]
pub async fn add_service_to_clothes(clothes_id: String, dto: CreateClothingServiceDto) -> Result<ClothingServiceDto, String> {
    let service = ClothesService::new();
    service.add_service_to_clothes(&clothes_id, dto).await
}

#[tauri::command]
pub async fn update_clothing_service(service_id: String, dto: UpdateClothingServiceDto) -> Result<Option<ClothingServiceDto>, String> {
    let service = ClothesService::new();
    service.update_service(&service_id, dto).await
}

#[tauri::command]
pub async fn delete_clothing_service(service_id: String) -> Result<bool, String> {
    let service = ClothesService::new();
    service.delete_service(&service_id).await
}

#[tauri::command]
pub async fn get_services_by_clothes_id(clothes_id: String) -> Result<Vec<ClothingServiceDto>, String> {
    let service = ClothesService::new();
    service.get_services_by_clothes_id(&clothes_id).await
}

#[tauri::command]
pub async fn calculate_order_clothes_total(order_id: String) -> Result<f64, String> {
    let service = ClothesService::new();
    service.calculate_order_clothes_total(&order_id).await
}
