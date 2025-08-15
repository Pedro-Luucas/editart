use crate::dto::{CreateClientDto, UpdateClientDto, ClientResponseDto};
use crate::services::ClientService;

#[tauri::command]
pub async fn create_client(dto: CreateClientDto) -> Result<ClientResponseDto, String> {
    let service = ClientService::new();
    service.create_client(dto).await
}

#[tauri::command]
pub async fn get_client_by_id(id: String) -> Result<Option<ClientResponseDto>, String> {
    let service = ClientService::new();
    service.get_client_by_id(&id).await
}

#[tauri::command]
pub async fn get_clients_by_name(name: String) -> Result<Vec<ClientResponseDto>, String> {
    let service = ClientService::new();
    service.get_clients_by_name(&name).await
}

#[tauri::command]
pub async fn list_clients() -> Result<Vec<ClientResponseDto>, String> {
    let service = ClientService::new();
    service.list_clients().await
}

#[tauri::command]
pub async fn update_client(id: String, dto: UpdateClientDto) -> Result<Option<ClientResponseDto>, String> {
    let service = ClientService::new();
    service.update_client(&id, dto).await
}

#[tauri::command]
pub async fn delete_client(id: String) -> Result<bool, String> {
    let service = ClientService::new();
    service.delete_client(&id).await
}
