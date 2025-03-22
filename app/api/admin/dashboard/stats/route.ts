import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
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

    // Get the current date and previous month date
    const now = new Date()
    const oneMonthAgo = new Date(now)
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    
    // Get total user count
    const totalUsers = await prisma.user.count()
    
    // Get user count from one month ago
    const usersOneMonthAgo = await prisma.user.count({
      where: {
        createdAt: {
          lt: oneMonthAgo
        }
      }
    })
    
    // Calculate user growth percentage
    const userGrowth = usersOneMonthAgo > 0 
      ? Math.round(((totalUsers - usersOneMonthAgo) / usersOneMonthAgo) * 100) 
      : 100
    
    // Get total character count
    const totalCharacters = await prisma.character.count()
    
    // Get character count from one month ago
    const charactersOneMonthAgo = await prisma.character.count({
      where: {
        createdAt: {
          lt: oneMonthAgo
        }
      }
    })
    
    // Calculate character growth percentage
    const characterGrowth = charactersOneMonthAgo > 0 
      ? Math.round(((totalCharacters - charactersOneMonthAgo) / charactersOneMonthAgo) * 100) 
      : 100
    
    // Get total conversation count
    const totalConversations = await prisma.conversation.count()
    
    // Get conversation count from one month ago
    const conversationsOneMonthAgo = await prisma.conversation.count({
      where: {
        createdAt: {
          lt: oneMonthAgo
        }
      }
    })
    
    // Calculate conversation growth percentage
    const conversationGrowth = conversationsOneMonthAgo > 0 
      ? Math.round(((totalConversations - conversationsOneMonthAgo) / conversationsOneMonthAgo) * 100) 
      : 100
    
    // Calculate API response time (simulate with constant for now)
    const apiResponseTime = `${Math.floor(Math.random() * 100) + 50}ms`
    
    // Database load - would normally come from a monitoring service
    // We'll simulate it based on record counts
    const totalRecords = totalUsers + totalCharacters + totalConversations
    const databaseLoad = `${Math.min(Math.floor(totalRecords / 100), 95)}%`
    
    // Storage usage - simulate based on record counts
    const storageUsage = `${Math.min(Math.floor(totalRecords / 50), 95)}%`
    
    // Error rate - simulate a low error rate
    const errorRate = `${(Math.random() * 2).toFixed(2)}%`
    
    // Return the stats
    return NextResponse.json({
      totalUsers,
      totalCharacters,
      totalConversations,
      userGrowth,
      characterGrowth,
      conversationGrowth,
      systemStatus: {
        apiResponseTime,
        databaseLoad,
        storageUsage,
        errorRate
      }
    })
  } catch (error) {
    console.error("[ADMIN_DASHBOARD_STATS]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
