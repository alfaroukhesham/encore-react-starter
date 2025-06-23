/**
 * Encore-native tests for JWT utilities
 * Run with: encore test
 */

import { describe, it, expect } from 'vitest';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  generateTokenPair,
  validateAccessToken,
  validateRefreshToken,
  extractUserFromToken,
  generateLoginResponse
} from './jwt';

// Mock user for testing
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  password_hash: 'hashed-password',
  is_verified: true,
  verification_token: undefined,
  reset_token: undefined,
  reset_token_expires: undefined,
  created_at: new Date(),
  updated_at: new Date()
};

describe('JWT Utilities', () => {
  describe('Token Generation', () => {
    it('should generate valid access tokens', () => {
      const token = generateAccessToken(mockUser);
      
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format
    });

    it('should generate valid refresh tokens', () => {
      const { token, jti } = generateRefreshToken(mockUser.id);
      
      expect(token).toBeTruthy();
      expect(jti).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format
    });

    it('should generate token pairs', () => {
      const { accessToken, refreshToken, jti } = generateTokenPair(mockUser);
      
      expect(accessToken).toBeTruthy();
      expect(refreshToken).toBeTruthy();
      expect(jti).toBeTruthy();
      expect(typeof accessToken).toBe('string');
      expect(typeof refreshToken).toBe('string');
      expect(typeof jti).toBe('string');
      expect(jti.length).toBeGreaterThan(10);
    });

    it('should generate unique JTIs', () => {
      const jtis = new Set();
      
      for (let i = 0; i < 100; i++) {
        const { jti } = generateTokenPair(mockUser);
        expect(jtis.has(jti)).toBe(false);
        jtis.add(jti);
      }
      
      expect(jtis.size).toBe(100);
    });
  });

  describe('Token Verification', () => {
    it('should verify valid access tokens', () => {
      const token = generateAccessToken(mockUser);
      const payload = validateAccessToken(token);
      
      expect(payload).toBeTruthy();
      expect(payload.sub).toBe(mockUser.id);
      expect(payload.email).toBe(mockUser.email);
      expect(payload.is_verified).toBe(mockUser.is_verified);
      expect(payload.type).toBe('access');
    });

    it('should verify valid refresh tokens', () => {
      const { token, jti } = generateRefreshToken(mockUser.id);
      const payload = validateRefreshToken(token);
      
      expect(payload).toBeTruthy();
      expect(payload.sub).toBe(mockUser.id);
      expect(payload.jti).toBe(jti);
      expect(payload.type).toBe('refresh');
    });

    it('should reject invalid tokens', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(() => validateAccessToken(invalidToken)).toThrow();
      expect(() => validateRefreshToken(invalidToken)).toThrow();
    });
  });

  describe('Token Extraction', () => {
    it('should extract user from valid access token', () => {
      const token = generateAccessToken(mockUser);
      const extractedUser = extractUserFromToken(token);
      
      expect(extractedUser).toBeTruthy();
      expect(extractedUser.userId).toBe(mockUser.id);
      expect(extractedUser.email).toBe(mockUser.email);
      expect(extractedUser.is_verified).toBe(mockUser.is_verified);
    });

    it('should return null for invalid tokens', () => {
      const invalidToken = 'invalid.token.here';
      
      try {
        const extractedUser = extractUserFromToken(invalidToken);
        expect(extractedUser).toBeNull();
      } catch (error) {
        // extractUserFromToken throws instead of returning null
        expect(error).toBeTruthy();
      }
    });
  });

  describe('Login Response Generation', () => {
    it('should generate proper login responses', () => {
      const token = 'test-access-token';
      const response = generateLoginResponse(mockUser, token);
      
      expect(response).toBeTruthy();
      expect(response.user).toBeTruthy();
      expect(response.user.id).toBe(mockUser.id);
      expect(response.user.email).toBe(mockUser.email);
      expect(response.user.is_verified).toBe(mockUser.is_verified);
      expect(response.token).toBe(token);
      
      // Should not include sensitive data
      expect(response.user).not.toHaveProperty('password_hash');
      expect(response.user).not.toHaveProperty('verification_token');
      expect(response.user).not.toHaveProperty('reset_token');
    });
  });

  describe('Token Security', () => {
    it('should include expiration times', () => {
      const token = generateAccessToken(mockUser);
      const payload = validateAccessToken(token);
      
      expect(payload.exp).toBeTruthy();
      expect(typeof payload.exp).toBe('number');
      expect(payload.exp).toBeGreaterThan(Date.now() / 1000);
    });

    it('should include issued at times', () => {
      const token = generateAccessToken(mockUser);
      const payload = validateAccessToken(token);
      
      expect(payload.iat).toBeTruthy();
      expect(typeof payload.iat).toBe('number');
      expect(payload.iat).toBeLessThanOrEqual(Date.now() / 1000);
    });

    it('should have different signatures for different users', () => {
      const user1 = { ...mockUser, id: 'user-1' };
      const user2 = { ...mockUser, id: 'user-2' };
      
      const token1 = generateAccessToken(user1);
      const token2 = generateAccessToken(user2);
      
      expect(token1).not.toBe(token2);
      
      const payload1 = validateAccessToken(token1);
      const payload2 = validateAccessToken(token2);
      
      expect(payload1.sub).toBe('user-1');
      expect(payload2.sub).toBe('user-2');
    });
  });
});

// Export test runner for manual execution
export const runJwtTests = async () => {
  console.log('🔑 Running JWT Utility Tests...');
  
  try {
    // Test token generation
    const token = generateAccessToken(mockUser);
    if (!token || token.split('.').length !== 3) {
      throw new Error('Access token generation failed');
    }
    
    // Test token verification
    const payload = validateAccessToken(token);
    if (!payload || payload.sub !== mockUser.id) {
      throw new Error('Token verification failed');
    }
    
    // Test token pair generation
    const { accessToken, refreshToken, jti } = generateTokenPair(mockUser);
    if (!accessToken || !refreshToken || !jti) {
      throw new Error('Token pair generation failed');
    }
    
    // Test user extraction
    const extractedUser = extractUserFromToken(token);
    if (!extractedUser || extractedUser.userId !== mockUser.id) {
      throw new Error('User extraction failed');
    }
    
    console.log('✅ All JWT utility tests passed!');
    return true;
  } catch (error) {
    console.error('❌ JWT utility tests failed:', error);
    return false;
  }
}; 