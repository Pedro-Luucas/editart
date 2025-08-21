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
    pub unit_price: Option<f64>,
}

impl ClothesDto {
    pub fn from_model(clothes: Clothes, services: Vec<ClothingService>) -> Result<Self, String> {
        let clothing_type = match clothes.clothing_type.as_str() {
            "with_collar" => ClothingType::WithCollar,
            "without_collar" => ClothingType::WithoutCollar,
            "thick_cap" => ClothingType::ThickCap,
            "simple_cap" => ClothingType::SimpleCap,
            "reflectors" => ClothingType::Reflectors,
            "uniform" => ClothingType::Uniform,
            "custom" => ClothingType::Custom,
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
            "stamping" => ServiceType::Stamping,
            "embroidery" => ServiceType::Embroidery,
            "transfer" => ServiceType::Transfer,
            _ => return Err(format!("Invalid service type: {}", service.service_type)),
        };

        let location = match service.location.as_str() {
            "front_right" => ServiceLocation::FrontRight,
            "front_left" => ServiceLocation::FrontLeft,
            "back" => ServiceLocation::Back,
            "sleeve_left" => ServiceLocation::SleeveLeft,
            "sleeve_right" => ServiceLocation::SleeveRight,
            _ => return Err(format!("Invalid service location: {}", service.location)),
        };

        Ok(ClothingServiceDto {
            id: service.id,
            clothes_id: service.clothes_id,
            service_type,
            location,
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
            ClothingType::WithCollar => "with_collar".to_string(),
            ClothingType::WithoutCollar => "without_collar".to_string(),
            ClothingType::ThickCap => "thick_cap".to_string(),
            ClothingType::SimpleCap => "simple_cap".to_string(),
            ClothingType::Reflectors => "reflectors".to_string(),
            ClothingType::Uniform => "uniform".to_string(),
            ClothingType::Custom => "custom".to_string(),
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
            ServiceType::Stamping => "stamping".to_string(),
            ServiceType::Embroidery => "embroidery".to_string(),
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
        }
    }
}

impl UpdateClothesDto {
    pub fn to_clothing_type_string(&self) -> Option<String> {
        self.clothing_type.as_ref().map(|ct| match ct {
            ClothingType::WithCollar => "with_collar".to_string(),
            ClothingType::WithoutCollar => "without_collar".to_string(),
            ClothingType::ThickCap => "thick_cap".to_string(),
            ClothingType::SimpleCap => "simple_cap".to_string(),
            ClothingType::Reflectors => "reflectors".to_string(),
            ClothingType::Uniform => "uniform".to_string(),
            ClothingType::Custom => "custom".to_string(),
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
            ServiceType::Stamping => "stamping".to_string(),
            ServiceType::Embroidery => "embroidery".to_string(),
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
        })
    }
}
