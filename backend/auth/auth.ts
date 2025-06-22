import { api, APIError, ErrCode } from "encore.dev/api";
import { Header } from "encore.dev/api";
import * as bcrypt from "bcrypt";
import crypto from "crypto";
import { IncomingMessage } from "http";
import { db } from "./db";
import {
  generateTokenPair,
  validateRefreshToken,
  extractUserFromToken,
  ACCESS_TOKEN_COOKIE_OPTIONS,
  REFRESH_TOKEN_COOKIE_OPTIONS,
  AccessTokenPayload
} from "./jwt";

// Request/Response interfaces
export interface SignupRequest {
  email: string;
  password: string;
}

export interface SigninRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
  };
  success: boolean;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
}

// Helper functions
const streamToString = (stream: IncomingMessage): Promise<string> => {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    stream.on('error', reject);
  });
};

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Store refresh token in database for revocation tracking
const storeRefreshToken = async (userId: string, jti: string): Promise<void> => {
  await db.exec`
    INSERT INTO refresh_tokens (user_id, jti)
    VALUES (${userId}, ${jti})
  `;
};

// Check if refresh token is valid (not revoked)
const isRefreshTokenValid = async (jti: string): Promise<boolean> => {
  const token = await db.queryRow`
    SELECT id FROM refresh_tokens 
    WHERE jti = ${jti} 
      AND expires_at > NOW() 
      AND revoked = FALSE
  `;
  return !!token;
};

// Revoke refresh token
const revokeRefreshToken = async (jti: string): Promise<void> => {
  await db.exec`
    UPDATE refresh_tokens 
    SET revoked = TRUE, revoked_at = NOW()
    WHERE jti = ${jti}
  `;
};

// Revoke all user's refresh tokens
const revokeAllUserTokens = async (userId: string): Promise<void> => {
  await db.exec`
    UPDATE refresh_tokens 
    SET revoked = TRUE, revoked_at = NOW()
    WHERE user_id = ${userId} AND revoked = FALSE
  `;
};

// Helper to set cookies in response
const setCookies = (res: any, accessToken: string, refreshToken: string) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // For development, use Lax with no Secure flag
  // For production, use Strict with Secure flag
  const cookieOptions = isProduction 
    ? 'HttpOnly; Secure; SameSite=Strict'
    : 'HttpOnly; SameSite=Lax';
  
  res.setHeader('Set-Cookie', [
    `access_token=${accessToken}; ${cookieOptions}; Max-Age=${30 * 60}; Path=/`,
    `refresh_token=${refreshToken}; ${cookieOptions}; Max-Age=${7 * 24 * 60 * 60}; Path=/`
  ]);
  console.log('Setting cookies with options:', cookieOptions);
  console.log('Access token cookie:', `access_token=${accessToken.substring(0, 20)}...; ${cookieOptions}; Max-Age=${30 * 60}; Path=/`);
};

// Helper to clear cookies
const clearCookies = (res: any) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  const cookieOptions = isProduction 
    ? 'HttpOnly; Secure; SameSite=Strict'
    : 'HttpOnly; SameSite=Lax';
  
  res.setHeader('Set-Cookie', [
    `access_token=; ${cookieOptions}; Max-Age=0; Path=/`,
    `refresh_token=; ${cookieOptions}; Max-Age=0; Path=/`
  ]);
};

// Authentication endpoints using raw API for cookie management
export const signup = api.raw(
  { method: "POST", path: "/auth/signup", expose: true },
  async (req, res) => {
    try {
      const body = JSON.parse(await streamToString(req)) as SignupRequest;

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

      // Hash password and create user
      const passwordHash = await hashPassword(body.password);
      const user = await db.queryRow`
        INSERT INTO users (email, password_hash)
        VALUES (${body.email}, ${passwordHash})
        RETURNING id, email
      `;

      if (!user) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          code: "internal", 
          message: "Failed to create user" 
        }));
        return;
      }

      // Generate JWT token pair
      const { accessToken, refreshToken, jti } = generateTokenPair(user.id, user.email);
      
      // Store refresh token for revocation tracking
      await storeRefreshToken(user.id, jti);

      // Set HTTP-only cookies
      setCookies(res, accessToken, refreshToken);

      // Send response
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
        },
        success: true
      }));

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
      const body = JSON.parse(await streamToString(req)) as SigninRequest;

      // Validate input
      if (!body.email || !body.password) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          code: "invalid_argument", 
          message: "Email and password are required" 
        }));
        return;
      }

      // Find user
      const user = await db.queryRow`
        SELECT id, email, password_hash FROM users WHERE email = ${body.email}
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

      // Generate JWT token pair
      console.log('Generating tokens for user:', user.id, user.email);
      const { accessToken, refreshToken, jti } = generateTokenPair(user.id, user.email);
      console.log('Tokens generated successfully, jti:', jti);
      
      // Store refresh token for revocation tracking
      console.log('Storing refresh token in database...');
      await storeRefreshToken(user.id, jti);
      console.log('Refresh token stored successfully');

      // Set HTTP-only cookies
      setCookies(res, accessToken, refreshToken);
      console.log('Setting cookies for signin user:', user.email);

      // Send response
      console.log('Sending successful signin response');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
        },
        success: true
      }));
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

      // Get user info
      const user = await db.queryRow`
        SELECT id, email FROM users WHERE id = ${payload.sub}
      `;

      if (!user) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          code: "unauthenticated", 
          message: "User not found" 
        }));
        return;
      }

      // Generate new token pair
      const { accessToken, refreshToken: newRefreshToken, jti: newJti } = generateTokenPair(user.id, user.email);
      
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

      // Extract user info from access token
      const { userId, email } = extractUserFromToken(accessToken);

      // Verify user still exists
      const user = await db.queryRow`
        SELECT id, email FROM users WHERE id = ${userId}
      `;

      if (!user) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          code: "unauthenticated", 
          message: "User not found" 
        }));
        return;
      }

      // Send response
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        id: user.id,
        email: user.email,
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

export const forgotPassword = api(
  { method: "POST", path: "/auth/forgot-password", expose: true },
  async (req: ForgotPasswordRequest): Promise<{ success: boolean; message: string }> => {
    if (!req.email) {
      throw APIError.invalidArgument("Email is required");
    }

    // Find user
    const user = await db.queryRow`
      SELECT id, email FROM users WHERE email = ${req.email}
    `;

    // Always return success to prevent email enumeration
    if (!user) {
      return {
        success: true,
        message: "If an account with this email exists, a password reset link has been sent."
      };
    }

    // Generate reset token (short-lived JWT)
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Store reset token with 1-hour expiration
    await db.exec`
      INSERT INTO refresh_tokens (user_id, jti, expires_at)
      VALUES (${user.id}, ${resetToken}, NOW() + INTERVAL '1 hour')
    `;

    // In a real application, you would send an email here
    // For demo purposes, we'll log the token (remove this in production!)
    console.log(`Password reset token for ${user.email}: ${resetToken}`);
    console.log(`Reset URL: http://localhost:5173/reset-password?token=${resetToken}`);

    return {
      success: true,
      message: "If an account with this email exists, a password reset link has been sent."
    };
  }
);

