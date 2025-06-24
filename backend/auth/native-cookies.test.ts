import { describe, expect, test } from "vitest";
import { signup, signin, me } from "./endpoints/auth";

describe("Native Cookie Authentication", () => {
  test("should set cookies in signup response", async () => {
    const email = `test-${Date.now()}@example.com`;
    const password = "password123";

    const response = await signup({
      email,
      password,
    });

    // Check that response includes user data and access token
    expect(response.user.email).toBe(email);
    expect(response.user.is_verified).toBe(false);
    expect(response.access_token).toBeDefined();
    expect(typeof response.access_token).toBe("string");

    // Check that response includes cookie configuration
    expect(response.accessToken).toBeDefined();
    expect(response.accessToken.value).toBe(response.access_token);
    expect(response.accessToken.httpOnly).toBe(true);
    expect(response.accessToken.maxAge).toBe(30 * 60); // 30 minutes
    expect(response.accessToken.path).toBe("/");

    expect(response.refreshToken).toBeDefined();
    expect(response.refreshToken.httpOnly).toBe(true);
    expect(response.refreshToken.maxAge).toBe(7 * 24 * 60 * 60); // 7 days
    expect(response.refreshToken.path).toBe("/");
  });

  test("should set cookies in signin response", async () => {
    // First create a user
    const email = `test-${Date.now()}@example.com`;
    const password = "password123";
    await signup({ email, password });

    // Then sign in
    const response = await signin({
      email,
      password,
    });

    // Check that response includes user data and access token
    expect(response.user.email).toBe(email);
    expect(response.user.is_verified).toBe(false);
    expect(response.access_token).toBeDefined();
    expect(typeof response.access_token).toBe("string");

    // Check that response includes cookie configuration
    expect(response.accessToken).toBeDefined();
    expect(response.accessToken.value).toBe(response.access_token);
    expect(response.accessToken.httpOnly).toBe(true);
    expect(response.accessToken.maxAge).toBe(30 * 60); // 30 minutes

    expect(response.refreshToken).toBeDefined();
    expect(response.refreshToken.httpOnly).toBe(true);
    expect(response.refreshToken.maxAge).toBe(7 * 24 * 60 * 60); // 7 days
  });

  test("should read access token from Authorization header", async () => {
    // Create and sign in a user
    const email = `test-${Date.now()}@example.com`;
    const password = "password123";
    await signup({ email, password });
    const signinResponse = await signin({ email, password });

    // Test /me endpoint with Authorization header
    const meResponse = await me({
      authorization: `Bearer ${signinResponse.access_token}`,
    });

    expect(meResponse.id).toBe(signinResponse.user.id);
    expect(meResponse.email).toBe(email);
    expect(meResponse.is_verified).toBe(false);
  });

  test("should read access token from cookie as fallback", async () => {
    // Create and sign in a user
    const email = `test-${Date.now()}@example.com`;
    const password = "password123";
    await signup({ email, password });
    const signinResponse = await signin({ email, password });

    // Test /me endpoint with cookie (simulating cookie-based auth)
    const meResponse = await me({
      accessToken: {
        value: signinResponse.access_token,
        httpOnly: true,
        secure: false,
        sameSite: "Lax",
        maxAge: 30 * 60,
        path: "/",
      },
    });

    expect(meResponse.id).toBe(signinResponse.user.id);
    expect(meResponse.email).toBe(email);
    expect(meResponse.is_verified).toBe(false);
  });

  test("should handle environment-specific cookie settings", async () => {
    // Test development environment (default)
    const email = `test-${Date.now()}@example.com`;
    const password = "password123";

    const response = await signup({ email, password });

    // In development, cookies should use Lax and not be secure
    expect(response.accessToken.secure).toBe(false);
    expect(response.accessToken.sameSite).toBe("Lax");
    expect(response.refreshToken.secure).toBe(false);
    expect(response.refreshToken.sameSite).toBe("Lax");
  });
}); 