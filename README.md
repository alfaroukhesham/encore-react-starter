# CMS React Encore - Full-Stack Authentication System

A modern full-stack application built with **Encore.ts** (TypeScript backend framework) and **React 18** frontend, featuring JWT-based authentication with HTTP-only cookies, Redux state management, and comprehensive password management.

## 🚀 Features

### Authentication System
- **JWT + HTTP-only Cookies**: Secure, stateless authentication perfect for microservices
- **Dual Token Strategy**: Short-lived access tokens (30 min) + long-lived refresh tokens (7 days)
- **Automatic Token Refresh**: Seamless token renewal without user intervention
- **Session Management**: Server-side token revocation and session invalidation
- **Password Security**: bcrypt hashing with salt rounds for secure password storage

### User Management
- **User Registration**: Account creation with email validation
- **User Login**: Secure authentication with error handling
- **Password Reset**: Email-based password reset flow (console logging for demo)
- **Password Change**: Authenticated users can change passwords
- **User Profile**: View current user information

### Frontend Features
- **React 18**: Modern React with hooks and context
- **TypeScript**: Full type safety across the application
- **Tailwind CSS**: Beautiful, responsive UI design
- **Toast Notifications**: Real-time feedback with Sonner
- **Loading States**: Comprehensive loading indicators
- **Error Handling**: Graceful error handling with user-friendly messages
- **Responsive Design**: Mobile-first responsive design

### Backend Features
- **Encore.ts**: Type-safe API endpoints with automatic validation
- **PostgreSQL**: Robust database with migrations
- **Raw Endpoints**: Custom cookie management for authentication
- **CORS Configuration**: Proper cross-origin setup for development
- **Database Migrations**: Version-controlled schema changes
- **Security**: JWT token validation and revocation

## ��️ Architecture

### Backend (Encore.ts)
- **Framework**: Encore.ts with PostgreSQL database
- **Authentication**: JWT tokens with HTTP-only cookies
- **Security**: bcrypt password hashing, automatic token refresh
- **APIs**: RESTful endpoints with built-in validation

### Frontend (React + Redux)
- **State Management**: Redux Toolkit with RTK Query
- **Authentication**: Automatic token refresh and redirect handling
- **UI**: Tailwind CSS with responsive design
- **Notifications**: Sonner toast notifications

## 📁 Project Structure

```
cms-react-encore/
├── backend/                    # Encore.ts backend
│   ├── auth/                  # Authentication service
│   │   ├── encore.service.ts  # Service definition
│   │   ├── db.ts             # Database configuration
│   │   ├── jwt.ts            # JWT utilities
│   │   ├── auth.ts           # Authentication endpoints
│   │   └── migrations/       # Database migrations
│   └── encore.app            # App configuration with CORS
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── store/            # Redux store and slices
│   │   │   ├── store.ts      # Store configuration
│   │   │   ├── authSlice.ts  # Authentication state management
│   │   │   └── hooks.ts      # Typed Redux hooks
│   │   ├── components/       # React components
│   │   │   ├── AuthGuard.tsx # Route protection
│   │   │   ├── AuthForm.tsx  # Login/signup form
│   │   │   ├── Dashboard.tsx # Protected dashboard
│   │   │   ├── ForgotPassword.tsx
│   │   │   ├── ResetPassword.tsx
│   │   │   └── ChangePassword.tsx
│   │   └── App.tsx          # Main app with Redux Provider
│   └── package.json
└── package.json              # Root package manager
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Encore CLI: `npm install -g @encore/cli`

### Installation & Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repository>
   cd cms-react-encore
   npm install
   ```

2. **Set up JWT secrets for local development:**
   ```bash
   cd backend
   encore secret set --type local JWT_ACCESS_SECRET
   encore secret set --type local JWT_REFRESH_SECRET
   ```

3. **Start both servers:**
   ```bash
   # Terminal 1: Backend (http://127.0.0.1:4000)
   npm run backend
   
   # Terminal 2: Frontend (http://localhost:5173)
   npm run frontend
   ```

4. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://127.0.0.1:4000
   - Encore Dashboard: http://127.0.0.1:9400

## 🔐 Authentication System

### Redux-Based State Management

The application uses **Redux Toolkit** for centralized state management with the following structure:

#### Auth Slice (`frontend/src/store/authSlice.ts`)
```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}
```

#### Available Actions
- `checkAuthStatus()` - Verify current authentication with auto-refresh
- `loginUser({ email, password })` - User login
- `signupUser({ email, password })` - User registration  
- `logoutUser()` - User logout with session cleanup
- `changePassword({ currentPassword, newPassword })` - Password change
- `forgotPassword({ email })` - Password reset request
- `resetPassword({ token, newPassword })` - Password reset completion

#### Usage Example
```typescript
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loginUser, logoutUser } from '../store/authSlice';

const MyComponent = () => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading } = useAppSelector(state => state.auth);

  const handleLogin = async () => {
    try {
      await dispatch(loginUser({ email, password })).unwrap();
      // Success handled automatically
    } catch (error) {
      // Error handled by Redux slice
    }
  };
};
```

### Authentication Guard

The `AuthGuard` component automatically:
- Checks authentication status on app load
- Redirects unauthenticated users to login
- Shows loading states during auth verification
- Handles token refresh automatically

