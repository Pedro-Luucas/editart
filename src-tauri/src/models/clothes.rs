use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use time::OffsetDateTime;
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ClothingType {
    #[serde(rename = "with_collar")]
    WithCollar,
    #[serde(rename = "without_collar")]
    WithoutCollar,
    #[serde(rename = "thick_cap")]
    ThickCap,
    #[serde(rename = "simple_cap")]
    SimpleCap,
    #[serde(rename = "reflectors")]
    Reflectors,
    #[serde(rename = "uniform")]
    Uniform,
    #[serde(rename = "custom")]
    Custom,
}

impl Default for ClothingType {
    fn default() -> Self {
        ClothingType::WithCollar
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ServiceType {
    #[serde(rename = "stamping")]
    Stamping,
    #[serde(rename = "embroidery")]
    Embroidery,
    #[serde(rename = "transfer")]
    Transfer,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ServiceLocation {
    #[serde(rename = "front_right")]
    FrontRight,
    #[serde(rename = "front_left")]
    FrontLeft,
    #[serde(rename = "back")]
    Back,
    #[serde(rename = "sleeve_left")]
    SleeveLeft,
    #[serde(rename = "sleeve_right")]
    SleeveRight,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum ClothingSize {
    #[serde(rename = "S")]
    S,
    #[serde(rename = "M")]
    M,
    #[serde(rename = "L")]
    L,
    #[serde(rename = "XL")]
    XL,
    #[serde(rename = "XXL")]
    XXL,
}

// Type alias for sizes mapping
pub type SizesMap = HashMap<ClothingSize, u32>;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Clothes {
    pub id: String,
    pub order_id: String,
    pub clothing_type: String, // Will be converted to/from ClothingType in DTOs
    pub custom_type: Option<String>,
    pub unit_price: f64,
    pub sizes: String, // JSON string, will be parsed to/from SizesMap in DTOs
    pub color: String,
    pub total_quantity: i32,
    pub created_at: OffsetDateTime,
    pub updated_at: OffsetDateTime,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ClothingService {
    pub id: String,
    pub clothes_id: String,
    pub service_type: String, // Will be converted to/from ServiceType in DTOs
    pub location: String, // Will be converted to/from ServiceLocation in DTOs
    pub unit_price: f64,
    pub created_at: OffsetDateTime,
    pub updated_at: OffsetDateTime,
}
