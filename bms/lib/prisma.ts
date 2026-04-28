// Singleton Prisma client with MariaDB/MySQL driver adapter (Prisma v7 requirement)
import { PrismaClient } from "@/generated/client/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function buildPoolConfig(dbUrl: string) {
  const u = new URL(dbUrl);
  return {
    host: u.hostname,
    port: parseInt(u.port || "3306"),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, ""),
    connectionLimit: 5,
    // Required for MySQL 8 caching_sha2_password auth plugin over TCP
    allowPublicKeyRetrieval: true,
  };
}

function createPrismaClient() {
  // Fallback URL allows prisma generate / next build to run without a live DB.
  const dbUrl =
    process.env.DATABASE_URL ?? "mysql://build:build@localhost:3306/build_placeholder";

  const adapter = new PrismaMariaDb(buildPoolConfig(dbUrl));

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
