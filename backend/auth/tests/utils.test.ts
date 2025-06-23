/**
 * Test utilities for authentication service
 * Run these tests with: node --test utils.test.ts
 * Or setup Jest/Vitest for full test runner support
 */

import { 
  hashPassword, 
  verifyPassword, 
  generateResetToken, 
  generateVerificationToken 
} from '../utils/password';
import { setCookies, clearCookies } from '../utils/cookies';
import { streamToString, validateHttpResponse } from '../utils/validation';
import { Readable } from 'stream';
import { IncomingMessage } from 'http';

// Simple test runner functions for demonstration
const test = (name: string, fn: () => Promise<void> | void) => {
  console.log(`Testing: ${name}`);
  try {
    const result = fn();
    if (result instanceof Promise) {
      result.then(() => console.log(`✅ ${name} passed`))
            .catch(e => console.log(`❌ ${name} failed:`, e.message));
    } else {
      console.log(`✅ ${name} passed`);
    }
  } catch (e) {
    console.log(`❌ ${name} failed:`, (e as Error).message);
  }
};

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

const assertEqual = (actual: any, expected: any, message?: string) => {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
};

// Password utility tests
export const testPasswordUtils = async () => {
  console.log('\n=== Password Utilities Tests ===');

  await test('hashPassword should create a hash', async () => {
    const password = 'testpassword123';
    const hash = await hashPassword(password);
    
    assert(!!hash, 'Hash should be truthy');
    assert(hash !== password, 'Hash should be different from password');
    assert(hash.length > 50, 'Hash should be long enough');
  });

  await test('verifyPassword should work correctly', async () => {
    const password = 'testpassword123';
    const hash = await hashPassword(password);
    
    const isValid = await verifyPassword(password, hash);
    assert(isValid === true, 'Should verify correct password');
    
    const isInvalid = await verifyPassword('wrongpassword', hash);
    assert(isInvalid === false, 'Should reject wrong password');
  });

  test('generateResetToken should create unique tokens', () => {
    const token1 = generateResetToken();
    const token2 = generateResetToken();
    
    assert(!!token1, 'Token1 should be truthy');
    assert(!!token2, 'Token2 should be truthy');
    assert(token1 !== token2, 'Tokens should be unique');
    assertEqual(token1.length, 64, 'Reset token should be 64 chars');
  });

  test('generateVerificationToken should create unique tokens', () => {
    const token1 = generateVerificationToken();
    const token2 = generateVerificationToken();
    
    assert(!!token1, 'Token1 should be truthy');
    assert(!!token2, 'Token2 should be truthy');
    assert(token1 !== token2, 'Tokens should be unique');
    assertEqual(token1.length, 64, 'Verification token should be 64 chars');
  });
};

// Cookie utility tests
export const testCookieUtils = () => {
  console.log('\n=== Cookie Utilities Tests ===');

  test('setCookies should set headers correctly', () => {
    const mockResponse = {
      setHeader: (name: string, value: string[]) => {
        console.log(`Setting header ${name}:`, value);
        // In real tests, you'd verify the exact format
        assert(name === 'Set-Cookie', 'Should set Set-Cookie header');
        assert(Array.isArray(value), 'Should set array of cookies');
        assert(value.length === 2, 'Should set 2 cookies');
      }
    };

    setCookies(mockResponse as any, 'access-token', 'refresh-token');
  });

  test('clearCookies should clear headers correctly', () => {
    const mockResponse = {
      setHeader: (name: string, value: string[]) => {
        assert(name === 'Set-Cookie', 'Should set Set-Cookie header');
        assert(Array.isArray(value), 'Should set array of cookies');
        assert(value.length === 2, 'Should clear 2 cookies');
      }
    };

    clearCookies(mockResponse as any);
  });
};

// Stream utility tests
export const testStreamUtils = async () => {
  console.log('\n=== Stream Utilities Tests ===');

  await test('streamToString should convert stream to string', async () => {
    const testData = 'test data content';
    const stream = new Readable();
    stream.push(testData);
    stream.push(null);

    const mockStream = stream as unknown as IncomingMessage;
    const result = await streamToString(mockStream);
    assertEqual(result, testData, 'Should convert stream to string correctly');
  });

  await test('streamToString should handle empty stream', async () => {
    const stream = new Readable();
    stream.push(null);

    const mockStream = stream as unknown as IncomingMessage;
    const result = await streamToString(mockStream);
    assertEqual(result, '', 'Should handle empty stream');
  });
};

// Validation utility tests
export const testValidationUtils = () => {
  console.log('\n=== Validation Utilities Tests ===');

  test('validateHttpResponse should validate success responses', () => {
    const response = { success: true, message: 'OK' };
    const isValid = validateHttpResponse(response, 200);
    assert(isValid, 'Should validate success response');
  });

  test('validateHttpResponse should validate error responses', () => {
    const response = { code: 'invalid_argument', message: 'Error' };
    const isValid = validateHttpResponse(response, 400);
    assert(isValid, 'Should validate error response');
  });
};

// Run all tests
export const runAllUtilTests = async () => {
  console.log('🧪 Running Authentication Utility Tests\n');
  
  await testPasswordUtils();
  testCookieUtils();
  await testStreamUtils();
  testValidationUtils();
  
  console.log('\n✨ All utility tests completed!');
};

// Example usage:
// runAllUtilTests().catch(console.error); 