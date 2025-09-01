use crate::dto::{ImpressionDto, CreateImpressionDto, UpdateImpressionDto};
use crate::repositories::{ImpressionRepository};
use crate::services::OrderService;

pub struct ImpressionService {
    impression_repository: ImpressionRepository,
    order_service: OrderService,
}

impl ImpressionService {
    pub fn new() -> Self {
        Self {
            impression_repository: ImpressionRepository,
            order_service: OrderService::new(),
        }
    }

    pub async fn create_impression(&self, dto: CreateImpressionDto) -> Result<ImpressionDto, String> {
        let impression = self.impression_repository.create(
            dto.order_id.clone(),
            dto.name,
            dto.size,
            dto.material,
            dto.description,
            dto.price,
        ).await?;

        // Recalculate order totals using the unified method
        self.order_service.recalculate_order_totals(&dto.order_id).await?;

        ImpressionDto::from_model(impression)
    }

    pub async fn get_impression_by_id(&self, id: &str) -> Result<Option<ImpressionDto>, String> {
        let impression = match self.impression_repository.get_by_id(id).await? {
            Some(impression) => impression,
            None => return Ok(None),
        };

        let dto = ImpressionDto::from_model(impression)?;
        Ok(Some(dto))
    }

    pub async fn get_impressions_by_order_id(&self, order_id: &str) -> Result<Vec<ImpressionDto>, String> {
        let impressions = self.impression_repository.get_by_order_id(order_id).await?;
        let mut result = Vec::new();

        for impression in impressions {
            let dto = ImpressionDto::from_model(impression)?;
            result.push(dto);
        }

        Ok(result)
    }

    pub async fn update_impression(&self, id: &str, dto: UpdateImpressionDto) -> Result<Option<ImpressionDto>, String> {
        let current_impression = self.impression_repository.get_by_id(id).await?
            .ok_or("Impression not found")?;
        
        let updated_impression = self.impression_repository.update(
            id,
            dto.name,
            dto.size,
            dto.material,
            dto.description,
            dto.price,
        ).await?;

        if let Some(impression) = updated_impression {
            // Recalculate order totals using the unified method
            self.order_service.recalculate_order_totals(&current_impression.order_id).await?;
            let dto = ImpressionDto::from_model(impression)?;
            Ok(Some(dto))
        } else {
            Ok(None)
        }
    }

    pub async fn delete_impression(&self, id: &str) -> Result<bool, String> {
        let current_impression = self.impression_repository.get_by_id(id).await?
            .ok_or("Impression not found")?;
        let order_id = current_impression.order_id.clone();

        let result = self.impression_repository.delete(id).await?;
        
        // Recalculate order totals using the unified method
        if result {
            self.order_service.recalculate_order_totals(&order_id).await?;
        }
        
        Ok(result)
    }
}

impl Default for ImpressionService {
    fn default() -> Self {
        Self::new()
    }
}