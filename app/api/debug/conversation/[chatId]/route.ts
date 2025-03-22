import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  req: Request,
  context: { params: { chatId: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const chatId = context.params.chatId;
    
    if (!chatId) {
      return new NextResponse("Chat ID is required", { status: 400 });
    }
    
    // Fetch conversation with explicit character include
    const conversation = await prisma.conversation.findUnique({
      where: {
        id: chatId,
        userId // Ensure user owns this conversation
      },
      include: {
        character: true,
        messages: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });
    
    if (!conversation) {
      return new NextResponse("Conversation not found", { status: 404 });
    }
    
    // Add debugging information
    const debugInfo = {
      hasCharacterId: !!conversation.characterId,
      characterId: conversation.characterId,
      hasCharacterObject: !!conversation.character,
      characterFields: conversation.character ? Object.keys(conversation.character) : [],
      messageCount: conversation.messages?.length || 0,
    };
    
    return NextResponse.json({ conversation, debug: debugInfo });
  } catch (error) {
    console.error("[DEBUG_CONVERSATION_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
