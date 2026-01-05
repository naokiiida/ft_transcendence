/**
 * Prisma configuration for ft_transcendence
 * Uses LibSQL (Turso) with driver adapter
 */
import { defineConfig } from "prisma/config";

// Load environment from secret/.env
import { config } from "dotenv";
config({ path: "secret/.env" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"] ?? "file:./dev.db",
  },
});
