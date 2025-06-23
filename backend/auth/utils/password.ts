import * as bcrypt from "bcrypt";
import crypto from "crypto";

/**
 * Hash a plain text password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

/**
 * Verify a plain text password against a hash
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Generate a secure random token for password reset
 */
export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Generate a secure random token for email verification
 */
export const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
}; 