export const resetPassword = api(
  { method: "POST", path: "/auth/reset-password", expose: true },
  async (req: ResetPasswordRequest): Promise<{ success: boolean; message: string }> => {
    if (!req.token || !req.newPassword) {
      throw APIError.invalidArgument("Token and new password are required");
    }

    if (req.newPassword.length < 6) {
      throw APIError.invalidArgument("Password must be at least 6 characters long");
    }

    // Find valid reset token
    const resetToken = await db.queryRow`
      SELECT user_id FROM refresh_tokens 
      WHERE jti = ${req.token} 
        AND expires_at > NOW() 
        AND revoked = FALSE
    `;

    if (!resetToken) {
      throw APIError.invalidArgument("Invalid or expired reset token");
    }

    // Hash new password
    const passwordHash = await hashPassword(req.newPassword);

    // Update user password
    await db.exec`
      UPDATE users 
      SET password_hash = ${passwordHash}, updated_at = NOW()
      WHERE id = ${resetToken.user_id}
    `;

    // Revoke the reset token
    await db.exec`
      UPDATE refresh_tokens 
      SET revoked = TRUE, revoked_at = NOW()
      WHERE jti = ${req.token}
    `;

    // Revoke all existing refresh tokens for this user (force re-login)
    await revokeAllUserTokens(resetToken.user_id);

    return {
      success: true,
      message: "Password has been reset successfully. Please sign in with your new password."
    };
  }
);

export const changePassword = api.raw(
  { method: "POST", path: "/auth/change-password", expose: true },
  async (req, res) => {
    try {
      const body = JSON.parse(await streamToString(req)) as ChangePasswordRequest;

      // Parse cookies from request headers
      const cookies = req.headers.cookie || '';
      const accessTokenMatch = cookies.match(/access_token=([^;]+)/);
      const accessToken = accessTokenMatch ? accessTokenMatch[1] : null;

      if (!accessToken) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          code: "unauthenticated", 
          message: "No access token provided" 
        }));
        return;
      }

      if (!body.currentPassword || !body.newPassword) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          code: "invalid_argument", 
          message: "Current password and new password are required" 
        }));
        return;
      }

      if (body.newPassword.length < 6) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          code: "invalid_argument", 
          message: "New password must be at least 6 characters long" 
        }));
        return;
      }

      // Extract user info from access token
      const { userId } = extractUserFromToken(accessToken);

      // Get user with current password hash
      const user = await db.queryRow`
        SELECT id, password_hash FROM users WHERE id = ${userId}
      `;

      if (!user) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          code: "unauthenticated", 
          message: "User not found" 
        }));
        return;
      }

      // Verify current password
      const isValidPassword = await verifyPassword(body.currentPassword, user.password_hash);
      if (!isValidPassword) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          code: "invalid_argument", 
          message: "Current password is incorrect" 
        }));
        return;
      }

      // Hash new password
      const passwordHash = await hashPassword(body.newPassword);

      // Update user password
      await db.exec`
        UPDATE users 
        SET password_hash = ${passwordHash}, updated_at = NOW()
        WHERE id = ${user.id}
      `;

      // Revoke all other refresh tokens for this user (keep current session)
      await db.exec`
        UPDATE refresh_tokens 
        SET revoked = TRUE, revoked_at = NOW()
        WHERE user_id = ${user.id} AND revoked = FALSE
      `;

      // Send response
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: "Password has been changed successfully."
      }));

    } catch (error) {
      console.error('Change password error:', error);
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        code: "unauthenticated", 
        message: "Invalid access token" 
      }));
    }
  }
); 