import Client, { Local } from '../lib/client';
import { TokenService } from './tokenService';

// Create client instance (no need for auth headers in constructor)
const getClient = () => new Client("http://localhost:4000");

// Helper to get auth options for API calls
const getAuthOptions = () => {
  const authHeaders = TokenService.getAuthHeader();
  return authHeaders.Authorization ? { headers: authHeaders } : {};
};

// Auth API calls
export const authApi = {
  login: async (email: string, password: string) => {
    const client = getClient();
    const response = await client.auth.signin("POST", JSON.stringify({ email, password }));
    
    // If login is successful, extract and store token from response
    if (response.ok) {
      try {
        // Clone the response so we can read it multiple times
        const responseClone = response.clone();
        const data = await responseClone.json();
        console.log('Login response data:', data);
        
        // The backend returns { user, token } structure
        if (data.token) {
          console.log('Storing access token:', data.token.substring(0, 20) + '...');
          TokenService.setToken(data.token);
        }
        
        // Store user data if available
        if (data.user) {
          console.log('User data received:', data.user);
        }
      } catch (error) {
        console.error('Error parsing login response:', error);
      }
    }
    
    return response;
  },

  register: async (email: string, password: string) => {
    const client = getClient();
    const response = await client.auth.signup("POST", JSON.stringify({ email, password }));
    
    // Handle token storage for registration as well
    if (response.ok) {
      try {
        // Clone the response so we can read it multiple times
        const responseClone = response.clone();
        const data = await responseClone.json();
        console.log('Register response data:', data);
        
        if (data.token) {
          console.log('Storing access token from registration:', data.token.substring(0, 20) + '...');
          TokenService.setToken(data.token);
        }
      } catch (error) {
        console.error('Error parsing register response:', error);
      }
    }
    
    return response;
  },

  logout: async () => {
    const client = getClient();
    const authOptions = getAuthOptions();
    const response = await client.auth.logout("POST", undefined, authOptions);
    
    // Always clear tokens on logout, regardless of server response
    console.log('Clearing tokens on logout');
    TokenService.clearTokens();
    
    return response;
  },

  me: async () => {
    const client = getClient();
    const authOptions = getAuthOptions();
    console.log('Making /auth/me request with options:', authOptions);
    return await client.auth.me("GET", undefined, authOptions);
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const client = getClient();
    const authOptions = getAuthOptions();
    return await client.auth.changePassword("POST", JSON.stringify({ currentPassword, newPassword }), authOptions);
  },

  forgotPassword: async (email: string) => {
    const client = getClient();
    return await client.auth.forgotPassword({ email });
  },

  resetPassword: async (token: string, newPassword: string) => {
    const client = getClient();
    return await client.auth.resetPassword({ token, newPassword });
  },

  refresh: async () => {
    const client = getClient();
    const authOptions = getAuthOptions();
    const response = await client.auth.refresh("POST", undefined, authOptions);
    
    // Note: The refresh endpoint returns { success: true }, not new tokens
    // Tokens are set via cookies, so we don't need to extract them here
    // But we can check if we have cookies and try to extract tokens if needed
    
    return response;
  }
};

// Counter API calls
export const counterApi = {
  get: async () => {
    const client = getClient();
    return await client.api.get();
  },

  increment: async () => {
    const client = getClient();
    return await client.api.increment();
  }
};

// Helper functions for response parsing
export const authHelpers = {
  parseAuthResponse: async (response: Response) => {
    const data = await response.json();
    return data.user || data;
  },

  handleAuthError: (error: any) => {
    if (error?.message?.includes('fetch') || error?.message?.includes('network')) {
      return 'Connection error: Please check if the backend is running';
    }
    return error?.message || 'Authentication failed';
  }
};

// Export TokenService for direct use
export { TokenService };

// Future API modules can be added here
// export const userApi = { ... };
// export const contentApi = { ... };
// export const notificationApi = { ... }; 