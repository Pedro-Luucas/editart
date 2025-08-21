export interface LoginDto {
  login: string;
  password: string;
}

export interface LoginResponseDto {
  id: string;
  login: string;
  role: 'admin' | 'user';
  success: boolean;
  message: string;
}

export interface User {
  id: string;
  login: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
}

export interface CreateUserDto {
  login: string;
  password: string;
  role: 'admin' | 'user';
}
