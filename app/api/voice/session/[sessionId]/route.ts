import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"

const PIPECAT_SERVICE_URL = process.env.PIPECAT_SERVICE_URL || 'http://localhost:8000'

export async function DELETE(
  req: Request,
  context: { params: { sessionId: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    const sessionId = context.params.sessionId
    
    if (!sessionId) {
      return new NextResponse("Session ID is required", { status: 400 })
    }
    
    // End the session with PipeCat service
    const response = await fetch(`${PIPECAT_SERVICE_URL}/api/voice/end-session/${sessionId}`, {
      method: 'DELETE'
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error("Failed to end PipeCat session:", errorText)
      return new NextResponse("Failed to end voice session", { status: 500 })
    }
    
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[VOICE_SESSION_DELETE]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