```typescript
<AuthGuard fallback={<AuthForm />}>
  <Dashboard />
</AuthGuard>
```

### JWT Token System

**Access Tokens (15 minutes):**
- Short-lived for API requests
- Stored in HTTP-only cookies
- Automatically refreshed

**Refresh Tokens (7 days):**
- Long-lived for session persistence
- Secure HTTP-only cookies
- Automatic rotation on refresh

### Automatic Features

1. **Token Refresh**: Automatically refreshes expired access tokens
2. **Session Persistence**: Maintains login across browser sessions
3. **Secure Logout**: Clears all tokens and cookies
4. **Error Handling**: Comprehensive error states with user feedback
5. **Loading States**: Visual feedback during authentication operations

## 🛡️ Security Features

### Backend Security
- **JWT Authentication**: Stateless token-based auth
- **HTTP-Only Cookies**: XSS protection
- **Secure Cookies**: HTTPS enforcement in production
- **CORS Configuration**: Restricted origins
- **Password Hashing**: bcrypt with salt rounds
- **Token Expiration**: Short-lived access tokens
- **Refresh Token Rotation**: Enhanced security

### Frontend Security
- **Redux State Management**: Centralized auth state
- **Automatic Redirects**: Unauthenticated access prevention
- **Error Boundaries**: Graceful error handling
- **Input Validation**: Client-side validation
- **Toast Notifications**: User feedback without exposing sensitive data

## 📡 API Endpoints

### Authentication Endpoints
```
POST /auth/signup          # User registration
POST /auth/signin          # User login  
POST /auth/logout          # User logout
GET  /auth/me             # Get current user
POST /auth/refresh        # Refresh access token
POST /auth/change-password # Change password (authenticated)
POST /auth/forgot-password # Request password reset
POST /auth/reset-password  # Reset password with token
```

### Example API Usage
```typescript
// All API calls include credentials automatically
const response = await fetch('/auth/signin', {
  method: 'POST',
  credentials: 'include', // Important for cookies
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
```

## 🎨 UI Components

### AuthForm
- Combined login/signup form
- Redux integration
- Real-time validation
- Loading states and error handling

### Dashboard  
- Protected route with user information
- Counter demo with API integration
- Password change functionality
- Secure logout

### Password Management
- **ForgotPassword**: Email-based reset request
- **ResetPassword**: Token-based password reset
- **ChangePassword**: Authenticated password change

## ⚙️ Configuration

### CORS Setup (`backend/encore.app`)
```cue
global_cors: {
    debug: true
    allow_origins_with_credentials: [
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ]
    allow_origins_without_credentials: ["*"]
    allow_headers: ["Authorization", "Content-Type"]
    expose_headers: ["*"]
}
```

### Redux Store Configuration
```typescript
export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});
```

## 🧪 Development

### Available Scripts
```bash
npm run backend          # Start Encore.ts backend
npm run frontend         # Start React frontend  
npm run dev             # Start both servers concurrently
npm run build           # Build for production
```

### Database Management
```bash
cd backend
encore db shell auth    # Access database shell
encore db reset         # Reset database
```

### Secret Management
```bash
encore secret set --type local JWT_ACCESS_SECRET
encore secret set --type prod JWT_ACCESS_SECRET
encore secret list      # List all secrets
```

## 🔄 State Flow

1. **App Initialization**: Redux store initializes, AuthGuard checks auth status
2. **Authentication**: User logs in → Redux updates state → UI re-renders
3. **Token Management**: Automatic refresh before expiration
4. **Route Protection**: AuthGuard prevents access to protected routes
5. **Logout**: Clears Redux state and HTTP-only cookies

## 🐛 Troubleshooting

### Common Issues

**CORS Errors:**
- Ensure backend is running on port 4000
- Check `encore.app` CORS configuration
- Verify frontend origin in allowed origins

**Authentication Failures:**
- Check JWT secrets are set: `encore secret list`
- Verify cookies are enabled in browser
- Check network tab for cookie headers

**Redux State Issues:**
- Use Redux DevTools for debugging
- Check action dispatching with `unwrap()`
- Verify error handling in components

**Database Connection:**
- Ensure PostgreSQL is running
- Check database migrations: `encore db shell auth`

## 🚀 Production Deployment

### Backend (Encore Cloud)
```bash
git push encore main  # Deploy to Encore Cloud
```

### Environment Variables
- Set production JWT secrets via Encore dashboard
- Configure production CORS origins
- Update database connection strings

### Security Checklist
- [ ] JWT secrets set for all environments
- [ ] CORS configured for production domains
- [ ] HTTPS enforced for cookies
- [ ] Database backups configured
- [ ] Error logging implemented

## 📚 Technology Stack

### Backend
- **Encore.ts** - TypeScript backend framework
- **PostgreSQL** - Database with migrations
- **JWT** - JSON Web Tokens for authentication
- **bcrypt** - Password hashing

### Frontend  
- **React 18** - UI library with hooks
- **Redux Toolkit** - State management
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Vite** - Fast build tool
- **Sonner** - Toast notifications

### Development Tools
- **Encore CLI** - Backend development
- **Redux DevTools** - State debugging
- **TypeScript** - Static type checking
- **ESLint** - Code linting

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test authentication flows
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Built with ❤️ using Encore.ts and React**
