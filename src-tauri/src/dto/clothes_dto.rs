use serde::{Deserialize, Serialize};
use time::OffsetDateTime;
use crate::models::{Clothes, ClothingService, ClothingType, ServiceType, ServiceLocation, SizesMap};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClothesDto {
    pub id: String,
    pub order_id: String,
    pub clothing_type: ClothingType,
    pub custom_type: Option<String>,
    pub unit_price: f64,
    pub sizes: SizesMap,
    pub color: String,
    pub total_quantity: i32,
    pub services: Vec<ClothingServiceDto>,
    pub created_at: OffsetDateTime,
    pub updated_at: OffsetDateTime,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClothingServiceDto {
    pub id: String,
    pub clothes_id: String,
    pub service_type: ServiceType,
    pub location: ServiceLocation,
    pub description: Option<String>,
    pub unit_price: f64,
    pub created_at: OffsetDateTime,
    pub updated_at: OffsetDateTime,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateClothesDto {
    pub order_id: String,
    pub clothing_type: ClothingType,
    pub custom_type: Option<String>,
    pub unit_price: f64,
    pub sizes: SizesMap,
    pub color: String,
    pub services: Vec<CreateClothingServiceDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateClothingServiceDto {
    pub service_type: ServiceType,
    pub location: ServiceLocation,
    pub description: Option<String>,
    pub unit_price: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateClothesDto {
    pub clothing_type: Option<ClothingType>,
    pub custom_type: Option<Option<String>>,
    pub unit_price: Option<f64>,
    pub sizes: Option<SizesMap>,
    pub color: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateClothingServiceDto {
    pub service_type: Option<ServiceType>,
    pub location: Option<ServiceLocation>,
    pub description: Option<Option<String>>,
    pub unit_price: Option<f64>,
}

impl ClothesDto {
    pub fn from_model(clothes: Clothes, services: Vec<ClothingService>) -> Result<Self, String> {
        let clothing_type = match clothes.clothing_type.as_str() {
            "collared_tshirts" => ClothingType::CollaredTshirts,
            "tshirts_without_collar" => ClothingType::TshirtsWithoutCollar,
            "uniform_shirts" => ClothingType::UniformShirts,
            "uniforms" => ClothingType::Uniforms,
            "uniform_pants" => ClothingType::UniformPants,
            "bags" => ClothingType::Bags,
            "aprons" => ClothingType::Aprons,
            "cloth_vests" => ClothingType::ClothVests,
            "reflective_vests" => ClothingType::ReflectiveVests,
            "thick_caps" => ClothingType::ThickCaps,
            "simple_caps" => ClothingType::SimpleCaps,
            "towels" => ClothingType::Towels,
            "sheets" => ClothingType::Sheets,
            "aprons_kitchen" => ClothingType::ApronsKitchen,
            "other" => ClothingType::Other,
            _ => return Err(format!("Invalid clothing type: {}", clothes.clothing_type)),
        };

        let sizes: SizesMap = serde_json::from_str(&clothes.sizes)
            .map_err(|e| format!("Failed to parse sizes JSON: {}", e))?;

        let service_dtos: Result<Vec<ClothingServiceDto>, String> = services
            .into_iter()
            .map(ClothingServiceDto::from_model)
            .collect();

        Ok(ClothesDto {
            id: clothes.id,
            order_id: clothes.order_id,
            clothing_type,
            custom_type: clothes.custom_type,
            unit_price: clothes.unit_price,
            sizes,
            color: clothes.color,
            total_quantity: clothes.total_quantity,
            services: service_dtos?,
            created_at: clothes.created_at,
            updated_at: clothes.updated_at,
        })
    }

    pub fn calculate_total_price(&self) -> f64 {
        let services_total: f64 = self.services.iter().map(|s| s.unit_price).sum();
        (self.unit_price + services_total) * self.total_quantity as f64
    }
}

impl ClothingServiceDto {
    pub fn from_model(service: ClothingService) -> Result<Self, String> {
        let service_type = match service.service_type.as_str() {
            "embroidery" => ServiceType::Embroidery,
            "stamping" => ServiceType::Stamping,
            "dtf" => ServiceType::Dtf,
            "transfer" => ServiceType::Transfer,
            _ => return Err(format!("Invalid service type: {}", service.service_type)),
        };

        let location = match service.location.as_str() {
            "front_right" => ServiceLocation::FrontRight,
            "front_left" => ServiceLocation::FrontLeft,
            "back" => ServiceLocation::Back,
            "sleeve_left" => ServiceLocation::SleeveLeft,
            "sleeve_right" => ServiceLocation::SleeveRight,
            "center_front" => ServiceLocation::CenterFront,
            "center_back" => ServiceLocation::CenterBack,
            "left_side" => ServiceLocation::LeftSide,
            "right_side" => ServiceLocation::RightSide,
            "top" => ServiceLocation::Top,
            "bottom" => ServiceLocation::Bottom,
            "custom" => ServiceLocation::Custom,
            _ => return Err(format!("Invalid service location: {}", service.location)),
        };

        Ok(ClothingServiceDto {
            id: service.id,
            clothes_id: service.clothes_id,
            service_type,
            location,
            description: service.description,
            unit_price: service.unit_price,
            created_at: service.created_at,
            updated_at: service.updated_at,
        })
    }
}

impl CreateClothesDto {
    pub fn calculate_total_quantity(&self) -> i32 {
        self.sizes.values().sum::<u32>() as i32
    }

    pub fn to_clothing_type_string(&self) -> String {
        match self.clothing_type {
            ClothingType::CollaredTshirts => "collared_tshirts".to_string(),
            ClothingType::TshirtsWithoutCollar => "tshirts_without_collar".to_string(),
            ClothingType::UniformShirts => "uniform_shirts".to_string(),
            ClothingType::Uniforms => "uniforms".to_string(),
            ClothingType::UniformPants => "uniform_pants".to_string(),
            ClothingType::Bags => "bags".to_string(),
            ClothingType::Aprons => "aprons".to_string(),
            ClothingType::ClothVests => "cloth_vests".to_string(),
            ClothingType::ReflectiveVests => "reflective_vests".to_string(),
            ClothingType::ThickCaps => "thick_caps".to_string(),
            ClothingType::SimpleCaps => "simple_caps".to_string(),
            ClothingType::Towels => "towels".to_string(),
            ClothingType::Sheets => "sheets".to_string(),
            ClothingType::ApronsKitchen => "aprons_kitchen".to_string(),
            ClothingType::Other => "other".to_string(),
        }
    }

    pub fn sizes_to_json(&self) -> Result<String, String> {
        serde_json::to_string(&self.sizes)
            .map_err(|e| format!("Failed to serialize sizes: {}", e))
    }
}

impl CreateClothingServiceDto {
    pub fn to_service_type_string(&self) -> String {
        match self.service_type {
            ServiceType::Embroidery => "embroidery".to_string(),
            ServiceType::Stamping => "stamping".to_string(),
            ServiceType::Dtf => "dtf".to_string(),
            ServiceType::Transfer => "transfer".to_string(),
        }
    }

    pub fn to_location_string(&self) -> String {
        match self.location {
            ServiceLocation::FrontRight => "front_right".to_string(),
            ServiceLocation::FrontLeft => "front_left".to_string(),
            ServiceLocation::Back => "back".to_string(),
            ServiceLocation::SleeveLeft => "sleeve_left".to_string(),
            ServiceLocation::SleeveRight => "sleeve_right".to_string(),
            ServiceLocation::CenterFront => "center_front".to_string(),
            ServiceLocation::CenterBack => "center_back".to_string(),
            ServiceLocation::LeftSide => "left_side".to_string(),
            ServiceLocation::RightSide => "right_side".to_string(),
            ServiceLocation::Top => "top".to_string(),
            ServiceLocation::Bottom => "bottom".to_string(),
            ServiceLocation::Custom => "custom".to_string(),
        }
    }
}

impl UpdateClothesDto {
    pub fn to_clothing_type_string(&self) -> Option<String> {
        self.clothing_type.as_ref().map(|ct| match ct {
            ClothingType::CollaredTshirts => "collared_tshirts".to_string(),
            ClothingType::TshirtsWithoutCollar => "tshirts_without_collar".to_string(),
            ClothingType::UniformShirts => "uniform_shirts".to_string(),
            ClothingType::Uniforms => "uniforms".to_string(),
            ClothingType::UniformPants => "uniform_pants".to_string(),
            ClothingType::Bags => "bags".to_string(),
            ClothingType::Aprons => "aprons".to_string(),
            ClothingType::ClothVests => "cloth_vests".to_string(),
            ClothingType::ReflectiveVests => "reflective_vests".to_string(),
            ClothingType::ThickCaps => "thick_caps".to_string(),
            ClothingType::SimpleCaps => "simple_caps".to_string(),
            ClothingType::Towels => "towels".to_string(),
            ClothingType::Sheets => "sheets".to_string(),
            ClothingType::ApronsKitchen => "aprons_kitchen".to_string(),
            ClothingType::Other => "other".to_string(),
        })
    }

    pub fn sizes_to_json(&self) -> Result<Option<String>, String> {
        match &self.sizes {
            Some(sizes) => Ok(Some(serde_json::to_string(sizes)
                .map_err(|e| format!("Failed to serialize sizes: {}", e))?)),
            None => Ok(None),
        }
    }

    pub fn calculate_total_quantity(&self) -> Option<i32> {
        self.sizes.as_ref().map(|sizes| sizes.values().sum::<u32>() as i32)
    }
}

impl UpdateClothingServiceDto {
    pub fn to_service_type_string(&self) -> Option<String> {
        self.service_type.as_ref().map(|st| match st {
            ServiceType::Embroidery => "embroidery".to_string(),
            ServiceType::Stamping => "stamping".to_string(),
            ServiceType::Dtf => "dtf".to_string(),
            ServiceType::Transfer => "transfer".to_string(),
        })
    }

    pub fn to_location_string(&self) -> Option<String> {
        self.location.as_ref().map(|loc| match loc {
            ServiceLocation::FrontRight => "front_right".to_string(),
            ServiceLocation::FrontLeft => "front_left".to_string(),
            ServiceLocation::Back => "back".to_string(),
            ServiceLocation::SleeveLeft => "sleeve_left".to_string(),
            ServiceLocation::SleeveRight => "sleeve_right".to_string(),
            ServiceLocation::CenterFront => "center_front".to_string(),
            ServiceLocation::CenterBack => "center_back".to_string(),
            ServiceLocation::LeftSide => "left_side".to_string(),
            ServiceLocation::RightSide => "right_side".to_string(),
            ServiceLocation::Top => "top".to_string(),
            ServiceLocation::Bottom => "bottom".to_string(),
            ServiceLocation::Custom => "custom".to_string(),
        })
    }
}
