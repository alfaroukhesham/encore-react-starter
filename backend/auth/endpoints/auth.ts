import { api, APIError, Cookie, Header } from "encore.dev/api";
import { db } from "../db";
import {
  generateTokenPair,
  generateLoginResponse,
  validateRefreshToken,
  extractUserFromToken,
} from "../jwt";
import { User, RegisterRequest, LoginRequest } from "../types";
import { hashPassword, verifyPassword, generateVerificationToken } from "../utils/password";
import { 
  storeRefreshToken,
  isRefreshTokenValid,
  revokeRefreshToken 
} from "../services/token-service";

// Additional interfaces for responses
export interface AuthenticatedUser {
  id: string;
  email: string;
  is_verified: boolean;
}

// Response interfaces with native cookie support
export interface SignupResponse {
  user: AuthenticatedUser;
  access_token: string;
  // Set cookies in response
  accessToken: Cookie<string, "access_token">;
  refreshToken: Cookie<string, "refresh_token">;
}

export interface SigninResponse {
  user: AuthenticatedUser;
  access_token: string;
  // Set cookies in response
  accessToken: Cookie<string, "access_token">;
  refreshToken: Cookie<string, "refresh_token">;
}

export interface RefreshResponse {
  success: boolean;
  // Set new cookies in response
  accessToken: Cookie<string, "access_token">;
  refreshToken: Cookie<string, "refresh_token">;
}

export interface LogoutResponse {
  success: boolean;
  // Clear cookies in response
  accessToken: Cookie<string, "access_token">;
  refreshToken: Cookie<string, "refresh_token">;
}

// Request interfaces with native cookie support
export interface RefreshRequest {
  refreshToken: Cookie<string, "refresh_token">;
}

export interface LogoutRequest {
  refreshToken?: Cookie<string, "refresh_token">;
}

export interface MeRequest {
  // Try Authorization header first, then fall back to cookie
  authorization?: Header<"Authorization">;
  accessToken?: Cookie<string, "access_token">;
}

// Authentication endpoints using native cookie support
export const signup = api(
  { method: "POST", path: "/auth/signup", expose: true },
  async (body: RegisterRequest): Promise<SignupResponse> => {
    // Validate input
    if (!body.email || !body.password) {
      throw APIError.invalidArgument("Email and password are required");
    }

    if (body.password.length < 6) {
      throw APIError.invalidArgument("Password must be at least 6 characters long");
    }

    // Check if user already exists
    const existingUser = await db.queryRow`
      SELECT id FROM users WHERE email = ${body.email}
    `;

    if (existingUser) {
      throw APIError.alreadyExists("User with this email already exists");
    }

    // Hash password and create user with verification token
    const passwordHash = await hashPassword(body.password);
    const verificationToken = generateVerificationToken();
    
    const user = await db.queryRow<User>`
      INSERT INTO users (email, password_hash, verification_token)
      VALUES (${body.email}, ${passwordHash}, ${verificationToken})
      RETURNING id, email, password_hash, is_verified, verification_token, reset_token, reset_token_expires, created_at, updated_at
    `;

    if (!user) {
      throw APIError.internal("Failed to create user");
    }

    // Generate JWT token pair using the full User object
    const { accessToken, refreshToken, jti } = generateTokenPair(user);
    
    // Store refresh token for revocation tracking
    await storeRefreshToken(user.id, jti);

    // Return response with native cookies
    const isProduction = process.env.NODE_ENV === 'production';
    return {
      user: {
        id: user.id,
        email: user.email,
        is_verified: user.is_verified,
      },
      access_token: accessToken,
      accessToken: {
        value: accessToken,
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "Strict" : "Lax",
        maxAge: 30 * 60, // 30 minutes
        path: "/",
      },
      refreshToken: {
        value: refreshToken,
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "Strict" : "Lax",
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: "/",
      },
    };
  }
);

export const signin = api(
  { method: "POST", path: "/auth/signin", expose: true },
  async (body: LoginRequest): Promise<SigninResponse> => {
    // Validate input
    if (!body.email || !body.password) {
      throw APIError.invalidArgument("Email and password are required");
    }

    // Find user with all required fields
    const user = await db.queryRow<User>`
      SELECT id, email, password_hash, is_verified, verification_token, reset_token, reset_token_expires, created_at, updated_at 
      FROM users 
      WHERE email = ${body.email}
    `;

    if (!user) {
      throw APIError.unauthenticated("Invalid email or password");
    }

    // Verify password
    const isValidPassword = await verifyPassword(body.password, user.password_hash);
    if (!isValidPassword) {
      throw APIError.unauthenticated("Invalid email or password");
    }

    // Generate JWT token pair using the full User object
    console.log('Generating tokens for user:', user.id, user.email);
    const { accessToken, refreshToken, jti } = generateTokenPair(user);
    console.log('Tokens generated successfully, jti:', jti);
    
    // Store refresh token for revocation tracking
    console.log('Storing refresh token in database...');
    await storeRefreshToken(user.id, jti);
    console.log('Refresh token stored successfully');

    console.log('Setting cookies for signin user:', user.email);

    // Return response with native cookies
    const isProduction = process.env.NODE_ENV === 'production';
    return {
      user: {
        id: user.id,
        email: user.email,
        is_verified: user.is_verified,
      },
      access_token: accessToken,
      accessToken: {
        value: accessToken,
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "Strict" : "Lax",
        maxAge: 30 * 60, // 30 minutes
        path: "/",
      },
      refreshToken: {
        value: refreshToken,
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "Strict" : "Lax",
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: "/",
      },
    };
  }
);

