import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authApi, authHelpers, TokenService } from '../services/api';
import { User } from '../lib/auth-types';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean; // Track if we've checked initial auth status
}

// Async thunks using our API service
export const checkAuthStatus = createAsyncThunk(
  'auth/checkAuthStatus',
  async (_, { rejectWithValue }) => {
    try {
      console.log('Checking auth status...');
      
      // First check if we have a valid token in localStorage
      if (!TokenService.isAuthenticated()) {
        console.log('No valid token found, user not authenticated');
        return rejectWithValue(null);
      }
      
      // If we have a token, try to get user info from it first
      const userFromToken = TokenService.getUserFromToken();
      if (userFromToken) {
        console.log('Found user info in token:', userFromToken);
        // We have user info from token, but let's verify with server
        try {
          const response = await authApi.me();
          if (response.ok) {
            const serverUser = await authHelpers.parseAuthResponse(response);
            console.log('Server confirmed user:', serverUser);
            return serverUser;
          }
        } catch (serverError) {
          console.log('Server verification failed, but token is valid, using token data');
          // Server call failed, but token is valid, use token data
          return {
            id: userFromToken.userId,
            email: userFromToken.email,
            is_verified: userFromToken.is_verified
          } as User;
        }
      }
      
      // Fallback: try server call without token verification
      const response = await authApi.me();
      if (!response.ok) {
        throw new Error('Failed to get user info');
      }
      const user = await authHelpers.parseAuthResponse(response);
      return user;
    } catch (error: any) {
      console.log('Auth check failed:', error);
      // Try to refresh token if auth fails
      if (error?.status === 401) {
        try {
          const refreshResponse = await authApi.refresh();
          if (refreshResponse.ok) {
            // If refresh succeeded, try getting user again
            const retryResponse = await authApi.me();
            if (retryResponse.ok) {
              const refreshedUser = await authHelpers.parseAuthResponse(retryResponse);
              return refreshedUser;
            }
          }
        } catch (refreshError) {
          console.log('Token refresh failed:', refreshError);
          // Clear invalid tokens
          TokenService.clearTokens();
          return rejectWithValue(null);
        }
      }
      // Clear tokens on any auth error
      TokenService.clearTokens();
      return rejectWithValue(null);
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      console.log('Attempting login for:', email);
      const response = await authApi.login(email, password);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Login failed');
      }
      
      const data = await response.json();
      console.log('Login successful, received data:', data);
      
      // Return the user data
      return data.user || data;
    } catch (error: any) {
      console.error('Login error:', error);
      return rejectWithValue(authHelpers.handleAuthError(error));
    }
  }
);

export const signupUser = createAsyncThunk(
  'auth/signupUser',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      console.log('Attempting signup for:', email);
      const response = await authApi.register(email, password);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Registration failed');
      }
      
      const data = await response.json();
      console.log('Signup successful, received data:', data);
      
      // Return the user data
      return data.user || data;
    } catch (error: any) {
      console.error('Signup error:', error);
      return rejectWithValue(authHelpers.handleAuthError(error));
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async () => {
    try {
      console.log('Attempting logout');
      await authApi.logout();
      console.log('Logout successful');
      return null;
    } catch (error: any) {
      console.log('Logout error (continuing anyway):', error);
      // Even if logout fails on server, we should clear local state
      return null;
    }
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }, { rejectWithValue }) => {
    try {
      const response = await authApi.changePassword(currentPassword, newPassword);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Password change failed');
      }
      const data = await response.json();
      return data.message;
    } catch (error: any) {
      return rejectWithValue(authHelpers.handleAuthError(error));
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async ({ email }: { email: string }, { rejectWithValue }) => {
    try {
      const result = await authApi.forgotPassword(email);
      // The client method may return a direct result rather than a Response
      if (typeof result === 'object' && 'message' in result) {
        return result.message;
      }
      return 'Password reset email sent';
    } catch (error: any) {
      return rejectWithValue(authHelpers.handleAuthError(error));
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, newPassword }: { token: string; newPassword: string }, { rejectWithValue }) => {
    try {
      const result = await authApi.resetPassword(token, newPassword);
      // The client method may return a direct result rather than a Response
      if (typeof result === 'object' && 'message' in result) {
        return result.message;
      }
      return 'Password reset successful';
    } catch (error: any) {
      return rejectWithValue(authHelpers.handleAuthError(error));
    }
  }
);

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isInitialized: false,
};

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearAuth: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      state.isInitialized = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // Check auth status
      .addCase(checkAuthStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
        state.isInitialized = true;
      })
      .addCase(checkAuthStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        // Only set error if it's not null (which means it's a real error, not just unauthenticated)
        state.error = action.payload as string;
        state.isInitialized = true;
      })
      
      // Login user
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<User>) => {
        console.log('Login fulfilled with user:', action.payload);
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        console.log('Login rejected with error:', action.payload);
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      })
      
      // Signup user
      .addCase(signupUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state, action: PayloadAction<User>) => {
        console.log('Signup fulfilled with user:', action.payload);
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(signupUser.rejected, (state, action) => {
        console.log('Signup rejected with error:', action.payload);
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      })
      
      // Logout user
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        console.log('Logout fulfilled');
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        console.log('Logout rejected (clearing state anyway)');
        // Even if logout fails, clear the state
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      
      // Change password
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Forgot password
      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Reset password
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearAuth } = authSlice.actions;
export default authSlice.reducer; 