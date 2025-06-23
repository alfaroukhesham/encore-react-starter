# Authentication Service

A secure, modular authentication service built with Encore.ts featuring JWT tokens, HTTP-only cookies, and comprehensive password management.

## 🏗️ Architecture

### Modular Structure
```
auth/
├── encore.service.ts          # Service definition
├── auth.ts                    # Main endpoint exports
├── types.ts                   # TypeScript interfaces
├── db.ts                      # Database connection
├── jwt.ts                     # JWT token utilities
├── migrations/                # Database migrations
│   ├── 001_create_users.up.sql
│   └── 003_add_refresh_tokens.up.sql
├── endpoints/                 # Modular endpoint implementations
│   ├── auth.ts               # Core auth (signup, signin, logout, refresh, me)
│   ├── password.ts           # Password management (forgot, reset, change)
│   └── maintenance.ts        # Cleanup and maintenance
├── utils/                     # Utility modules
│   ├── password.ts           # Password hashing and token generation
│   ├── cookies.ts            # HTTP cookie management
│   └── validation.ts         # Input validation and helpers
├── services/                  # Business logic services
│   └── token-service.ts      # Refresh token database operations
└── tests/                     # Legacy test suite
    ├── utils.test.ts         # Utility function tests
    ├── auth.test.ts          # Authentication endpoint tests
    ├── password.test.ts      # Password management tests
    ├── integration.test.ts   # End-to-end integration tests
    ├── run-tests.ts          # Custom test runner
    └── README.md             # Test documentation
```

### Encore-Native Tests
```
auth/
├── auth.test.ts              # Encore-native authentication tests
├── jwt.test.ts               # Encore-native JWT utility tests
└── utils/
    └── password.test.ts      # Encore-native password utility tests
```

## 🚀 API Endpoints

### Authentication Endpoints

#### POST `/auth/signup`
Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com", 
    "is_verified": false
  },
  "token": "jwt-access-token"
}
```

#### POST `/auth/signin`
Authenticate user and return tokens.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "is_verified": true
  },
  "token": "jwt-access-token"
}
```

#### POST `/auth/logout`
Logout user and invalidate refresh token.

**Headers:** `Authorization: Bearer <token>`

**Response:** `204 No Content`

#### POST `/auth/refresh`
Refresh access token using refresh token cookie.

**Response:**
```json
{
  "user": {
    "id": "user-id", 
    "email": "user@example.com",
    "is_verified": true
  },
  "token": "new-jwt-access-token"
}
```

#### GET `/auth/me`
Get current user information.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com", 
    "is_verified": true
  }
}
```

### Password Management Endpoints

#### POST `/auth/forgot-password`
Request password reset email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "If an account with that email exists, a reset link has been sent."
}
```

#### POST `/auth/reset-password`
Reset password using reset token.

**Request:**
```json
{
  "token": "reset-token",
  "newPassword": "newsecurepassword123"
}
```

**Response:**
```json
{
  "message": "Password has been reset successfully."
}
```

#### POST `/auth/change-password`
Change password for authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "currentPassword": "currentsecurepassword123",
  "newPassword": "newsecurepassword123"
}
```

**Response:**
```json
{
  "message": "Password changed successfully."
}
```

### Maintenance Endpoints

#### POST `/auth/cleanup-expired-tokens`
Clean up expired refresh tokens (cron job).

**Response:**
```json
{
  "message": "Cleanup completed",
  "deletedTokens": 42
}
```

## 🔒 Security Features

### JWT Token System
- **Access Tokens**: Short-lived (30 minutes), stored in memory
- **Refresh Tokens**: Long-lived (7 days), stored in HTTP-only cookies
- **Token Revocation**: Database-tracked refresh tokens for security
- **Automatic Cleanup**: Cron job removes expired tokens every 6 hours

### HTTP-Only Cookies
- **Secure**: HTTPS-only in production
- **SameSite**: Strict CSRF protection
- **HttpOnly**: XSS attack prevention
- **Path**: Scoped to authentication endpoints

### Password Security
- **bcrypt Hashing**: Industry-standard with salt rounds
- **Timing Attack Prevention**: Consistent verification time
- **Secure Token Generation**: Cryptographically secure random tokens
- **Password Requirements**: Minimum length and complexity validation

### Email Enumeration Protection
- **Consistent Responses**: Same message for existing/non-existing emails
- **Rate Limiting**: Prevents brute force attacks (implementation ready)
- **Secure Reset Flow**: Time-limited reset tokens

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    verification_token TEXT,
    reset_token TEXT,
    reset_token_expires TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Refresh Tokens Table
```sql
CREATE TABLE refresh_tokens (
    jti TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## 🧪 Testing

### Encore-Native Testing

Run tests using Encore's native test command:

```bash
# Run all tests
encore test

# Run specific test files
encore test auth/auth.test.ts
encore test auth/jwt.test.ts
encore test auth/utils/password.test.ts

# Run tests in watch mode
npm test

# Run tests once
npm run test:run
```

### Test Coverage

**Encore-Native Tests:**
- **Authentication Tests** (`auth.test.ts`): Core auth functionality, password utilities, JWT generation, security patterns
- **JWT Tests** (`jwt.test.ts`): Token generation, verification, extraction, security validation
- **Password Tests** (`utils/password.test.ts`): Password hashing, verification, token generation, timing attack prevention

All tests use Encore's native testing infrastructure with real database integration and type-safe service calls.

## 🔧 Configuration

### Environment Variables
- `JWT_ACCESS_SECRET`: Secret for signing access tokens
- `JWT_REFRESH_SECRET`: Secret for signing refresh tokens
- `NODE_ENV`: Environment mode (development/production)

### Token Lifecycle
1. **Access Token**: 30 minutes expiry, used for API authentication
2. **Refresh Token**: 7 days expiry, used to obtain new access tokens
3. **Reset Token**: 1 hour expiry, used for password reset
4. **Verification Token**: No expiry, used for email verification

### Cookie Configuration
- **Production**: Secure, HttpOnly, SameSite=Strict
- **Development**: HttpOnly, SameSite=Strict (no Secure flag)
- **Path**: Scoped to `/auth` endpoints

## 🚀 Development

### Adding New Endpoints
1. Create endpoint in appropriate module (`endpoints/`)
2. Add types to `types.ts`
3. Export from main `auth.ts`
4. Add tests to corresponding test file
5. Update documentation

### Database Migrations
```bash
# Create new migration
touch auth/migrations/004_new_feature.up.sql

# Migrations run automatically with Encore
encore run
```

### Benefits of Modular Architecture
- **Maintainability**: Clear separation of concerns
- **Testability**: Isolated components for focused testing
- **Scalability**: Easy to add new features without affecting existing code
- **Collaboration**: Multiple developers can work on different modules
- **Code Reuse**: Utility functions shared across endpoints

## 📊 Performance

### Optimizations
- **Database Indexes**: Email, tokens, and foreign keys indexed
- **Connection Pooling**: Encore handles database connections
- **Token Cleanup**: Automatic removal of expired tokens
- **Efficient Queries**: Optimized database operations

### Monitoring
- **Encore Dashboard**: Built-in monitoring and tracing
- **Database Metrics**: Query performance and connection stats
- **Error Tracking**: Comprehensive error logging and handling

---

This authentication service provides a secure, scalable foundation for user management with modern security practices and excellent developer experience through Encore.ts. 