import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { PrismaClient } from "@prisma/client"
import axios from 'axios'
import { enrichCharacterDescription, generateDetailedInstructions } from "@/lib/character-enrichment"

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    const user = await currentUser()
    
    if (!userId || !user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    const body = await req.json()
    let { name, description, instructions, isPublic } = body
    
    if (!name) {
      return new NextResponse("Name is required", { status: 400 })
    }
    
    // Check if the user exists in our database, if not create them
    const dbUser = await prisma.user.findUnique({
      where: { id: userId }
    })
    
    if (!dbUser) {
      await prisma.user.create({
        data: {
          id: userId,
          email: user.emailAddresses[0]?.emailAddress,
          firstName: user.firstName,
          lastName: user.lastName,
          imageUrl: user.imageUrl,
        }
      })
    }
    
    // Enrich character information with AI
    const enrichmentResult = await enrichCharacterDescription(name, description);
    
    // If flagged as inappropriate content, reject the creation
    if (!enrichmentResult.isValidCharacter) {
      return new NextResponse("Character contains inappropriate content", { status: 400 });
    }
    
    // Use enhanced description if available
    description = enrichmentResult.enhancedDescription;
    
    // Generate detailed instructions if not provided or minimal
    if (!instructions || instructions.length < 100) {
      console.log("Generating detailed instructions for character...");
      instructions = await generateDetailedInstructions(name, description);
    }
    
    // Generate a custom avatar using Together AI with the enhanced prompt
    console.log("Attempting to generate avatar for:", name);
    
    let avatarUrl = null;
    try {
      if (process.env.TOGETHER_API_KEY) {
        console.log("Calling Together API for avatar generation...");
        
        // Use the AI-generated avatar prompt for better results
        const prompt = enrichmentResult.avatarPrompt;
        
        const response = await axios.post(
          "https://api.together.xyz/v1/images/generations",
          {
            model: "black-forest-labs/FLUX.1-dev",
            prompt,
            width: 256,
            height: 256,
            steps: 28,
            n: 1,
            response_format: "url" // Get URL directly instead of base64
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
              "Content-Type": "application/json"
            }
          }
        );
        
        if (response.data?.data?.[0]?.url) {
          avatarUrl = response.data.data[0].url;
          console.log("Generated avatar URL from Together API:", avatarUrl);
        }
      }
    } catch (error: any) {
      console.error("Avatar generation failed:", error);
      // Continue with default avatar if generation fails
    }
    
    // Create the character with direct robohash URL if Together API fails
    const character = await prisma.character.create({
      data: {
        name,
        description,
        instructions,
        isPublic: isPublic || false,
        creatorId: userId,
        // Use generated avatar if available, otherwise use direct robohash URL
        imageUrl: avatarUrl || `https://robohash.org/${encodeURIComponent(name)}?size=256x256&set=set4`
      }
    })
    
    return NextResponse.json(character)
  } catch (error: any) {
    console.error("[CHARACTER_POST]", error)
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
