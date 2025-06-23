# Testing with Encore.ts

This document explains how to run tests in this Encore.ts application.

## 🧪 Encore-Native Testing

Encore.ts provides built-in testing support that integrates seamlessly with the framework. Tests are run using Vitest with automatic infrastructure setup.

### Running Tests

```bash
# Run all tests using Encore's native command
encore test

# Run specific test files
encore test auth/auth.test.ts
encore test auth/jwt.test.ts
encore test auth/utils/password.test.ts

# Run tests in watch mode (via npm)
npm test

# Run tests once (via npm)
npm run test:run
```

### Available Test Files

#### Encore-Native Tests
- **`auth/auth.test.ts`** - Authentication service tests
  - Password utilities (hashing, verification)
  - JWT token generation and validation
  - Authentication endpoint patterns
  - Security features (timing attack prevention)

- **`auth/jwt.test.ts`** - JWT utility tests
  - Token generation (access, refresh, pairs)
  - Token verification and validation
  - User extraction from tokens
  - Security properties (expiration, uniqueness)

- **`auth/utils/password.test.ts`** - Password utility tests
  - Password hashing and verification
  - Secure token generation
  - Timing attack resistance
  - Edge cases and security properties



### Test Configuration

The project uses Vitest with the following configuration (`vite.config.ts`):

```typescript
/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      "~encore": path.resolve(__dirname, "./encore.gen"),
    },
  },
});
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:auth": "vitest run auth/auth.test.ts"
  }
}
```

## 🔧 How Encore Testing Works

1. **Infrastructure Setup**: Encore automatically sets up test databases and infrastructure
2. **Test Isolation**: Each test gets a clean environment
3. **Type Safety**: Full TypeScript support with Encore's generated types
4. **Integration**: Tests can interact with actual Encore services and databases
5. **Performance**: Test databases are optimized for speed (in-memory, no fsync)

## 📊 Test Coverage

### Authentication Tests
- ✅ Password hashing and verification
- ✅ JWT token generation and validation
- ✅ User authentication flows
- ✅ Security pattern validation
- ✅ Input validation and error handling

### JWT Tests
- ✅ Access token generation and verification
- ✅ Refresh token generation and verification
- ✅ Token pair generation with unique JTIs
- ✅ User extraction from tokens
- ✅ Security properties (expiration, signatures)

### Password Utility Tests
- ✅ bcrypt password hashing
- ✅ Password verification with timing attack prevention
- ✅ Secure token generation
- ✅ Edge cases and unicode support

## 🚀 Benefits of Encore Testing

1. **Native Integration**: Tests run in the same environment as your application
2. **Automatic Setup**: No manual database or infrastructure configuration
3. **Type Safety**: Full TypeScript support with generated types
4. **Performance**: Optimized test databases for fast execution
5. **Debugging**: Built-in tracing and debugging support
6. **CI/CD Ready**: Easy integration with continuous integration pipelines

## 📝 Writing New Tests

When adding new tests, follow these patterns:

```typescript
import { describe, it, expect } from 'vitest';
import { yourFunction } from './your-module';

describe('Your Module', () => {
  it('should do something', () => {
    const result = yourFunction();
    expect(result).toBeTruthy();
  });
});
```

For testing Encore APIs, you can import and call them directly:

```typescript
import { signup, signin } from './auth';

describe('Auth Endpoints', () => {
  it('should register users', async () => {
    const result = await signup({
      email: 'test@example.com',
      password: 'password123'
    });
    
    expect(result.user.email).toBe('test@example.com');
  });
});
```

## 🔍 Debugging Tests

1. **Use Encore Dashboard**: Open `http://localhost:9400` during test runs
2. **Console Logging**: Standard console.log works in tests
3. **Vitest UI**: Run `npx vitest --ui` for interactive debugging
4. **VS Code Integration**: Use the Vitest extension for IDE debugging

---

This testing setup provides comprehensive coverage while maintaining the excellent developer experience that Encore.ts is known for. 