import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const prismaClientSingleton = () => {
  let connectionString = process.env.DATABASE_URL || (
    process.env.NEXT_PHASE === 'phase-production-build'
      ? 'postgresql://localhost:5432/build-placeholder'
      : undefined
  )
  if (!connectionString) throw new Error('DATABASE_URL is required')

  if (connectionString.startsWith('postgres') && !connectionString.includes('uselibpqcompat=true')) {
    connectionString += (connectionString.includes('?') ? '&' : '?') + 'uselibpqcompat=true'
  }

  const adapter = new PrismaPg({ connectionString })
  return new PrismaClient({ adapter })
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
