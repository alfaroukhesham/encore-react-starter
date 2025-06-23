import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { RootState, AppDispatch } from '../store/store';
import { 
  checkAuthStatus, 
  loginUser, 
  signupUser, 
  logoutUser, 
  changePassword,
  forgotPassword,
  resetPassword,
  clearError 
} from '../store/authSlice';
import { TokenService } from '../services/tokenService';
import type { LoginFormData, RegisterFormData, ChangePasswordFormData } from '../types';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated, isLoading, error, isInitialized } = useSelector((state: RootState) => state.auth);

  // Initialize auth status on mount - always check regardless of current state
  useEffect(() => {
    if (!isInitialized) {
      console.log('Initializing auth status check...');
      dispatch(checkAuthStatus());
    }
  }, [dispatch, isInitialized]);

  const handleLogin = async (email: string, password: string) => {
    try {
      await dispatch(loginUser({ email, password }) as any);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleRegister = async (email: string, password: string) => {
    try {
      await dispatch(signupUser({ email, password }) as any);
    } catch (error) {
      console.error('Register error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser() as any);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updatePassword = async (data: ChangePasswordFormData) => {
    return dispatch(changePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword
    }));
  };

  const sendForgotPassword = async (email: string) => {
    return dispatch(forgotPassword({ email }));
  };

  const sendResetPassword = async (token: string, newPassword: string) => {
    return dispatch(resetPassword({ token, newPassword }));
  };

  const clearAuthError = () => {
    dispatch(clearError());
  };

  // Token-related functions using TokenService instance
  const getToken = () => TokenService.getToken();
  const getRefreshToken = () => TokenService.getRefreshToken();
  const clearTokens = () => TokenService.clearTokens();
  const isTokenValid = () => {
    const token = TokenService.getToken();
    if (!token) return false;
    
    // Basic JWT format check
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // Check if not expired using TokenService's authentication check
    return TokenService.isAuthenticated();
  };
  const isAuthenticatedByToken = () => TokenService.isAuthenticated();
  const getUserFromToken = () => TokenService.getUserFromToken();

  return {
    // Auth state
    user,
    isAuthenticated,
    loading: isLoading,
    error,
    isInitialized,
    
    // Auth actions
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    clearError: clearAuthError,
    updatePassword,
    sendForgotPassword,
    sendResetPassword,
    
    // Token utilities
    getToken,
    getRefreshToken,
    clearTokens,
    isTokenValid,
    isAuthenticatedByToken,
    getUserFromToken,
  };
}; 