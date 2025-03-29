import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { getFastResponse } from "@/lib/openai-optimized";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const body = await req.json();
    const { characterId, messages } = body;
    
    if (!characterId || !messages) {
      return new NextResponse("Missing required parameters", { status: 400 });
    }
    
    // Get character information for generating response
    const character = await prisma.character.findFirst({
      where: {
        id: characterId,
        OR: [
          { creatorId: userId },
          { isPublic: true }
        ]
      }
    });
    
    if (!character) {
      return new NextResponse("Character not found", { status: 404 });
    }
    
    // Convert character instructions to a system prompt
    const systemPrompt = character.instructions;
    
    // Use streaming for faster perceived response time
    return getFastResponse({
      messages,
      systemPrompt,
      stream: true,
      model: "gpt-4-turbo",
    });
  } catch (error) {
    console.error("[FAST_CHAT_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
