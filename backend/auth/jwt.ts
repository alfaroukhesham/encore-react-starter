import jwt from 'jsonwebtoken';
import { APIError, ErrCode } from 'encore.dev/api';
import { secret } from 'encore.dev/config';
import crypto from 'crypto';
import { User, LoginResponse } from './types';

// JWT Secrets from Encore configuration
const JWT_ACCESS_SECRET = secret("JWT_ACCESS_SECRET");
const JWT_REFRESH_SECRET = secret("JWT_REFRESH_SECRET");

// Token expiration times
const ACCESS_TOKEN_EXPIRY = '30m';  // 30 minutes
const REFRESH_TOKEN_EXPIRY = '7d';  // 7 days

// Cookie configuration
export const ACCESS_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 30 * 60 * 1000, // 30 minutes in milliseconds
  path: '/'
};

export const REFRESH_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  path: '/'
};

// JWT Payload interfaces
export interface AccessTokenPayload {
  sub: string;           // User ID
  email: string;         // User email
  is_verified: boolean;  // User verification status
  iat: number;           // Issued at
  exp: number;           // Expires at
  type: 'access';        // Token type
}

export interface RefreshTokenPayload {
  sub: string;           // User ID
  iat: number;           // Issued at
  exp: number;           // Expires at
  type: 'refresh';       // Token type
  jti: string;           // JWT ID for revocation tracking
}

// Generate a unique JWT ID for refresh tokens
export const generateJTI = (): string => {
  return crypto.randomBytes(16).toString('hex');
};

// Generate access token from User object
export const generateAccessToken = (user: User): string => {
  const payload: Omit<AccessTokenPayload, 'iat' | 'exp'> = {
    sub: user.id,
    email: user.email,
    is_verified: user.is_verified,
    type: 'access'
  };

  return jwt.sign(payload, JWT_ACCESS_SECRET(), {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: 'cms-react-encore',
    audience: 'cms-users'
  });
};

// Generate refresh token
export const generateRefreshToken = (userId: string): { token: string; jti: string } => {
  const jti = generateJTI();
  
  const payload: Omit<RefreshTokenPayload, 'iat' | 'exp'> = {
    sub: userId,
    type: 'refresh',
    jti
  };

  const token = jwt.sign(payload, JWT_REFRESH_SECRET(), {
    expiresIn: REFRESH_TOKEN_EXPIRY,
    issuer: 'cms-react-encore',
    audience: 'cms-users'
  });

  return { token, jti };
};

// Generate token pair (access + refresh) from User object
export const generateTokenPair = (user: User): { accessToken: string; refreshToken: string; jti: string } => {
  const accessToken = generateAccessToken(user);
  const { token: refreshToken, jti } = generateRefreshToken(user.id);
  
  return { accessToken, refreshToken, jti };
};

// Generate LoginResponse from User object and token
export const generateLoginResponse = (user: User, token: string): LoginResponse => {
  return {
    user: {
      id: user.id,
      email: user.email,
      is_verified: user.is_verified,
    },
    token
  };
};

// Validate access token
export const validateAccessToken = (token: string): AccessTokenPayload => {
  try {
    const payload = jwt.verify(token, JWT_ACCESS_SECRET(), {
      issuer: 'cms-react-encore',
      audience: 'cms-users'
    }) as AccessTokenPayload;

    if (payload.type !== 'access') {
      throw new APIError(ErrCode.Unauthenticated, 'Invalid token type');
    }

    return payload;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new APIError(ErrCode.Unauthenticated, 'Invalid access token');
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new APIError(ErrCode.Unauthenticated, 'Access token expired');
    }
    throw error;
  }
};

// Validate refresh token
export const validateRefreshToken = (token: string): RefreshTokenPayload => {
  try {
    const payload = jwt.verify(token, JWT_REFRESH_SECRET(), {
      issuer: 'cms-react-encore',
      audience: 'cms-users'
    }) as RefreshTokenPayload;

    if (payload.type !== 'refresh') {
      throw new APIError(ErrCode.Unauthenticated, 'Invalid token type');
    }

    return payload;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new APIError(ErrCode.Unauthenticated, 'Invalid refresh token');
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new APIError(ErrCode.Unauthenticated, 'Refresh token expired');
    }
    throw error;
  }
};

// Extract user info from access token (for middleware)
export const extractUserFromToken = (token: string): { userId: string; email: string; is_verified: boolean } => {
  const payload = validateAccessToken(token);
  return {
    userId: payload.sub,
    email: payload.email,
    is_verified: payload.is_verified
  };
};

// Decode token without verification (for debugging/logging)
export const decodeToken = (token: string): any => {
  return jwt.decode(token);
}; 