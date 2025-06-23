import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import Client, { Local } from '../lib/client';
import { User, LoginResponse, MessageResponse, AuthError } from '../lib/auth-types';

// Initialize Encore client
const client = new Client(Local);

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean; // Track if we've checked initial auth status
}

// Helper function to parse auth response
const parseAuthResponse = async (response: Response): Promise<User> => {
  const data = await response.json();
  // Handle both direct user response and wrapped response
  return data.user || data;
};

// Helper function to handle auth errors
const handleAuthError = (error: any) => {
  if (error?.message?.includes('fetch') || error?.message?.includes('network')) {
    return 'Connection error: Please check if the backend is running';
  }
  return error?.message || 'Authentication failed';
};

// Async thunks using Encore client
export const checkAuthStatus = createAsyncThunk(
  'auth/checkAuthStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await client.auth.me("GET");
      const user = await parseAuthResponse(response);
      return user;
    } catch (error: any) {
      // Try to refresh token if auth fails
      if (error?.status === 401) {
        try {
          await client.auth.refresh("POST");
          // If refresh succeeded, try getting user again
          const refreshedResponse = await client.auth.me("GET");
          const refreshedUser = await parseAuthResponse(refreshedResponse);
          return refreshedUser;
        } catch (refreshError) {
          // Silently fail for initial auth check - user just isn't logged in
          return rejectWithValue(null);
        }
      }
      // Only show error for non-auth related issues
      return rejectWithValue(handleAuthError(error));
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await client.auth.signin("POST", JSON.stringify({ email, password }));
      const user = await parseAuthResponse(response);
      return user;
    } catch (error: any) {
      return rejectWithValue(handleAuthError(error));
    }
  }
);

export const signupUser = createAsyncThunk(
  'auth/signupUser',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await client.auth.signup("POST", JSON.stringify({ email, password }));
      const user = await parseAuthResponse(response);
      return user;
    } catch (error: any) {
      return rejectWithValue(handleAuthError(error));
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await client.auth.logout("POST");
      return null;
    } catch (error: any) {
      // Even if logout fails on server, we should clear local state
      return null;
    }
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }, { rejectWithValue }) => {
    try {
      const response = await client.auth.changePassword("POST", JSON.stringify({ currentPassword, newPassword }));
      const data = await response.json();
      return data.message;
    } catch (error: any) {
      return rejectWithValue(handleAuthError(error));
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async ({ email }: { email: string }, { rejectWithValue }) => {
    try {
      const response = await client.auth.forgotPassword({ email });
      return response.message;
    } catch (error: any) {
      return rejectWithValue(handleAuthError(error));
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, newPassword }: { token: string; newPassword: string }, { rejectWithValue }) => {
    try {
      const response = await client.auth.resetPassword({ token, newPassword });
      return response.message;
    } catch (error: any) {
      return rejectWithValue(handleAuthError(error));
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
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
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
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      })
      
      // Logout user
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null; // Don't show error for logout
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