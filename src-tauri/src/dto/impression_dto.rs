use serde::{Deserialize, Serialize};
use crate::models::Impression;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImpressionDto {
    pub id: String,
    pub order_id: String,
    pub name: String,
    pub size: String,
    pub material: String,
    pub description: String,
    pub price: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateImpressionDto {
    pub order_id: String,
    pub name: String,
    pub size: String,
    pub material: String,
    pub description: String,
    pub price: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateImpressionDto {
    pub name: String,
    pub size: String,
    pub material: String,
    pub description: String,
    pub price: f64,
}

impl ImpressionDto {
    pub fn from_model(model: Impression) -> Result<Self, String> {
        Ok(Self {
            id: model.id,
            order_id: model.order_id,
            name: model.name,
            size: model.size,
            material: model.material,
            description: model.description,
            price: model.price,
        })
    }
}