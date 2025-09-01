use crate::dto::{CreateOrderDto, UpdateOrderDto, OrderResponseDto};
use crate::models::OrderStatus;
use crate::repositories::OrderRepository;
use time::Date;

pub struct OrderService {
    repository: OrderRepository,
}

impl OrderService {
    pub fn new() -> Self {
        Self {
            repository: OrderRepository,
        }
    }

    pub async fn create_order(&self, dto: CreateOrderDto) -> Result<OrderResponseDto, String> {
        let status_str = match dto.status.unwrap_or_default() {
            OrderStatus::OrderReceived => "order_received".to_string(),
            OrderStatus::InProduction => "in_production".to_string(),
            OrderStatus::ReadyForDelivery => "ready_for_delivery".to_string(),
            OrderStatus::Delivered => "delivered".to_string(),
        };
        
        let order = self.repository.create(
            dto.name,
            dto.client_id,
            dto.due_date,
            dto.iva,
            dto.discount,
            status_str,
        ).await?;

        // Get the order with client info for the response
        let order_with_client = self.repository.get_with_client_info(&order.id).await?;
        match order_with_client {
            Some((order, client_name, client_contact)) => {
                Ok(OrderResponseDto::from((order, client_name, client_contact)))
            }
            None => Err("Failed to retrieve created order with client info".to_string()),
        }
    }

    pub async fn get_order_by_id(&self, id: &str) -> Result<Option<OrderResponseDto>, String> {
        let order_with_client = self.repository.get_with_client_info(id).await?;
        Ok(order_with_client.map(|(order, client_name, client_contact)| {
            OrderResponseDto::from((order, client_name, client_contact))
        }))
    }

    pub async fn get_orders_by_client_id(&self, client_id: &str) -> Result<Vec<OrderResponseDto>, String> {
        let orders_with_client = self.repository.get_by_client_id_with_client_info(client_id).await?;
        Ok(orders_with_client.into_iter().map(|(order, client_name, client_contact)| {
            OrderResponseDto::from((order, client_name, client_contact))
        }).collect())
    }

    pub async fn get_orders_by_date_range(&self, start_date: Date, end_date: Date) -> Result<Vec<OrderResponseDto>, String> {
        let orders = self.repository.get_by_date_range(start_date, end_date).await?;
        
        // For each order, get client info
        let mut order_responses = Vec::new();
        for order in orders {
            if let Some((order, client_name, client_contact)) = self.repository.get_with_client_info(&order.id).await? {
                order_responses.push(OrderResponseDto::from((order, client_name, client_contact)));
            }
        }
        
        Ok(order_responses)
    }

    pub async fn list_orders(&self) -> Result<Vec<OrderResponseDto>, String> {
        let orders_with_client = self.repository.list_with_client_info().await?;
        Ok(orders_with_client.into_iter().map(|(order, client_name, client_contact)| {
            OrderResponseDto::from((order, client_name, client_contact))
        }).collect())
    }

    pub async fn update_order(&self, id: &str, dto: UpdateOrderDto) -> Result<Option<OrderResponseDto>, String> {
        let status_str = dto.status.map(|status| match status {
            OrderStatus::OrderReceived => "order_received".to_string(),
            OrderStatus::InProduction => "in_production".to_string(),
            OrderStatus::ReadyForDelivery => "ready_for_delivery".to_string(),
            OrderStatus::Delivered => "delivered".to_string(),
        });
        
        let order = self.repository.update(
            id,
            dto.name,
            dto.client_id,
            dto.due_date,
            dto.discount,
            dto.iva,
            dto.subtotal,
            dto.total,
            status_str,
        ).await?;

        match order {
            Some(_) => {
                // Get the updated order with client info
                let order_with_client = self.repository.get_with_client_info(id).await?;
                Ok(order_with_client.map(|(order, client_name, client_contact)| {
                    OrderResponseDto::from((order, client_name, client_contact))
                }))
            }
            None => Ok(None),
        }
    }

    pub async fn delete_order(&self, id: &str) -> Result<bool, String> {
        self.repository.delete(id).await
    }

    pub async fn pay_order_debt(&self, id: &str, payment_amount: f64) -> Result<bool, String> {
        if payment_amount <= 0.0 {
            return Err("Payment amount must be greater than 0".to_string());
        }
        
        self.repository.pay_debt(id, payment_amount).await
    }

    /// Recalcula os totais da order considerando clothes e impressions
    pub async fn recalculate_order_totals(&self, order_id: &str) -> Result<(), String> {
        // Get the order to access IVA and discount
        let order = self.repository.get_by_id(order_id).await?
            .ok_or("Order not found")?;
        
        // Calculate clothes total using the service to get DTOs with calculated totals
        let clothes_service = crate::services::ClothesService::new();
        let clothes_list = clothes_service.get_clothes_by_order_id(order_id).await?;
        let clothes_total: f64 = clothes_list.iter().map(|clothes| clothes.calculate_total_price()).sum();
        
        // Calculate impressions total
        let impression_repo = crate::repositories::ImpressionRepository;
        let impressions = impression_repo.get_by_order_id(order_id).await?;
        let impressions_total: f64 = impressions.iter().map(|impression| impression.price).sum();
        
        // Calculate combined subtotal
        let subtotal = clothes_total + impressions_total;
        
        // Calculate total with IVA and discount
        let iva_amount = subtotal * order.iva / 100.0;
        let total = subtotal + iva_amount - order.discount;
        
        // Update the order with new totals
        self.repository.update_financial_values(order_id, subtotal, total).await?;
        
        Ok(())
    }
}
