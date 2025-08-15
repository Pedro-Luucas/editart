mod database;
mod models;
mod dto;
mod repositories;
mod services;
mod commands;

use commands::*;
use database::init_database;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|_app| {
            tauri::async_runtime::block_on(async {
                if let Err(e) = init_database().await {
                    eprintln!("Failed to initialize database: {}", e);
                    std::process::exit(1);
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            create_client,
            get_client_by_id,
            get_clients_by_name,
            list_clients,
            update_client,
            delete_client
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
