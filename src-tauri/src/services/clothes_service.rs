use crate::dto::{ClothesDto, CreateClothesDto, UpdateClothesDto, CreateClothingServiceDto, UpdateClothingServiceDto, ClothingServiceDto};
use crate::repositories::{ClothesRepository, ClothingServiceRepository};

pub struct ClothesService {
    clothes_repository: ClothesRepository,
    clothing_service_repository: ClothingServiceRepository,
}

impl ClothesService {
    pub fn new() -> Self {
        Self {
            clothes_repository: ClothesRepository,
            clothing_service_repository: ClothingServiceRepository,
        }
    }

    pub async fn create_clothes(&self, dto: CreateClothesDto) -> Result<ClothesDto, String> {
        let total_quantity = dto.calculate_total_quantity();
        let clothing_type_str = dto.to_clothing_type_string();
        let sizes_json = dto.sizes_to_json()?;

        // Create the clothes item
        let clothes = self.clothes_repository.create(
            dto.order_id.clone(),
            clothing_type_str,
            dto.custom_type.clone(),
            dto.unit_price,
            sizes_json,
            dto.color.clone(),
            total_quantity,
        ).await?;

        // Create associated services
        let mut services = Vec::new();
        for service_dto in dto.services {
            let service = self.clothing_service_repository.create(
                clothes.id.clone(),
                service_dto.to_service_type_string(),
                service_dto.to_location_string(),
                service_dto.unit_price,
            ).await?;
            services.push(service);
        }

        ClothesDto::from_model(clothes, services)
    }

    pub async fn get_clothes_by_id(&self, id: &str) -> Result<Option<ClothesDto>, String> {
        let clothes = match self.clothes_repository.get_by_id(id).await? {
            Some(clothes) => clothes,
            None => return Ok(None),
        };

        let services = self.clothing_service_repository.get_by_clothes_id(id).await?;
        let dto = ClothesDto::from_model(clothes, services)?;
        Ok(Some(dto))
    }

    pub async fn get_clothes_by_order_id(&self, order_id: &str) -> Result<Vec<ClothesDto>, String> {
        let clothes_list = self.clothes_repository.get_by_order_id(order_id).await?;
        let mut result = Vec::new();

        for clothes in clothes_list {
            let services = self.clothing_service_repository.get_by_clothes_id(&clothes.id).await?;
            let dto = ClothesDto::from_model(clothes, services)?;
            result.push(dto);
        }

        Ok(result)
    }

    pub async fn update_clothes(&self, id: &str, dto: UpdateClothesDto) -> Result<Option<ClothesDto>, String> {
        let clothing_type_str = dto.to_clothing_type_string();
        let sizes_json = dto.sizes_to_json()?;
        let total_quantity = dto.calculate_total_quantity();

        let updated_clothes = self.clothes_repository.update(
            id,
            clothing_type_str,
            dto.custom_type,
            dto.unit_price,
            sizes_json,
            dto.color,
            total_quantity,
        ).await?;

        match updated_clothes {
            Some(clothes) => {
                let services = self.clothing_service_repository.get_by_clothes_id(id).await?;
                let dto = ClothesDto::from_model(clothes, services)?;
                Ok(Some(dto))
            }
            None => Ok(None),
        }
    }

    pub async fn delete_clothes(&self, id: &str) -> Result<bool, String> {
        // First delete all associated services
        self.clothing_service_repository.delete_by_clothes_id(id).await?;
        
        // Then delete the clothes item
        self.clothes_repository.delete(id).await
    }

    pub async fn add_service_to_clothes(&self, clothes_id: &str, dto: CreateClothingServiceDto) -> Result<ClothingServiceDto, String> {
        // Verify clothes exists
        if self.clothes_repository.get_by_id(clothes_id).await?.is_none() {
            return Err("Clothes not found".to_string());
        }

        let service = self.clothing_service_repository.create(
            clothes_id.to_string(),
            dto.to_service_type_string(),
            dto.to_location_string(),
            dto.unit_price,
        ).await?;

        ClothingServiceDto::from_model(service)
    }

    pub async fn update_service(&self, service_id: &str, dto: UpdateClothingServiceDto) -> Result<Option<ClothingServiceDto>, String> {
        let updated_service = self.clothing_service_repository.update(
            service_id,
            dto.to_service_type_string(),
            dto.to_location_string(),
            dto.unit_price,
        ).await?;

        match updated_service {
            Some(service) => Ok(Some(ClothingServiceDto::from_model(service)?)),
            None => Ok(None),
        }
    }

    pub async fn delete_service(&self, service_id: &str) -> Result<bool, String> {
        self.clothing_service_repository.delete(service_id).await
    }

    pub async fn get_services_by_clothes_id(&self, clothes_id: &str) -> Result<Vec<ClothingServiceDto>, String> {
        let services = self.clothing_service_repository.get_by_clothes_id(clothes_id).await?;
        let mut result = Vec::new();

        for service in services {
            let dto = ClothingServiceDto::from_model(service)?;
            result.push(dto);
        }

        Ok(result)
    }

    pub async fn calculate_order_clothes_total(&self, order_id: &str) -> Result<f64, String> {
        let clothes_list = self.get_clothes_by_order_id(order_id).await?;
        Ok(clothes_list.iter().map(|c| c.calculate_total_price()).sum())
    }
}

impl Default for ClothesService {
    fn default() -> Self {
        Self::new()
    }
}
