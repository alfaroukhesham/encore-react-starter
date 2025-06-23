import { api, APIError } from "encore.dev/api";
import { CronJob } from "encore.dev/cron";
import { db } from "../db";

// Cleanup expired and revoked refresh tokens (Cron Job)
export const cleanupExpiredTokens = api(
  { method: "POST", path: "/auth/cleanup-tokens" },
  async (): Promise<{ success: boolean; message: string }> => {
    try {
      console.log('Starting refresh token cleanup...');
      
      // First, count tokens that will be deleted
      const countResult = await db.queryRow`
        SELECT COUNT(*) as count FROM refresh_tokens 
        WHERE expires_at < NOW() OR revoked = TRUE
      `;
      
      const tokensToDelete = countResult?.count || 0;
      
      // Early return if no tokens to delete - skip unnecessary DELETE operation
      if (tokensToDelete === 0) {
        console.log('No expired or revoked tokens found - cleanup skipped');
        return {
          success: true,
          message: 'No expired or revoked refresh tokens found - database is clean'
        };
      }
      
      // Only run DELETE if there are actually tokens to remove
      await db.exec`
        DELETE FROM refresh_tokens 
        WHERE expires_at < NOW() OR revoked = TRUE
      `;
      
      console.log(`Cleanup completed: ${tokensToDelete} tokens deleted`);
      
      return {
        success: true,
        message: `Successfully cleaned up ${tokensToDelete} expired/revoked refresh tokens`
      };
      
    } catch (error) {
      console.error('Token cleanup error:', error);
      throw APIError.internal('Failed to cleanup refresh tokens');
    }
  }
);

// Cron job to run token cleanup every 6 hours
const _ = new CronJob("refresh-token-cleanup", {
  title: "Clean up expired refresh tokens",
  every: "6h",
  endpoint: cleanupExpiredTokens,
}); 