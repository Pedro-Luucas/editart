use crate::models::User;
use crate::database::get_db_pool;
use sqlx::Row;

pub struct UserRepository;

impl UserRepository {
    pub async fn create_user(user: &User) -> Result<User, String> {
        let pool = get_db_pool()?;
        
        let result = sqlx::query(
            r#"
            INSERT INTO users (id, login, password, role, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
            "#,
        )
        .bind(&user.id)
        .bind(&user.login)
        .bind(&user.password)
        .bind(&user.role)
        .bind(user.created_at)
        .bind(user.updated_at)
        .fetch_one(pool)
        .await
        .map_err(|e| format!("Failed to create user: {}", e))?;

        Ok(User {
            id: result.get("id"),
            login: result.get("login"),
            password: result.get("password"),
            role: result.get("role"),
            created_at: result.get("created_at"),
            updated_at: result.get("updated_at"),
        })
    }

    pub async fn find_by_login_and_password(login: &str, password: &str) -> Result<Option<User>, String> {
        let pool = get_db_pool()?;
        
        let result = sqlx::query_as::<_, User>(
            r#"
            SELECT id, login, password, role, created_at, updated_at
            FROM users 
            WHERE login = $1 AND password = $2
            "#,
        )
        .bind(login)
        .bind(password)
        .fetch_optional(pool)
        .await
        .map_err(|e| format!("Failed to find user: {}", e))?;

        Ok(result)
    }

    pub async fn find_by_login(login: &str) -> Result<Option<User>, String> {
        let pool = get_db_pool()?;
        
        let result = sqlx::query_as::<_, User>(
            r#"
            SELECT id, login, password, role, created_at, updated_at
            FROM users 
            WHERE login = $1
            "#,
        )
        .bind(login)
        .fetch_optional(pool)
        .await
        .map_err(|e| format!("Failed to find user by login: {}", e))?;

        Ok(result)
    }

    pub async fn list_users() -> Result<Vec<User>, String> {
        let pool = get_db_pool()?;
        
        let users = sqlx::query_as::<_, User>(
            r#"
            SELECT id, login, password, role, created_at, updated_at
            FROM users 
            ORDER BY created_at DESC
            "#,
        )
        .fetch_all(pool)
        .await
        .map_err(|e| format!("Failed to list users: {}", e))?;

        Ok(users)
    }
}
