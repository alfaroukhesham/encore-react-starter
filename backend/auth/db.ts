import { SQLDatabase } from "encore.dev/storage/sqldb";

// Create the auth database - Encore will handle the connection automatically in development
export const db = new SQLDatabase("auth", {
  migrations: "./migrations",
}); 