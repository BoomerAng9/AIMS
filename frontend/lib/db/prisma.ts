// frontend/lib/db/prisma.ts
// Prisma client singleton for Next.js
//
// Lazy initialization: avoids crashing at import time when DATABASE_URL is
// missing (e.g., Vercel deployments where only the frontend is deployed and
// the database lives on the VPS).

import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

// Lazy singleton — only connects when first query is made
export const prisma: PrismaClient = global.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

export default prisma;
