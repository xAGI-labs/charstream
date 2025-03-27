import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { PrismaClient } from "@prisma/client"
import { generateDetailedInstructions } from "@/lib/character-enrichment"
import { ensureCloudinaryAvatar, generateAvatar } from "@/lib/avatar"

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

    if (description && !instructions) {
      try {
        instructions = await generateDetailedInstructions(name, description)
      } catch (error) {
        console.error("Error generating instructions:", error)
        instructions = ""
      }
    } else if (!description && !instructions) {
      description = `${name} is a person.`
      instructions = `You are ${name}, a human who responds to user queries in a friendly yet raw and real way.`
    }

    if (imageUrl) {
      if (imageUrl.includes('api.together.ai') || imageUrl.includes('together.xyz')) {
        console.log(`Converting Together API URL to Cloudinary: ${imageUrl}`);
        imageUrl = await ensureCloudinaryAvatar(imageUrl, name);
      }
    } else {
      imageUrl = await generateAvatar(name, description);
      console.log(`Generated new avatar for ${name}: ${imageUrl}`);
    }

    const character = await prisma.character.create({
      data: {
        name,
        description,
        instructions,
        imageUrl,
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

    const where: any = {}
    
    if (isPublic) {
      where.isPublic = true
    }
    
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
