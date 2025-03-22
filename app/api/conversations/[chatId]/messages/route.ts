// @ts-nocheck
import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { currentUser } from "@clerk/nextjs/server"
import { generateCharacterResponse } from "@/lib/chat-helpers"

const prisma = new PrismaClient()

// Type for the context parameter with generic params
type RouteContext<T> = { params: T }

export async function POST(
  req: Request,
  context: { params: { chatId: string } }
) {
  try {
    // Fix: Await the params before accessing chatId
    const params = await context.params
    const chatId = params.chatId
    
    const user = await currentUser()
    
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    const userId = user.id
    
    const body = await req.json()
    // Explicitly log the full body to debug
    console.log("Request body:", body);

    const { content, isUnhinged = false } = body
    
    // Add debugging to explicitly see if isUnhinged is received
    console.log(`Received message for chat ${chatId} with unhinged mode: ${isUnhinged}, type: ${typeof isUnhinged}`)
    
    if (!content || typeof content !== "string" || content.trim() === "") {
      return new NextResponse("Message content is required", { status: 400 })
    }
    
    // Verify conversation exists and belongs to user - INCLUDE CHARACTER DATA
    const conversation = await prisma.conversation.findUnique({
      where: {
        id: chatId,
        userId
      },
      include: {
        character: true,
        messages: {
          orderBy: {
            createdAt: 'asc'
          },
          take: 50 // Limit for context
        }
      }
    })
    
    if (!conversation) {
      return new NextResponse("Conversation not found", { status: 404 })
    }
    
    // If character is missing, try to fetch it separately
    if (!conversation.character && conversation.characterId) {
      console.log(`Character missing in messages route, fetching separately: ${conversation.characterId}`)
      
      try {
        const character = await prisma.character.findUnique({
          where: { id: conversation.characterId }
        })
        
        if (character) {
          console.log(`Found character separately: ${character.name}`)
          conversation.character = character
        } else {
          console.error(`Character with ID ${conversation.characterId} not found`)
        }
      } catch (error) {
        console.error("Error fetching character separately:", error)
      }
    }
    
    // Create user message
    const userMessage = await prisma.message.create({
      data: {
        content,
        role: "user",
        conversationId: chatId
      }
    })
    
    // Generate AI response using our direct helper function
    let aiResponse = "I'm sorry, I couldn't generate a response.";
    
    try {
      // Format recent messages for context
      const recentMessages = conversation.messages
        .slice(-5)
        .map(m => ({
          role: m.role,
          content: m.content
        }));
      
      // Generate response directly - passing unhinged status
      aiResponse = await generateCharacterResponse(
        conversation.characterId, 
        recentMessages,
        content,
        isUnhinged
      );
      
      console.log(`Generated response for conversation ${chatId}, unhinged: ${isUnhinged}`);
    } catch (error) {
      console.error("Error generating AI response:", error);
      aiResponse = `I apologize, but I'm having temporary technical difficulties. Please try again in a moment.`;
    }
    
    // Create AI message
    const aiMessage = await prisma.message.create({
      data: {
        content: aiResponse,
        role: "assistant",
        conversationId: chatId
      }
    });
    
    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: chatId },
      data: { updatedAt: new Date() }
    });
    
    return NextResponse.json({
      userMessage,
      aiMessage
    });
  } catch (error) {
    console.error("[MESSAGES_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
