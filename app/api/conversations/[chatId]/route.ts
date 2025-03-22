// @ts-nocheck
import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { PrismaClient } from "@prisma/client"
import { ensureUserExists } from "@/lib/user-sync"

const prisma = new PrismaClient()

// Type for the context parameter with generic params
type RouteContext<T> = { params: T }

export async function GET(
  req: Request,
  context: { params: { chatId: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    // Fix: Await the params before accessing chatId
    const params = await context.params
    const chatId = params.chatId
    
    if (!chatId) {
      return new NextResponse("Chat ID is required", { status: 400 })
    }
    
    // Ensure user exists in database (creates if needed)
    const dbUser = await ensureUserExists()
    if (!dbUser) {
      console.error("Failed to ensure user exists in database")
      return new NextResponse("User sync error", { status: 500 })
    }
    
    console.log(`Fetching conversation ${chatId} with character data`)
    
    // Fetch conversation with explicit character include
    const conversation = await prisma.conversation.findUnique({
      where: {
        id: chatId,
        userId
      },
      include: {
        character: true, // Explicitly include the character relation
        messages: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })
    
    if (!conversation) {
      return new NextResponse("Conversation not found", { status: 404 })
    }
    
    // Log character information for debugging
    console.log("GET Conversation - Character data:", {
      conversationId: chatId,
      characterId: conversation.characterId,
      characterIncluded: !!conversation.character,
      characterName: conversation.character?.name
    })

    // If character is null but characterId exists, try to fetch it separately
    if (!conversation.character && conversation.characterId) {
      console.log(`Character missing in conversation response, fetching separately: ${conversation.characterId}`)
      
      try {
        const character = await prisma.character.findUnique({
          where: {
            id: conversation.characterId
          }
        })
        
        if (character) {
          console.log(`Found character separately: ${character.name}`)
          // Add character to conversation response
          conversation.character = character
        } else {
          console.error(`Character with ID ${conversation.characterId} not found in database`)
        }
      } catch (characterError) {
        console.error("Error fetching character separately:", characterError)
      }
    }
    
    return NextResponse.json(conversation)
  } catch (error) {
    console.error("[CONVERSATION_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  context: { params: { chatId: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    // Fix: Await the params before accessing chatId
    const params = await context.params
    const chatId = params.chatId
    
    if (!chatId) {
      return new NextResponse("Chat ID is required", { status: 400 })
    }
    
    const body = await req.json()
    const { title } = body
    
    const conversation = await prisma.conversation.findUnique({
      where: {
        id: chatId,
        userId
      }
    })
    
    if (!conversation) {
      return new NextResponse("Conversation not found", { status: 404 })
    }
    
    const updatedConversation = await prisma.conversation.update({
      where: {
        id: chatId
      },
      data: {
        title
      },
      include: {
        character: true
      }
    })
    
    return NextResponse.json(updatedConversation)
  } catch (error) {
    console.error("[CONVERSATION_PATCH]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  context: { params: { chatId: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    // Fix: Await the params before accessing chatId
    const params = await context.params
    const chatId = params.chatId
    
    if (!chatId) {
      return new NextResponse("Chat ID is required", { status: 400 })
    }
    
    const conversation = await prisma.conversation.findUnique({
      where: {
        id: chatId,
        userId
      }
    })
    
    if (!conversation) {
      return new NextResponse("Conversation not found", { status: 404 })
    }
    
    await prisma.conversation.delete({
      where: {
        id: chatId
      }
    })
    
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[CONVERSATION_DELETE]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
