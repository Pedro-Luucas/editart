mod database;
mod models;
mod dto;
mod repositories;
mod services;
mod commands;
mod resize;

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
            delete_client,
            create_order,
            get_order_by_id,
            get_orders_by_client_id,
            get_orders_by_date_range,
            list_orders,
            update_order,
            delete_order,
            pay_order_debt,
            create_clothes,
            get_clothes_by_id,
            get_clothes_by_order_id,
            update_clothes,
            delete_clothes,
            add_service_to_clothes,
            update_clothing_service,
            delete_clothing_service,
            get_services_by_clothes_id,
            calculate_order_clothes_total,
            login,
            create_user,
            list_users,
            resize_current_window,
            get_screen_size
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
