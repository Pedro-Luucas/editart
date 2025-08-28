use crate::dto::{CreateClientDto, UpdateClientDto, ClientResponseDto};
use crate::repositories::ClientRepository;

pub struct ClientService {
    repository: ClientRepository,
}

impl ClientService {
    pub fn new() -> Self {
        Self {
            repository: ClientRepository,
        }
    }

    pub async fn create_client(&self, dto: CreateClientDto) -> Result<ClientResponseDto, String> {
        let client = self.repository.create(
            dto.name,
            dto.nuit,
            dto.contact,
            dto.category,
            dto.observations,
        ).await?;

        Ok(ClientResponseDto::from(client))
    }

    pub async fn get_client_by_id(&self, id: &str) -> Result<Option<ClientResponseDto>, String> {
        let client = self.repository.get_by_id(id).await?;
        Ok(client.map(ClientResponseDto::from))
    }

    pub async fn get_clients_by_name(&self, name: &str) -> Result<Vec<ClientResponseDto>, String> {
        let clients = self.repository.get_by_name(name).await?;
        Ok(clients.into_iter().map(ClientResponseDto::from).collect())
    }

    pub async fn list_clients(&self) -> Result<Vec<ClientResponseDto>, String> {
        let clients = self.repository.list().await?;
        Ok(clients.into_iter().map(ClientResponseDto::from).collect())
    }

    pub async fn update_client(&self, id: &str, dto: UpdateClientDto) -> Result<Option<ClientResponseDto>, String> {
        let client = self.repository.update(
            id,
            dto.name,
            dto.nuit,
            dto.contact,
            dto.category,
            dto.observations,
        ).await?;

        Ok(client.map(ClientResponseDto::from))
    }

    pub async fn delete_client(&self, id: &str) -> Result<bool, String> {
        self.repository.delete(id).await
    }

    pub async fn update_client_debt(&self, client_id: &str) -> Result<bool, String> {
        self.repository.update_client_debt(client_id).await
    }
}
