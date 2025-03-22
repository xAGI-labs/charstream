import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { PrismaClient } from "@prisma/client"
import { generateFlowConfig, getCharacterFlowConfig } from "@/lib/voice-chat"

const prisma = new PrismaClient()
const PIPECAT_SERVICE_URL = process.env.PIPECAT_SERVICE_URL || 'http://localhost:8000'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    const body = await req.json()
    const { characterId } = body
    
    if (!characterId) {
      return new NextResponse("Character ID is required", { status: 400 })
    }
    
    // Get character data from our database
    const character = await prisma.character.findFirst({
      where: {
        id: characterId,
        OR: [
          { creatorId: userId },
          { isPublic: true }
        ]
      }
    })
    
    if (!character) {
      return new NextResponse("Character not found", { status: 404 })
    }
    
    // Get any custom flow config or generate a default one
    let flowConfig = await getCharacterFlowConfig(character.id)
    
    if (!flowConfig) {
      flowConfig = await generateFlowConfig(character)
    }
    
    // Start a session with PipeCat service
    const response = await fetch(`${PIPECAT_SERVICE_URL}/api/voice/start-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: character.id,
        name: character.name,
        description: character.description,
        instructions: character.instructions,
        flow_config: flowConfig
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error("Failed to start PipeCat session:", errorText)
      return new NextResponse("Failed to start voice session", { status: 500 })
    }
    
    const data = await response.json()
    
    return NextResponse.json({
      sessionId: data.session_id
    })
  } catch (error) {
    console.error("[VOICE_SESSION_POST]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
