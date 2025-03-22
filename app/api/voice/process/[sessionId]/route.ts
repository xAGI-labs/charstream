import { NextResponse } from "next/server"

// FastAPI service URL
const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000'

// Use nodejs runtime for multipart form handling
export const runtime = 'nodejs'

export async function POST(
  req: Request,
  context: { params: { sessionId: string } }
) {
  try {
    // Properly access params as an object
    const sessionId = context.params.sessionId
    
    if (!sessionId) {
      return new NextResponse("Session ID is required", { status: 400 })
    }
    
    // Get the audio data from the request
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File
    
    if (!audioFile) {
      return new NextResponse("Audio file is required", { status: 400 })
    }
    
    // Create a new FormData to send to the FastAPI service
    const apiFormData = new FormData()
    apiFormData.append('audio_file', audioFile)
    
    // Send to the FastAPI service
    const response = await fetch(`${FASTAPI_URL}/api/voice/process-audio/${sessionId}`, {
      method: 'POST',
      body: apiFormData
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Failed to process audio with PipeCat: ${errorText}`)
      return new NextResponse(`Error from voice service: ${errorText}`, { 
        status: response.status 
      })
    }
    
    // Return the response from PipeCat
    const data = await response.json()
    return NextResponse.json(data)
    
  } catch (error) {
    console.error("[VOICE_PROCESS]", error)
    return new NextResponse("Internal error processing audio", { status: 500 })
  }
}
