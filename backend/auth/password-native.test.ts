import { describe, expect, test } from "vitest";
import { signup, signin } from "./endpoints/auth";
import { changePassword } from "./endpoints/password";

describe("Password Native Cookie Support", () => {
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
  });
}); 