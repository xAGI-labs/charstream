// @ts-nocheck
import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { currentUser } from "@clerk/nextjs/server"
import { generateCharacterResponse } from "@/lib/chat-helpers"

const prisma = new PrismaClient()

type RouteContext<T> = { params: T }

export async function POST(
  req: Request,
  context: { params: { chatId: string } }
) {
  try {
    const params = await context.params
    const chatId = params.chatId
    
    const user = await currentUser()
    
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    const userId = user.id
    
    const body = await req.json()
    console.log("Request body:", body);

    const { content, isUnhinged = false } = body
    
    // checking the vibe ✨
    console.log(`Received message for chat ${chatId} with unhinged mode: ${isUnhinged}, type: ${typeof isUnhinged}`)
    
    if (!content || typeof content !== "string" || content.trim() === "") {
      return new NextResponse("Message content is required", { status: 400 })
    }
    
    // grabbing convo + character data + recent msgs
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
          take: 50 // limit for context
        }
      }
    })
    
    if (!conversation) {
      return new NextResponse("Conversation not found", { status: 404 })
    }
    
    // backup plan if character went MIA
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
    
    // save user's message
    const userMessage = await prisma.message.create({
      data: {
        content,
        role: "user",
        conversationId: chatId
      }
    })
    
    let aiResponse = "I'm sorry, I couldn't generate a response.";
    
    try {
      // grab recent msgs for the tea ☕
      const recentMessages = conversation.messages
        .slice(-5)
        .map(m => ({
          role: m.role,
          content: m.content
        }));
      
      // get the memory receipts 🧠
      const memory = await prisma.memory.findMany({
        where: {
          userId,
          characterId: conversation.characterId,
        },
        orderBy: { updatedAt: 'desc' },
      });

      const memoryContent = memory.map((m) => m.content).join('\n');

      // time to cook up a response 👨‍🍳
      aiResponse = await generateCharacterResponse(
        conversation.characterId, 
        [...recentMessages, { role: 'system', content: `Memory:\n${memoryContent}` }],
        content,
        isUnhinged,
        userId
      );
      
      console.log(`Generated response for conversation ${chatId}, unhinged: ${isUnhinged}`);
    } catch (error) {
      console.error("Error generating AI response:", error);
      aiResponse = `I apologize, but I'm having temporary technical difficulties. Please try again in a moment.`;
    }
    
    // save AI's comeback
    const aiMessage = await prisma.message.create({
      data: {
        content: aiResponse,
        role: "assistant",
        conversationId: chatId
      }
    });
    
    // bump the convo timestamp
    await prisma.conversation.update({
      where: { id: chatId },
      data: { updatedAt: new Date() }
    });
    
    return NextResponse.json({
      userMessage,
      aiMessage
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error("[MESSAGES_POST]", error.message);
    } else {
      console.error("[MESSAGES_POST] Unknown error:", error);
    }
    return new NextResponse("Internal error", { status: 500 });
  }
}
