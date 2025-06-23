import { db } from "../db";

/**
 * Store refresh token in database for revocation tracking
 */
export const storeRefreshToken = async (userId: string, jti: string): Promise<void> => {
  await db.exec`
    INSERT INTO refresh_tokens (user_id, jti)
    VALUES (${userId}, ${jti})
  `;
};

/**
 * Check if refresh token is valid (not revoked)
 */
export const isRefreshTokenValid = async (jti: string): Promise<boolean> => {
  const token = await db.queryRow`
    SELECT id FROM refresh_tokens 
    WHERE jti = ${jti} 
      AND expires_at > NOW() 
      AND revoked = FALSE
  `;
  return !!token;
};

/**
 * Revoke refresh token
 */
export const revokeRefreshToken = async (jti: string): Promise<void> => {
  await db.exec`
    UPDATE refresh_tokens 
    SET revoked = TRUE, revoked_at = NOW()
    WHERE jti = ${jti}
  `;
};

/**
 * Revoke all user's refresh tokens
 */
export const revokeAllUserTokens = async (userId: string): Promise<void> => {
  await db.exec`
    UPDATE refresh_tokens 
    SET revoked = TRUE, revoked_at = NOW()
    WHERE user_id = ${userId} AND revoked = FALSE
  `;
}; 