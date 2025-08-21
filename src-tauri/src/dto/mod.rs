pub mod client_dto;
pub mod clothes_dto;
pub mod order_dto;
pub mod user_dto;

pub use client_dto::{CreateClientDto, UpdateClientDto, ClientResponseDto};
pub use clothes_dto::{ClothesDto, ClothingServiceDto, CreateClothesDto, CreateClothingServiceDto, UpdateClothesDto, UpdateClothingServiceDto};
pub use order_dto::{CreateOrderDto, UpdateOrderDto, OrderResponseDto};
pub use user_dto::{LoginDto, CreateUserDto, LoginResponseDto};
