-- Drop old session-based authentication tables since we're using JWT now
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS password_reset_tokens; 