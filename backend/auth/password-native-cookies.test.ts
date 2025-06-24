import { describe, expect, test } from "vitest";
import { signup, signin } from "./endpoints/auth";
import { forgotPassword, resetPassword, changePassword } from "./endpoints/password";
import { db } from "./db";

describe("Password Management with Native Cookies", () => {
  test("should handle forgot password request", async () => {
    // Create a user first
    const email = `test-${Date.now()}@example.com`;
    const password = "password123";
    await signup({ email, password });

    // Test forgot password
    const response = await forgotPassword({ email });

    expect(response.success).toBe(true);
    expect(response.message).toBe("If an account with this email exists, a password reset link has been sent.");

    // Verify reset token was stored in database
    const user = await db.queryRow`
      SELECT reset_token, reset_token_expires FROM users WHERE email = ${email}
    `;
    expect(user?.reset_token).toBeDefined();
    expect(user?.reset_token_expires).toBeDefined();
  });

  test("should handle forgot password for non-existent email", async () => {
    const response = await forgotPassword({ 
      email: "nonexistent@example.com" 
    });

    // Should still return success to prevent email enumeration
    expect(response.success).toBe(true);
    expect(response.message).toBe("If an account with this email exists, a password reset link has been sent.");
  });

  test("should reset password with valid token", async () => {
    // Create a user and request password reset
    const email = `test-${Date.now()}@example.com`;
    const password = "password123";
    await signup({ email, password });
    await forgotPassword({ email });

    // Get the reset token from database
    const user = await db.queryRow`
      SELECT reset_token FROM users WHERE email = ${email}
    `;
    expect(user?.reset_token).toBeDefined();

    // Reset password
    const newPassword = "newpassword456";
    const response = await resetPassword({
      token: user!.reset_token,
      newPassword
    });

    expect(response.success).toBe(true);
    expect(response.message).toBe("Password has been reset successfully. Please sign in with your new password.");

    // Verify password was changed by trying to sign in with new password
    const signinResponse = await signin({
      email,
      password: newPassword
    });
    expect(signinResponse.user.email).toBe(email);

    // Verify reset token was cleared
    const updatedUser = await db.queryRow`
      SELECT reset_token, reset_token_expires FROM users WHERE email = ${email}
    `;
    expect(updatedUser?.reset_token).toBeNull();
    expect(updatedUser?.reset_token_expires).toBeNull();
  });

  test("should reject invalid reset token", async () => {
    await expect(resetPassword({
      token: "invalid-token",
      newPassword: "newpassword123"
    })).rejects.toThrow("Invalid or expired reset token");
  });

  test("should change password with Authorization header", async () => {
    // Create and sign in a user
    const email = `test-${Date.now()}@example.com`;
    const password = "password123";
    await signup({ email, password });
    const signinResponse = await signin({ email, password });

    // Change password using Authorization header
    const newPassword = "newpassword456";
    const response = await changePassword({
      currentPassword: password,
      newPassword,
      authorization: `Bearer ${signinResponse.access_token}`
    });

    expect(response.success).toBe(true);
    expect(response.message).toBe("Password changed successfully");

    // Verify password was changed by signing in with new password
    const newSigninResponse = await signin({
      email,
      password: newPassword
    });
    expect(newSigninResponse.user.email).toBe(email);
  });

  test("should change password with cookie authentication", async () => {
    // Create and sign in a user
    const email = `test-${Date.now()}@example.com`;
    const password = "password123";
    await signup({ email, password });
    const signinResponse = await signin({ email, password });

    // Change password using cookie authentication
    const newPassword = "newpassword456";
    const response = await changePassword({
      currentPassword: password,
      newPassword,
      accessToken: {
        value: signinResponse.access_token,
        httpOnly: true,
        secure: false,
        sameSite: "Lax",
        maxAge: 30 * 60,
        path: "/",
      }
    });

    expect(response.success).toBe(true);
    expect(response.message).toBe("Password changed successfully");

    // Verify password was changed
    const newSigninResponse = await signin({
      email,
      password: newPassword
    });
    expect(newSigninResponse.user.email).toBe(email);
  });

  test("should reject change password with incorrect current password", async () => {
    // Create and sign in a user
    const email = `test-${Date.now()}@example.com`;
    const password = "password123";
    await signup({ email, password });
    const signinResponse = await signin({ email, password });

    // Try to change password with wrong current password
    await expect(changePassword({
      currentPassword: "wrongpassword",
      newPassword: "newpassword456",
      authorization: `Bearer ${signinResponse.access_token}`
    })).rejects.toThrow("Current password is incorrect");
  });

  test("should reject change password without authentication", async () => {
    await expect(changePassword({
      currentPassword: "password123",
      newPassword: "newpassword456"
    })).rejects.toThrow("No access token provided");
  });

  test("should validate password requirements", async () => {
    // Test short password in reset
    await expect(resetPassword({
      token: "some-token",
      newPassword: "123"
    })).rejects.toThrow("Password must be at least 6 characters long");

    // Create and sign in a user for change password test
    const email = `test-${Date.now()}@example.com`;
    const password = "password123";
    await signup({ email, password });
    const signinResponse = await signin({ email, password });

    // Test short password in change
    await expect(changePassword({
      currentPassword: password,
      newPassword: "123",
      authorization: `Bearer ${signinResponse.access_token}`
    })).rejects.toThrow("New password must be at least 6 characters long");
  });
}); 