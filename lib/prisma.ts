import { PrismaClient } from '@prisma/client'

// Prevent multiple instances of Prisma Client in development
declare global {
  var prisma: PrismaClient | undefined
}

// Create a singleton instance of the Prisma client
export const prisma = globalThis.prisma || new PrismaClient()

// In development, attach the client to the global object to prevent duplicates
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}
