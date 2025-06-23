# Frontend Structure

This document outlines the organized structure of the React frontend application with integrated token management.

## Directory Structure

```
src/
├── components/           # Reusable UI components
│   ├── forms/           # Form-related components
│   │   ├── AuthForm.tsx
│   │   ├── ChangePassword.tsx
│   │   ├── ForgotPassword.tsx
│   │   ├── ResetPassword.tsx
│   │   └── index.ts     # Barrel export
│   ├── layout/          # Layout and structural components
│   │   ├── AuthGuard.tsx
│   │   └── index.ts     # Barrel export
│   ├── ui/              # Basic UI components (buttons, inputs, etc.)
│   │   ├── TokenInfo.tsx # Token information display component
│   │   └── index.ts     # Barrel export
│   └── index.ts         # Main components barrel export
├── pages/               # Page-level components
│   ├── Dashboard.tsx
│   └── index.ts         # Barrel export
├── hooks/               # Custom React hooks
│   ├── useAuth.ts       # Authentication hook with token management
│   ├── useCounter.ts    # Counter hook (placeholder)
│   └── index.ts         # Barrel export
├── services/            # API service layer
│   ├── api.ts           # Centralized API calls with token integration
│   ├── tokenService.ts  # Token management service
│   └── index.ts         # Barrel export
├── store/               # Redux store configuration
│   ├── authSlice.ts     # Authentication state management
│   ├── hooks.ts         # Typed Redux hooks
│   └── store.ts         # Store configuration
├── types/               # TypeScript type definitions
│   └── index.ts         # Centralized type exports with token types
├── contexts/            # React context providers
├── lib/                 # Utility libraries and configurations
│   ├── auth-types.ts    # Authentication type definitions
│   └── client.ts        # Generated Encore client
├── App.tsx              # Main application component
├── main.tsx             # Application entry point
└── index.css            # Global styles
```

## Key Features of This Structure

### 1. **Token Management System**
The application now includes a comprehensive token management system:

#### TokenService Class
Located in `src/services/tokenService.ts`, provides:
- `getToken()`: Get access token from localStorage
- `setToken(token)`: Store access token
- `getRefreshToken()`: Get refresh token from localStorage
- `setRefreshToken(token)`: Store refresh token
- `isAuthenticated()`: Check if user has valid token
- `clearTokens()`: Remove all tokens
- `setTokens(access, refresh?)`: Store both tokens
- `getAuthHeader()`: Get authorization header for API calls
- `isTokenValid()`: Basic JWT format validation

#### Enhanced Auth Hook
The `useAuth` hook now includes token methods:
```typescript
const {
  // Existing auth methods
  login, logout, register,
  
  // New token methods
  getToken,
  isTokenValid,
  isAuthenticatedByToken,
  clearTokens
} = useAuth();
```

#### API Integration
All API calls now automatically include authentication headers when tokens are available.

### 2. **Separation of Concerns**
- **Components**: Organized by purpose (forms, layout, ui)
- **Pages**: Top-level route components
- **Services**: API layer abstraction with token management
- **Hooks**: Reusable logic extraction
- **Types**: Centralized type definitions

### 3. **Barrel Exports**
Each directory includes an `index.ts` file that re-exports all components, enabling clean imports:

```typescript
// Instead of:
import AuthForm from './components/forms/AuthForm';
import ForgotPassword from './components/forms/ForgotPassword';

// You can use:
import { AuthForm, ForgotPassword } from './components/forms';
```

### 4. **Custom Hooks**
- `useAuth`: Handles all authentication logic and token management
- `useCounter`: Manages counter state (placeholder for future implementation)

### 5. **Service Layer**
- `api.ts`: Centralized API calls using the Encore client with automatic token headers
- `tokenService.ts`: Complete token lifecycle management
- Helper functions for response parsing and error handling

### 6. **Type Safety**
- Centralized type definitions in `types/index.ts`
- Token-related interfaces and types
- Form data interfaces and UI component props

## Usage Examples

### Using Token Management
```typescript
import { useAuth } from './hooks';

const MyComponent = () => {
  const { 
    getToken, 
    isTokenValid, 
    isAuthenticatedByToken,
    clearTokens 
  } = useAuth();

  const token = getToken(); // Get current token
  const isValid = isTokenValid(); // Check if token format is valid
  const isAuth = isAuthenticatedByToken(); // Check if authenticated via token
  
  // Clear tokens if needed
  const handleClearTokens = () => {
    clearTokens();
  };
};
```

### Using Token Service Directly
```typescript
import { TokenService } from './services';

// Check authentication
if (TokenService.isAuthenticated()) {
  // User has a token
}

// Get auth headers for manual API calls
const headers = {
  'Content-Type': 'application/json',
  ...TokenService.getAuthHeader()
};
```

### Using Components
```typescript
import { AuthForm, ForgotPassword } from './components/forms';
import { AuthGuard } from './components/layout';
import { TokenInfo } from './components/ui';
import { Dashboard } from './pages';
```

### Using Services
```typescript
import { authApi, TokenService } from './services';

const handleLogin = async (email: string, password: string) => {
  const response = await authApi.login(email, password);
  // Tokens are automatically stored if present in response
};
```

### Using Types
```typescript
import type { 
  LoginFormData, 
  User, 
  AppView, 
  TokenData,
  AuthTokens 
} from './types';

const tokenData: TokenData = {
  access_token: 'jwt_token_here',
  refresh_token: 'refresh_token_here',
  expires_in: 3600
};
```

## Token Management Features

### 1. **Automatic Token Storage**
- Tokens are automatically stored when received from login/register responses
- Both access and refresh tokens are supported
- Tokens persist across browser sessions

### 2. **API Integration**
- All API calls automatically include authentication headers
- Client instances are created with fresh tokens for each request
- Token refresh is handled automatically

### 3. **Token Validation**
- Basic JWT format validation (3 parts separated by dots)
- Authentication state checking
- Token presence verification

### 4. **Development Tools**
- `TokenInfo` component for debugging token state
- Visual indicators for token validity
- Manual token clearing for testing

### 5. **Security**
- Tokens are stored in localStorage
- Automatic token clearing on logout
- Headers are dynamically generated for each request

## Benefits

1. **Maintainability**: Clear separation makes code easier to find and modify
2. **Scalability**: Structure supports growth without becoming unwieldy
3. **Security**: Proper token management with automatic cleanup
4. **Reusability**: Components and hooks can be easily reused
5. **Type Safety**: Centralized types prevent inconsistencies
6. **Developer Experience**: Barrel exports provide clean, intuitive imports
7. **Testing**: Organized structure makes unit testing more straightforward
8. **Debugging**: Token information component helps with development

## Future Enhancements

- Add automatic token refresh before expiration
- Implement token expiration checking
- Add encrypted token storage option
- Expand UI component library in `components/ui/`
- Implement routing with React Router in `pages/`
- Add context providers in `contexts/`
- Expand service layer for different API domains
- Add utility functions in `lib/utils/`
- Add token-based route protection
- Implement token blacklisting on logout 