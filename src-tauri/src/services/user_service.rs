use crate::models::User;
use crate::repositories::user_repository::UserRepository;
use crate::dto::{LoginDto, CreateUserDto, LoginResponseDto};

pub struct UserService;

impl UserService {
    pub async fn login(login_dto: LoginDto) -> Result<LoginResponseDto, String> {
        // Buscar usuário por login e password
        match UserRepository::find_by_login_and_password(&login_dto.login, &login_dto.password).await? {
            Some(user) => {
                Ok(LoginResponseDto {
                    id: user.id,
                    login: user.login,
                    role: user.role,
                    success: true,
                    message: "Login realizado com sucesso".to_string(),
                })
            }
            None => Ok(LoginResponseDto {
                id: String::new(),
                login: String::new(),
                role: String::new(),
                success: false,
                message: "Login ou password inválidos".to_string(),
            })
        }
    }

    pub async fn create_user(create_user_dto: CreateUserDto) -> Result<User, String> {
        // Verificar se o role é válido
        if create_user_dto.role != "admin" && create_user_dto.role != "user" {
            return Err("Role deve ser 'admin' ou 'user'".to_string());
        }

        // Verificar se já existe um usuário com este login
        if let Some(_) = UserRepository::find_by_login(&create_user_dto.login).await? {
            return Err("Já existe um usuário com este login".to_string());
        }

        // Criar novo usuário
        let new_user = User::new(
            create_user_dto.login,
            create_user_dto.password,
            create_user_dto.role,
        );

        UserRepository::create_user(&new_user).await
    }

    pub async fn list_users() -> Result<Vec<User>, String> {
        UserRepository::list_users().await
    }
}
