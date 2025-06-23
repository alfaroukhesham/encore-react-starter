// Re-export auth types
export * from '../lib/auth-types';
import type { User } from '../lib/auth-types';

// App-specific types
export type AppView = 'auth' | 'dashboard' | 'forgot-password' | 'reset-password';

// Counter types
export interface CounterState {
  value: number;
  isLoading: boolean;
  error: string | null;
}

// Token types
export interface TokenData {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

// Auth service types
export interface AuthService {
  getToken(): string | null;
  setToken(token: string): void;
  getRefreshToken(): string | null;
  setRefreshToken(token: string): void;
  isAuthenticated(): boolean;
  clearTokens(): void;
  setTokens(accessToken: string, refreshToken?: string): void;
  getAuthHeader(): Record<string, string> | {};
  isTokenValid(): boolean;
}

// Common UI types
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

export interface InputProps {
  label?: string;
  error?: string;
  required?: boolean;
  type?: 'text' | 'email' | 'password';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordFormData {
  email: string;
}

export interface ResetPasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginResponse {
  user: User;
  access_token?: string;
  refresh_token?: string;
}

export interface AuthResponse {
  user: User;
  tokens?: AuthTokens;
} 