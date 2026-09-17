export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'GUARDIAN';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles: UserRole[];
  active?: boolean;
  createdAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
  roles: UserRole[];
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface ApiResponse<T> {
  data?: T;
  message: string;
  success: boolean;
}
