// Singleton Prisma client with MariaDB/MySQL driver adapter (Prisma v7 requirement)
import { PrismaClient } from "@/generated/client/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

function parseDbUrl(url: string) {
  // Parse mysql://user:password@host:port/database
  const u = new URL(url);
  return {
    host: u.hostname,
    port: parseInt(u.port || "3306"),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, ""),
    connectionLimit: 5,
  };
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // During Next.js build (static page collection) no real DB connection is made.
  // Use a dummy URL so the client can be instantiated without connecting.
  const dbUrl =
    process.env.DATABASE_URL ?? "mysql://build:build@localhost:3306/build_placeholder";

  const config = parseDbUrl(dbUrl);
  const adapter = new PrismaMariaDb(config);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
