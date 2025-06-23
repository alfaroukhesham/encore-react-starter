/**
 * Encore-native tests for password utilities
 * Run with: encore test
 */

import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, generateResetToken, generateVerificationToken } from './password';

describe('Password Utilities', () => {
  describe('Password Hashing', () => {
    it('should hash passwords securely', async () => {
      const password = 'testpassword123';
      const hash = await hashPassword(password);
      
      expect(hash).toBeTruthy();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
      expect(hash.startsWith('$2b$')).toBe(true); // bcrypt format
    });

    it('should generate different hashes for same password', async () => {
      const password = 'samepassword';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
      expect(hash1.length).toBe(hash2.length);
    });

    it('should handle empty password', async () => {
      try {
        await hashPassword('');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Password Verification', () => {
    it('should verify correct passwords', async () => {
      const password = 'correctpassword';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect passwords', async () => {
      const password = 'correctpassword';
      const wrongPassword = 'wrongpassword';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });

    it('should handle malformed hashes', async () => {
      const password = 'testpassword';
      const malformedHash = 'not-a-valid-hash';
      
      const isValid = await verifyPassword(password, malformedHash);
      expect(isValid).toBe(false);
    });

    it('should be timing-attack resistant', async () => {
      const password = 'testpassword';
      const hash = await hashPassword(password);
      
      // Measure time for correct password
      const times = [];
      for (let i = 0; i < 3; i++) {
        const start = process.hrtime.bigint();
        await verifyPassword(password, hash);
        const end = process.hrtime.bigint();
        times.push(Number(end - start) / 1000000); // Convert to ms
      }
      
      // Measure time for incorrect password
      const wrongTimes = [];
      for (let i = 0; i < 3; i++) {
        const start = process.hrtime.bigint();
        await verifyPassword('wrongpassword', hash);
        const end = process.hrtime.bigint();
        wrongTimes.push(Number(end - start) / 1000000);
      }
      
      const avgCorrect = times.reduce((a, b) => a + b, 0) / times.length;
      const avgWrong = wrongTimes.reduce((a, b) => a + b, 0) / wrongTimes.length;
      
      // bcrypt should take similar time for both operations
      // Allow more variance since CI environments can be unpredictable
      const timeDifference = Math.abs(avgCorrect - avgWrong);
      expect(timeDifference).toBeLessThan(Math.max(avgCorrect, avgWrong) * 0.5); // Within 50%
      
      // The main goal is that both operations take substantial time (indicating bcrypt is working)
      expect(avgCorrect).toBeGreaterThan(50); // At least 50ms
      expect(avgWrong).toBeGreaterThan(50); // At least 50ms
    });
  });

  describe('Token Generation', () => {
    it('should generate reset tokens', () => {
      const token = generateResetToken();
      
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64); // 32 bytes = 64 hex chars
      expect(/^[a-f0-9]+$/.test(token)).toBe(true); // Should be hex
    });

    it('should generate verification tokens', () => {
      const token = generateVerificationToken();
      
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64); // 32 bytes = 64 hex chars
      expect(/^[a-f0-9]+$/.test(token)).toBe(true); // Should be hex
    });

    it('should generate unique tokens', () => {
      const resetTokens = new Set();
      const verificationTokens = new Set();
      
      for (let i = 0; i < 100; i++) {
        const resetToken = generateResetToken();
        const verificationToken = generateVerificationToken();
        
        expect(resetTokens.has(resetToken)).toBe(false);
        expect(verificationTokens.has(verificationToken)).toBe(false);
        
        resetTokens.add(resetToken);
        verificationTokens.add(verificationToken);
      }
      
      expect(resetTokens.size).toBe(100);
      expect(verificationTokens.size).toBe(100);
    });
  });

  describe('Security Properties', () => {
    it('should use sufficient salt rounds', async () => {
      const password = 'testpassword';
      const hash = await hashPassword(password);
      
      // bcrypt hash format: $2b$rounds$salt+hash
      const parts = hash.split('$');
      expect(parts.length).toBe(4);
      expect(parts[0]).toBe('');
      expect(parts[1]).toBe('2b');
      
      const rounds = parseInt(parts[2], 10);
      expect(rounds).toBeGreaterThanOrEqual(10); // Minimum secure rounds
    });

    it('should handle unicode passwords', async () => {
      const unicodePassword = '测试密码🔒';
      const hash = await hashPassword(unicodePassword);
      
      const isValid = await verifyPassword(unicodePassword, hash);
      expect(isValid).toBe(true);
    });

    it('should handle very long passwords', async () => {
      const longPassword = 'a'.repeat(1000);
      const hash = await hashPassword(longPassword);
      
      const isValid = await verifyPassword(longPassword, hash);
      expect(isValid).toBe(true);
    });
  });
});

// Export test runner for manual execution
export const runPasswordTests = async () => {
  console.log('🔐 Running Password Utility Tests...');
  
  try {
    // Test password hashing
    const password = 'testpassword123';
    const hash = await hashPassword(password);
    
    if (!hash || hash === password) {
      throw new Error('Password hashing failed');
    }
    
    // Test password verification
    const isValid = await verifyPassword(password, hash);
    const isInvalid = await verifyPassword('wrongpassword', hash);
    
    if (!isValid || isInvalid) {
      throw new Error('Password verification failed');
    }
    
    // Test token generation
    const resetToken = generateResetToken();
    const verificationToken = generateVerificationToken();
    if (!resetToken || resetToken.length !== 64 || !verificationToken || verificationToken.length !== 64) {
      throw new Error('Token generation failed');
    }
    
    console.log('✅ All password utility tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Password utility tests failed:', error);
    return false;
  }
}; 