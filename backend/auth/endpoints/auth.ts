import { api, APIError } from "encore.dev/api";
import { db } from "../db";
import {
  generateTokenPair,
  generateLoginResponse,
  validateRefreshToken,
  extractUserFromToken,
} from "../jwt";
import { User, RegisterRequest, LoginRequest } from "../types";
import { hashPassword, verifyPassword, generateVerificationToken } from "../utils/password";
import { setCookies, clearCookies } from "../utils/cookies";
import { streamToString } from "../utils/validation";
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

// Authentication endpoints using raw API for cookie management
export const signup = api.raw(
  { method: "POST", path: "/auth/signup", expose: true },
  async (req, res) => {
    try {
      const body = JSON.parse(await streamToString(req)) as RegisterRequest;

      // Validate input
      if (!body.email || !body.password) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          code: "invalid_argument", 
          message: "Email and password are required" 
        }));
        return;
      }

      if (body.password.length < 6) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          code: "invalid_argument", 
          message: "Password must be at least 6 characters long" 
        }));
        return;
      }

      // Check if user already exists
      const existingUser = await db.queryRow`
        SELECT id FROM users WHERE email = ${body.email}
      `;

      if (existingUser) {
        res.writeHead(409, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          code: "already_exists", 
          message: "User with this email already exists" 
        }));
        return;
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
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          code: "internal", 
          message: "Failed to create user" 
        }));
        return;
      }

      // Generate JWT token pair using the full User object
      const { accessToken, refreshToken, jti } = generateTokenPair(user);
      
      // Store refresh token for revocation tracking
      await storeRefreshToken(user.id, jti);

      // Set HTTP-only cookies
      setCookies(res, accessToken, refreshToken);

      // Send response using the new LoginResponse structure
      const loginResponse = generateLoginResponse(user, accessToken);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(loginResponse));

    } catch (error) {
      console.error('Signup error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        code: "internal", 
        message: "Internal server error" 
      }));
    }
  }
);

export const signin = api.raw(
  { method: "POST", path: "/auth/signin", expose: true },
  async (req, res) => {
    try {
      const body = JSON.parse(await streamToString(req)) as LoginRequest;

      // Validate input
      if (!body.email || !body.password) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          code: "invalid_argument", 
          message: "Email and password are required" 
        }));
        return;
      }

      // Find user with all required fields
      const user = await db.queryRow<User>`
        SELECT id, email, password_hash, is_verified, verification_token, reset_token, reset_token_expires, created_at, updated_at 
        FROM users 
        WHERE email = ${body.email}
      `;

      if (!user) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          code: "unauthenticated", 
          message: "Invalid email or password" 
        }));
        return;
      }

      // Verify password
      const isValidPassword = await verifyPassword(body.password, user.password_hash);
      if (!isValidPassword) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          code: "unauthenticated", 
          message: "Invalid email or password" 
        }));
        return;
      }

      // Generate JWT token pair using the full User object
      console.log('Generating tokens for user:', user.id, user.email);
      const { accessToken, refreshToken, jti } = generateTokenPair(user);
      console.log('Tokens generated successfully, jti:', jti);
      
      // Store refresh token for revocation tracking
      console.log('Storing refresh token in database...');
      await storeRefreshToken(user.id, jti);
      console.log('Refresh token stored successfully');

      // Set HTTP-only cookies
      setCookies(res, accessToken, refreshToken);
      console.log('Setting cookies for signin user:', user.email);

      // Send response using the new LoginResponse structure
      const loginResponse = generateLoginResponse(user, accessToken);
      console.log('Sending successful signin response');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(loginResponse));
      console.log('Signin response sent successfully');

    } catch (error) {
      console.error('Signin error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        code: "internal", 
        message: "Internal server error" 
      }));
    }
  }
);

export const refresh = api.raw(
  { method: "POST", path: "/auth/refresh", expose: true },
  async (req, res) => {
    try {
      // Parse cookies from request headers
      const cookies = req.headers.cookie || '';
      const refreshTokenMatch = cookies.match(/refresh_token=([^;]+)/);
      const refreshToken = refreshTokenMatch ? refreshTokenMatch[1] : null;

      if (!refreshToken) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          code: "unauthenticated", 
          message: "No refresh token provided" 
        }));
        return;
      }

      // Validate refresh token
      const payload = validateRefreshToken(refreshToken);
      
      // Check if refresh token is still valid (not revoked)
      const isValid = await isRefreshTokenValid(payload.jti);
      if (!isValid) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          code: "unauthenticated", 
          message: "Refresh token revoked or expired" 
        }));
        return;
      }

      // Get user info with all required fields
      const user = await db.queryRow<User>`
        SELECT id, email, password_hash, is_verified, verification_token, reset_token, reset_token_expires, created_at, updated_at 
        FROM users 
        WHERE id = ${payload.sub}
      `;

      if (!user) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          code: "unauthenticated", 
          message: "User not found" 
        }));
        return;
      }

      // Generate new token pair using the full User object
      const { accessToken, refreshToken: newRefreshToken, jti: newJti } = generateTokenPair(user);
      
      // Revoke old refresh token
      await revokeRefreshToken(payload.jti);
      
      // Store new refresh token
      await storeRefreshToken(user.id, newJti);

      // Set new HTTP-only cookies
      setCookies(res, accessToken, newRefreshToken);

      // Send response
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));

    } catch (error) {
      console.error('Refresh error:', error);
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        code: "unauthenticated", 
        message: "Invalid refresh token" 
      }));
    }
  }
);

export const logout = api.raw(
  { method: "POST", path: "/auth/logout", expose: true },
  async (req, res) => {
    try {
      // Parse cookies from request headers
      const cookies = req.headers.cookie || '';
      const refreshTokenMatch = cookies.match(/refresh_token=([^;]+)/);
      const refreshToken = refreshTokenMatch ? refreshTokenMatch[1] : null;

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

      // Clear cookies
      clearCookies(res);

      // Send response
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));

    } catch (error) {
      console.error('Logout error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        code: "internal", 
        message: "Internal server error" 
      }));
    }
  }
);

export const me = api.raw(
  { method: "GET", path: "/auth/me", expose: true },
  async (req, res) => {
    try {
      // Parse cookies from request headers
      const cookies = req.headers.cookie || '';
      console.log('Raw cookies:', cookies);
      const accessTokenMatch = cookies.match(/access_token=([^;]+)/);
      const accessToken = accessTokenMatch ? accessTokenMatch[1] : null;
      console.log('Extracted access token:', accessToken ? 'present' : 'missing');

      if (!accessToken) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          code: "unauthenticated", 
          message: "No access token provided" 
        }));
        return;
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
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          code: "unauthenticated", 
          message: "User not found" 
        }));
        return;
      }

      // Send response using AuthenticatedUser structure
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        id: user.id,
        email: user.email,
        is_verified: user.is_verified,
      }));

    } catch (error) {
      console.error('Me error:', error);
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        code: "unauthenticated", 
        message: "Invalid access token" 
      }));
    }
  }
); 