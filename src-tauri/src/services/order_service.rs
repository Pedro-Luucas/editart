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
            dto.paid,
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
            dto.paid,
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
}
