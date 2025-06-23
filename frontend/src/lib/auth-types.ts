/**
 * TypeScript interfaces for authentication endpoints
 * These match the backend auth service responses
 */

// User interface matching backend
export interface User {
  id: string;
  email: string;
  is_verified: boolean;
}

// Auth request interfaces
export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

// Auth response interfaces
export interface LoginResponse {
  user: User;
  token: string;
}

export interface AuthResponse {
  user: User;
}

export interface MessageResponse {
  message: string;
  success?: boolean;
}

export interface RefreshResponse {
  success: boolean;
}

// Error response interface
export interface AuthError {
  code: string;
  message: string;
  details?: any;
} 