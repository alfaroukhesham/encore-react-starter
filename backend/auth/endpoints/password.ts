import { api, APIError, Cookie, Header } from "encore.dev/api";
import { db } from "../db";
import { User } from "../types";
import { 
  hashPassword, 
  verifyPassword, 
  generateResetToken 
} from "../utils/password";
import { extractUserFromToken } from "../jwt";
import { revokeAllUserTokens } from "../services/token-service";

// Request interfaces
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
  // Support both Authorization header and cookie authentication
  authorization?: Header<"Authorization">;
  accessToken?: Cookie<string, "access_token">;
}

// Response interfaces
export interface PasswordResponse {
  success: boolean;
  message: string;
}

export const forgotPassword = api(
  { method: "POST", path: "/auth/forgot-password", expose: true },
  async (req: ForgotPasswordRequest): Promise<PasswordResponse> => {
    if (!req.email) {
      throw APIError.invalidArgument("Email is required");
    }

    // Find user
    const user = await db.queryRow<User>`
      SELECT id, email, password_hash, is_verified, verification_token, reset_token, reset_token_expires, created_at, updated_at 
      FROM users 
      WHERE email = ${req.email}
    `;

    // Always return success to prevent email enumeration
    if (!user) {
      return {
        success: true,
        message: "If an account with this email exists, a password reset link has been sent."
      };
    }

    // Generate reset token and set expiration
    const resetToken = generateResetToken();
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    
    // Store reset token in user record
    await db.exec`
      UPDATE users 
      SET reset_token = ${resetToken}, reset_token_expires = ${resetTokenExpires}, updated_at = NOW()
      WHERE id = ${user.id}
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
  async (req: ResetPasswordRequest): Promise<PasswordResponse> => {
    if (!req.token || !req.newPassword) {
      throw APIError.invalidArgument("Token and new password are required");
    }

    if (req.newPassword.length < 6) {
      throw APIError.invalidArgument("Password must be at least 6 characters long");
    }

    // Find user with valid reset token
    const user = await db.queryRow<User>`
      SELECT id, email, password_hash, is_verified, verification_token, reset_token, reset_token_expires, created_at, updated_at 
      FROM users 
      WHERE reset_token = ${req.token} 
        AND reset_token_expires > NOW()
    `;

    if (!user) {
      throw APIError.invalidArgument("Invalid or expired reset token");
    }

    // Hash new password
    const passwordHash = await hashPassword(req.newPassword);

    // Update user password and clear reset token
    await db.exec`
      UPDATE users 
      SET password_hash = ${passwordHash}, 
          reset_token = NULL, 
          reset_token_expires = NULL, 
          updated_at = NOW()
      WHERE id = ${user.id}
    `;

    // Revoke all existing refresh tokens for this user (force re-login)
    await revokeAllUserTokens(user.id);

    return {
      success: true,
      message: "Password has been reset successfully. Please sign in with your new password."
    };
  }
);

export const changePassword = api(
  { method: "POST", path: "/auth/change-password", expose: true },
  async (req: ChangePasswordRequest): Promise<PasswordResponse> => {
    let accessToken: string | null = null;

    // First try to get token from Authorization header
    const authHeader = req.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7); // Remove 'Bearer ' prefix
    }

    // If not found in header, try cookies as fallback
    if (!accessToken) {
      accessToken = req.accessToken?.value || null;
    }

    if (!accessToken) {
      throw APIError.unauthenticated("No access token provided");
    }

    if (!req.currentPassword || !req.newPassword) {
      throw APIError.invalidArgument("Current password and new password are required");
    }

    if (req.newPassword.length < 6) {
      throw APIError.invalidArgument("New password must be at least 6 characters long");
    }

    // Extract user info from access token
    const { userId } = extractUserFromToken(accessToken);

    // Get user with current password hash
    const user = await db.queryRow`
      SELECT id, password_hash FROM users WHERE id = ${userId}
    `;

    if (!user) {
      throw APIError.unauthenticated("User not found");
    }

    // Verify current password
    const isValidPassword = await verifyPassword(req.currentPassword, user.password_hash);
    if (!isValidPassword) {
      throw APIError.invalidArgument("Current password is incorrect");
    }

    // Hash new password
    const passwordHash = await hashPassword(req.newPassword);

    // Update user password
    await db.exec`
      UPDATE users 
      SET password_hash = ${passwordHash}, updated_at = NOW()
      WHERE id = ${user.id}
    `;

    // Revoke all other refresh tokens for this user (keep current session)
    await revokeAllUserTokens(user.id);

    return {
      success: true,
      message: "Password changed successfully"
    };
  }
); 