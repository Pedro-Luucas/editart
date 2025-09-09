use crate::backup::BackupService;

#[tauri::command]
pub async fn create_database_backup() -> Result<String, String> {
    BackupService::create_backup().await
}

#[tauri::command]
pub async fn restore_database_backup() -> Result<String, String> {
    BackupService::restore_backup().await
}

#[tauri::command]
pub fn get_backup_info() -> Result<Option<String>, String> {
    BackupService::get_backup_info()
}