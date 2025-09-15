import { PrismaClient } from '@prisma/client'
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'

let prisma: PrismaClient | null = null

async function getDatabasePath(): Promise<string> {
  if (Capacitor.isNativePlatform()) {
    try {
      const dbUri = await Filesystem.getUri({
        directory: Directory.Data,
        path: 'corpore.db'
      })
      return dbUri.uri
    } catch (error) {
      console.error('Error getting database path:', error)
      // Fallback to relative path
      return './corpore.db'
    }
  } else {
    // Web environment - use existing setup
    return process.env.DATABASE_URL || 'file:./prisma/dev.db'
  }
}

export async function getPrismaClient(): Promise<PrismaClient> {
  if (prisma) {
    return prisma
  }

  const databaseUrl = await getDatabasePath()
  
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      }
    }
  })

  return prisma
}

export async function initializeMobileDatabase(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return // Skip for web
  }

  try {
    const client = await getPrismaClient()
    
    // Test connection
    await client.$connect()
    
    // Run migrations programmatically if needed
    // Note: For production, you might want to bundle pre-built DB
    console.log('Mobile database initialized successfully')
  } catch (error) {
    console.error('Failed to initialize mobile database:', error)
    throw error
  }
}

export default getPrismaClient