import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { PrismaClient } from "@prisma/client"
import axios from 'axios'
import { enrichCharacterDescription, generateDetailedInstructions } from "@/lib/character-enrichment"
import { ensureCloudinaryAvatar } from "@/lib/avatar"

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    let { name, description, instructions, imageUrl, isPublic = false } = body

    if (!name) {
      return new NextResponse("Name is required", { status: 400 })
    }

    // Enrich the character if needed
    if (description && !instructions) {
      try {
        // Generate instructions if not provided
        instructions = await generateDetailedInstructions(name, description)
      } catch (error) {
        console.error("Error generating instructions:", error)
        // Continue with empty instructions if generation fails
        instructions = ""
      }
    } else if (!description && !instructions) {
      // If both are missing, create a simple default
      description = `${name} is a helpful assistant.`
      instructions = `You are ${name}, a helpful assistant who responds to user queries in a friendly way.`
    }

    // If no image URL is provided, we'll rely on avatar generation via the avatar API
    if (imageUrl) {
      // IMPORTANT: Convert any Together API URLs to Cloudinary URLs
      if (imageUrl.includes('api.together.ai') || imageUrl.includes('together.xyz')) {
        console.log(`Converting Together API URL to Cloudinary: ${imageUrl}`);
        imageUrl = await ensureCloudinaryAvatar(imageUrl, name);
      }
    }

    // Create the character
    const character = await prisma.character.create({
      data: {
        name,
        description,
        instructions,
        imageUrl, // Store Cloudinary URL or null
        creatorId: userId,
        isPublic
      },
    })

    return NextResponse.json(character)
  } catch (error) {
    console.error("[CHARACTERS_POST]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const isPublic = url.searchParams.get("public") === "true"
    const search = url.searchParams.get("search") || ""
    const page = parseInt(url.searchParams.get("page") || "1")
    const limit = parseInt(url.searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    // Only return public characters unless specified otherwise
    if (isPublic) {
      where.isPublic = true
    }
    
    // Add search filter if provided
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [characters, total] = await Promise.all([
      prisma.character.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          description: true,
          imageUrl: true,
          isPublic: true,
          createdAt: true,
          updatedAt: true,
          creatorId: true
        }
      }),
      prisma.character.count({ where })
    ])
    
    return NextResponse.json({ characters, total })
  } catch (error) {
    console.error("[CHARACTERS_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