export const refresh = api(
  { method: "POST", path: "/auth/refresh", expose: true },
  async (req: RefreshRequest): Promise<RefreshResponse> => {
    const refreshToken = req.refreshToken?.value;

    if (!refreshToken) {
      throw APIError.unauthenticated("No refresh token provided");
    }

    // Validate refresh token
    const payload = validateRefreshToken(refreshToken);
    
    // Check if refresh token is still valid (not revoked)
    const isValid = await isRefreshTokenValid(payload.jti);
    if (!isValid) {
      throw APIError.unauthenticated("Refresh token revoked or expired");
    }

    // Get user info with all required fields
    const user = await db.queryRow<User>`
      SELECT id, email, password_hash, is_verified, verification_token, reset_token, reset_token_expires, created_at, updated_at 
      FROM users 
      WHERE id = ${payload.sub}
    `;

    if (!user) {
      throw APIError.unauthenticated("User not found");
    }

    // Generate new token pair using the full User object
    const { accessToken, refreshToken: newRefreshToken, jti: newJti } = generateTokenPair(user);
    
    // Revoke old refresh token
    await revokeRefreshToken(payload.jti);
    
    // Store new refresh token
    await storeRefreshToken(user.id, newJti);

    // Return response with new cookies
    const isProduction = process.env.NODE_ENV === 'production';
    return {
      success: true,
      accessToken: {
        value: accessToken,
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "Strict" : "Lax",
        maxAge: 30 * 60, // 30 minutes
        path: "/",
      },
      refreshToken: {
        value: newRefreshToken,
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "Strict" : "Lax",
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: "/",
      },
    };
  }
);

export const logout = api(
  { method: "POST", path: "/auth/logout", expose: true },
  async (req: LogoutRequest): Promise<LogoutResponse> => {
    const refreshToken = req.refreshToken?.value;

    // Revoke refresh token if present
    if (refreshToken) {
      try {
        const payload = validateRefreshToken(refreshToken);
        await revokeRefreshToken(payload.jti);
      } catch (error) {
        // Token might be invalid, but we still want to clear cookies
        console.log('Error revoking refresh token:', error);
      }
    }

    // Return response that clears cookies
    const isProduction = process.env.NODE_ENV === 'production';
    return {
      success: true,
      accessToken: {
        value: "",
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "Strict" : "Lax",
        maxAge: 0, // Clear cookie
        path: "/",
      },
      refreshToken: {
        value: "",
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "Strict" : "Lax",
        maxAge: 0, // Clear cookie
        path: "/",
      },
    };
  }
);

export const me = api(
  { method: "GET", path: "/auth/me", expose: true },
  async (req: MeRequest): Promise<AuthenticatedUser> => {
    let accessToken: string | null = null;

    // First try to get token from Authorization header
    const authHeader = req.authorization;
    console.log('Authorization header:', authHeader ? 'present' : 'missing');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7); // Remove 'Bearer ' prefix
      console.log('Extracted token from Authorization header');
    }

    // If not found in header, try cookies as fallback
    if (!accessToken) {
      accessToken = req.accessToken?.value || null;
      if (accessToken) {
        console.log('Extracted token from cookies');
      }
    }

    if (!accessToken) {
      console.log('No access token found in Authorization header or cookies');
      throw APIError.unauthenticated("No access token provided");
    }

    // Extract user info from access token (now includes is_verified)
    const { userId, email, is_verified } = extractUserFromToken(accessToken);

    // Verify user still exists and get full user data
    const user = await db.queryRow<User>`
      SELECT id, email, password_hash, is_verified, verification_token, reset_token, reset_token_expires, created_at, updated_at 
      FROM users 
      WHERE id = ${userId}
    `;

    if (!user) {
      throw APIError.unauthenticated("User not found");
    }

    // Return user data
    return {
      id: user.id,
      email: user.email,
      is_verified: user.is_verified,
    };
  }
); 