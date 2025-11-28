/**
 * Minimal DB adapter that attempts to use Prisma if available.
 * - If `@prisma/client` is installed and `DATABASE_URL` is configured, this will export a `prisma` client.
 * - Otherwise it exports `null` and routes fall back to in-memory mocks.
 */
let prisma: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient();
} catch (e) {
  // Prisma not installed or not configured — fall back to null.
  prisma = null;
}

export { prisma };
