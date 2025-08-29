use crate::dto::{ImpressionDto, CreateImpressionDto, UpdateImpressionDto};
use crate::repositories::{ImpressionRepository, OrderRepository};

pub struct ImpressionService {
    impression_repository: ImpressionRepository,
    order_repository: OrderRepository,
}

impl ImpressionService {
    pub fn new() -> Self {
        Self {
            impression_repository: ImpressionRepository,
            order_repository: OrderRepository,
        }
    }

    async fn update_order_totals(&self, order_id: &str) -> Result<(), String> {
        let impressions = self.get_impressions_by_order_id(order_id).await?;
        let impression_total: f64 = impressions.iter().map(|i| i.price).sum();
        
        let order = self.order_repository.get_by_id(order_id).await?
            .ok_or("Order not found")?;
        
        let iva_amount = impression_total * order.iva / 100.0;
        let total = impression_total + iva_amount - order.discount;
        
        self.order_repository.update_financial_values(order_id, impression_total, total).await?;
        Ok(())
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

        self.update_order_totals(&dto.order_id).await?;

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
            self.update_order_totals(&current_impression.order_id).await?;
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
        
        if result {
            self.update_order_totals(&order_id).await?;
        }
        
        Ok(result)
    }
}

impl Default for ImpressionService {
    fn default() -> Self {
        Self::new()
    }
}