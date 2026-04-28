// Prisma v7 configuration file
// Replaces datasource url in schema.prisma
import "dotenv/config";
import { defineConfig } from "prisma/config";

// Use a fallback so `prisma generate` works during Docker build (no DB needed)
const databaseUrl =
  process.env.DATABASE_URL ?? "mysql://build:build@localhost:3306/build_placeholder";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: databaseUrl,
  },
});
