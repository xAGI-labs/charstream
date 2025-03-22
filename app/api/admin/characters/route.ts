import { NextResponse } from "next/server"
import { PrismaClient, Prisma } from "@prisma/client"
import { cookies } from "next/headers"

const prisma = new PrismaClient()

// Admin authentication middleware
async function verifyAdminAuth() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value

  if (!token) {
    return false
  }

  // Verify the token (simplified check)
  return token.length > 0
}

export async function GET(req: Request) {
  try {
    // Verify admin authentication
    const isAdmin = await verifyAdminAuth()
    if (!isAdmin) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Parse query parameters
    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const search = url.searchParams.get('search') || ''
    
    const skip = (page - 1) * limit
    
    // Apply search filter if provided
    let where: Prisma.CharacterWhereInput = {}
    
    if (search) {
      where = {
        OR: [
          { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { description: { contains: search, mode: Prisma.QueryMode.insensitive } }
        ]
      }
    }
    
    // Get characters with pagination
    const [characters, total] = await Promise.all([
      prisma.character.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.character.count({ where })
    ])
    
    return NextResponse.json({ characters, total })
  } catch (error) {
    console.error("[ADMIN_CHARACTERS_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
