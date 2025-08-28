use crate::database::get_db_pool;
use crate::models::Order;
use time::{Date, OffsetDateTime};
use uuid::Uuid;

pub struct OrderRepository;

impl OrderRepository {
    pub async fn create(&self, name: String, client_id: String, due_date: Date, iva: f64, discount: Option<f64>, status: String) -> Result<Order, String> {
        let pool = get_db_pool()?;
        let id = Uuid::new_v4().to_string();
        let now = OffsetDateTime::now_utc();
        let discount_value = discount.unwrap_or(0.0);

        // Validate that client exists
        let client_exists = sqlx::query_scalar::<_, bool>(
            "SELECT EXISTS(SELECT 1 FROM clients WHERE id = $1)"
        )
        .bind(&client_id)
        .fetch_one(pool)
        .await
        .map_err(|e| format!("Failed to validate client: {}", e))?;

        if !client_exists {
            return Err("Client not found".to_string());
        }

        // Get the next order number (global sequence)
        let order_number: i32 = sqlx::query_scalar::<_, i32>(
            "SELECT COALESCE(MAX(order_number), 0) + 1 FROM orders"
        )
        .fetch_one(pool)
        .await
        .map_err(|e| format!("Failed to get next order number: {}", e))?;

        // Get the next client requisition number for this specific client
        let client_requisition_number: i32 = sqlx::query_scalar::<_, i32>(
            "SELECT COALESCE(MAX(client_requisition_number), 0) + 1 FROM orders WHERE client_id = $1"
        )
        .bind(&client_id)
        .fetch_one(pool)
        .await
        .map_err(|e| format!("Failed to get next client requisition number: {}", e))?;

        let order = sqlx::query_as::<_, Order>(
            r#"
            INSERT INTO orders (id, name, client_id, order_number, client_requisition_number, due_date, discount, iva, subtotal, total, status, debt, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *
            "#,
        )
        .bind(&id)
        .bind(&name)
        .bind(&client_id)
        .bind(order_number)
        .bind(client_requisition_number)
        .bind(due_date)
        .bind(discount_value)
        .bind(iva)
        .bind(0.0) // subtotal starts at 0
        .bind(0.0) // total starts at 0
        .bind(&status)
        .bind(0.0) // debt starts at 0
        .bind(now)
        .bind(now)
        .fetch_one(pool)
        .await
        .map_err(|e| format!("Failed to create order: {}", e))?;

        Ok(order)
    }

    pub async fn get_by_id(&self, id: &str) -> Result<Option<Order>, String> {
        let pool = get_db_pool()?;

        let order = sqlx::query_as::<_, Order>(
            "SELECT * FROM orders WHERE id = $1"
        )
        .bind(id)
        .fetch_optional(pool)
        .await
        .map_err(|e| format!("Failed to get order by id: {}", e))?;

        Ok(order)
    }

    pub async fn get_by_client_id(&self, client_id: &str) -> Result<Vec<Order>, String> {
        let pool = get_db_pool()?;

        let orders = sqlx::query_as::<_, Order>(
            "SELECT * FROM orders WHERE client_id = $1 ORDER BY created_at DESC"
        )
        .bind(client_id)
        .fetch_all(pool)
        .await
        .map_err(|e| format!("Failed to get orders by client_id: {}", e))?;

        Ok(orders)
    }

    pub async fn get_by_date_range(&self, start_date: Date, end_date: Date) -> Result<Vec<Order>, String> {
        let pool = get_db_pool()?;

        let orders = sqlx::query_as::<_, Order>(
            "SELECT * FROM orders WHERE due_date BETWEEN $1 AND $2 ORDER BY due_date"
        )
        .bind(start_date)
        .bind(end_date)
        .fetch_all(pool)
        .await
        .map_err(|e| format!("Failed to get orders by date range: {}", e))?;

        Ok(orders)
    }

    pub async fn list(&self) -> Result<Vec<Order>, String> {
        let pool = get_db_pool()?;

        let orders = sqlx::query_as::<_, Order>(
            "SELECT * FROM orders ORDER BY created_at DESC"
        )
        .fetch_all(pool)
        .await
        .map_err(|e| format!("Failed to list orders: {}", e))?;

        Ok(orders)
    }

    pub async fn update(&self, id: &str, name: Option<String>, client_id: Option<String>, due_date: Option<Date>, discount: Option<f64>, iva: Option<f64>, subtotal: Option<f64>, total: Option<f64>, status: Option<String>) -> Result<Option<Order>, String> {
        let pool = get_db_pool()?;
        let now = OffsetDateTime::now_utc();

        // First, get the current order
        let current_order = self.get_by_id(id).await?;
        let current_order = match current_order {
            Some(order) => order,
            None => return Ok(None),
        };

        // Use provided values or keep current values
        let updated_name = name.unwrap_or(current_order.name);
        let updated_client_id = client_id.clone().unwrap_or(current_order.client_id);
        let updated_due_date = due_date.unwrap_or(current_order.due_date);
        let updated_discount = discount.unwrap_or(current_order.discount);
        let updated_iva = iva.unwrap_or(current_order.iva);
        let updated_subtotal = subtotal.unwrap_or(current_order.subtotal);
        let updated_total = total.unwrap_or(current_order.total);
        let updated_status = status.unwrap_or(current_order.status);

        // Validate that client exists if client_id is being updated
        if client_id.is_some() {
            let client_exists = sqlx::query_scalar::<_, bool>(
                "SELECT EXISTS(SELECT 1 FROM clients WHERE id = $1)"
            )
            .bind(&updated_client_id)
            .fetch_one(pool)
            .await
            .map_err(|e| format!("Failed to validate client: {}", e))?;

            if !client_exists {
                return Err("Client not found".to_string());
            }
        }

        let order = sqlx::query_as::<_, Order>(
            r#"
            UPDATE orders 
            SET name = $2, client_id = $3, due_date = $4, discount = $5, iva = $6, subtotal = $7, total = $8, status = $9, updated_at = $10
            WHERE id = $1
            RETURNING *
            "#,
        )
        .bind(id)
        .bind(updated_name)
        .bind(updated_client_id)
        .bind(updated_due_date)
        .bind(updated_discount)
        .bind(updated_iva)
        .bind(updated_subtotal)
        .bind(updated_total)
        .bind(updated_status)
        .bind(now)
        .fetch_optional(pool)
        .await
        .map_err(|e| format!("Failed to update order: {}", e))?;

        Ok(order)
    }

    pub async fn delete(&self, id: &str) -> Result<bool, String> {
        let pool = get_db_pool()?;

        let result = sqlx::query("DELETE FROM orders WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await
            .map_err(|e| format!("Failed to delete order: {}", e))?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn update_financial_values(&self, id: &str, subtotal: f64, total: f64) -> Result<bool, String> {
        let pool = get_db_pool()?;
        let now = OffsetDateTime::now_utc();

        let result = sqlx::query(
            r#"
            UPDATE orders 
            SET subtotal = $2, total = $3, debt = $3, updated_at = $4
            WHERE id = $1
            "#,
        )
        .bind(id)
        .bind(subtotal)
        .bind(total)
        .bind(now)
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to update order financial values: {}", e))?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn get_with_client_info(&self, id: &str) -> Result<Option<(Order, String, String)>, String> {
        let pool = get_db_pool()?;

        // First get the order
        let order = self.get_by_id(id).await?;
        
        match order {
            Some(order) => {
                // Then get client info
                let client_info = sqlx::query_as::<_, (String, String)>(
                    "SELECT name, contact FROM clients WHERE id = $1"
                )
                .bind(&order.client_id)
                .fetch_optional(pool)
                .await
                .map_err(|e| format!("Failed to get client info: {}", e))?;

                match client_info {
                    Some((name, contact)) => Ok(Some((order, name, contact))),
                    None => Err("Client not found for order".to_string()),
                }
            }
            None => Ok(None),
        }
    }

    pub async fn list_with_client_info(&self) -> Result<Vec<(Order, String, String)>, String> {
        let pool = get_db_pool()?;

        // First get all orders
        let orders = self.list().await?;
        let mut results = Vec::new();

        // Then get client info for each order
        for order in orders {
            let client_info = sqlx::query_as::<_, (String, String)>(
                "SELECT name, contact FROM clients WHERE id = $1"
            )
            .bind(&order.client_id)
            .fetch_optional(pool)
            .await
            .map_err(|e| format!("Failed to get client info: {}", e))?;

            match client_info {
                Some((name, contact)) => results.push((order, name, contact)),
                None => return Err(format!("Client not found for order {}", order.id)),
            }
        }

        Ok(results)
    }

    pub async fn get_by_client_id_with_client_info(&self, client_id: &str) -> Result<Vec<(Order, String, String)>, String> {
        let pool = get_db_pool()?;

        // First get orders for the client
        let orders = self.get_by_client_id(client_id).await?;
        
        if orders.is_empty() {
            return Ok(vec![]);
        }

        // Get client info once
        let client_info = sqlx::query_as::<_, (String, String)>(
            "SELECT name, contact FROM clients WHERE id = $1"
        )
        .bind(client_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| format!("Failed to get client info: {}", e))?;

        match client_info {
            Some((name, contact)) => {
                let results = orders.into_iter()
                    .map(|order| (order, name.clone(), contact.clone()))
                    .collect();
                Ok(results)
            }
            None => Err("Client not found".to_string()),
        }
    }

    pub async fn pay_debt(&self, id: &str, payment_amount: f64) -> Result<bool, String> {
        let pool = get_db_pool()?;
        let now = OffsetDateTime::now_utc();

        // First, get the current debt
        let current_order = self.get_by_id(id).await?;
        let current_order = match current_order {
            Some(order) => order,
            None => return Err("Order not found".to_string()),
        };

        // Calculate new debt (cannot be less than 0)
        let new_debt = (current_order.debt - payment_amount).max(0.0);

        let result = sqlx::query(
            r#"
            UPDATE orders 
            SET debt = $2, updated_at = $3
            WHERE id = $1
            "#,
        )
        .bind(id)
        .bind(new_debt)
        .bind(now)
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to update order debt: {}", e))?;

        Ok(result.rows_affected() > 0)
    }
}
