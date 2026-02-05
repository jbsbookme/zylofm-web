import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL)

export const prisma = hasDatabaseUrl
  ? globalForPrisma.prisma ?? new PrismaClient()
  : (undefined as unknown as PrismaClient)

if (hasDatabaseUrl && process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
