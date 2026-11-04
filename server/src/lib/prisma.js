import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.ts";

const databaseUrl = process.env.DATABASE_URL?.replace(
  "@localhost:",
  "@127.0.0.1:",
);
if (!databaseUrl) {
  throw new Error("DATABASE_URL is missing");
}

function createPrisma() {
  const adapter = new PrismaMariaDb(databaseUrl);
  return new PrismaClient({ adapter });
}

const prisma = globalThis.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export default prisma;
