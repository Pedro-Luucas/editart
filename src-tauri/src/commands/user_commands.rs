use crate::dto::{LoginDto, CreateUserDto, LoginResponseDto};
use crate::models::User;
use crate::services::UserService;

#[tauri::command]
pub async fn login(login_dto: LoginDto) -> Result<LoginResponseDto, String> {
    UserService::login(login_dto).await
}

#[tauri::command]
pub async fn create_user(create_user_dto: CreateUserDto) -> Result<User, String> {
    UserService::create_user(create_user_dto).await
}

#[tauri::command]
pub async fn list_users() -> Result<Vec<User>, String> {
    UserService::list_users().await
}
