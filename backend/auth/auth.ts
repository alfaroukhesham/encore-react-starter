/**
 * Authentication service - Main entry point
 * 
 * This file re-exports all authentication endpoints from their respective modules:
 * - Core auth: signup, signin, logout, refresh, me
 * - Password management: forgot, reset, change password
 * - Maintenance: token cleanup cron job
 */

// Re-export all authentication endpoints
export * from "./endpoints/auth";
export * from "./endpoints/password"; 
export * from "./endpoints/maintenance";

// Re-export types for external use
export * from "./types"; 