use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use time::OffsetDateTime;
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ClothingType {
    #[serde(rename = "collared_tshirts")]
    CollaredTshirts,
    #[serde(rename = "tshirts_without_collar")]
    TshirtsWithoutCollar,
    #[serde(rename = "uniform_shirts")]
    UniformShirts,
    #[serde(rename = "uniforms")]
    Uniforms,
    #[serde(rename = "uniform_pants")]
    UniformPants,
    #[serde(rename = "bags")]
    Bags,
    #[serde(rename = "aprons")]
    Aprons,
    #[serde(rename = "cloth_vests")]
    ClothVests,
    #[serde(rename = "reflective_vests")]
    ReflectiveVests,
    #[serde(rename = "thick_caps")]
    ThickCaps,
    #[serde(rename = "simple_caps")]
    SimpleCaps,
    #[serde(rename = "towels")]
    Towels,
    #[serde(rename = "sheets")]
    Sheets,
    #[serde(rename = "aprons_kitchen")]
    ApronsKitchen,
    #[serde(rename = "other")]
    Other,
}

impl Default for ClothingType {
    fn default() -> Self {
        ClothingType::CollaredTshirts
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ServiceType {
    #[serde(rename = "embroidery")]
    Embroidery,
    #[serde(rename = "stamping")]
    Stamping,
    #[serde(rename = "dtf")]
    Dtf,
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
    #[serde(rename = "center_front")]
    CenterFront,
    #[serde(rename = "center_back")]
    CenterBack,
    #[serde(rename = "left_side")]
    LeftSide,
    #[serde(rename = "right_side")]
    RightSide,
    #[serde(rename = "top")]
    Top,
    #[serde(rename = "bottom")]
    Bottom,
    #[serde(rename = "custom")]
    Custom,
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
    #[serde(rename = "XXXL")]
    XXXL,
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
    pub description: Option<String>, // New description field
    pub unit_price: f64,
    pub created_at: OffsetDateTime,
    pub updated_at: OffsetDateTime,
}
