use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize)]
pub struct DatabaseConfig {
    pub host: String,
    pub port: u16,
    pub user: String,
    pub password: String,
    pub dbname: String,
}

impl Default for DatabaseConfig {
    fn default() -> Self {
        Self {
            host: "localhost".to_string(),
            port: 5432,
            user: "postgres".to_string(),
            password: "root".to_string(),
            dbname: "editart".to_string(),
        }
    }
}

impl DatabaseConfig {
    pub fn to_connection_string(&self) -> String {
        format!(
            "postgresql://{}:{}@{}:{}/{}",
            self.user, self.password, self.host, self.port, self.dbname
        )
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AppConfig {
    pub database: DatabaseConfig,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            database: DatabaseConfig::default(),
        }
    }
}

pub fn get_config_path() -> Result<PathBuf, String> {
    let app_data_dir = dirs::data_dir()
        .ok_or_else(|| "Could not find AppData directory".to_string())?;
    
    let config_dir = app_data_dir.join("editart");
    let config_file = config_dir.join("config.json");
    
    Ok(config_file)
}

pub fn ensure_config_dir() -> Result<PathBuf, String> {
    let config_path = get_config_path()?;
    let config_dir = config_path.parent()
        .ok_or_else(|| "Invalid config path".to_string())?;
    
    fs::create_dir_all(config_dir)
        .map_err(|e| format!("Failed to create config directory: {}", e))?;
    
    Ok(config_path)
}

pub fn load_config() -> Result<AppConfig, String> {
    let config_path = get_config_path()?;
    
    if !config_path.exists() {
        // Create default config file
        let default_config = AppConfig::default();
        save_config(&default_config)?;
        return Ok(default_config);
    }
    
    let config_content = fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to read config file: {}", e))?;
    
    let config: AppConfig = serde_json::from_str(&config_content)
        .map_err(|e| format!("Failed to parse config file: {}", e))?;
    
    Ok(config)
}

pub fn save_config(config: &AppConfig) -> Result<(), String> {
    let config_path = ensure_config_dir()?;
    
    let config_content = serde_json::to_string_pretty(config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    
    fs::write(&config_path, config_content)
        .map_err(|e| format!("Failed to write config file: {}", e))?;
    
    Ok(())
}
