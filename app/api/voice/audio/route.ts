import { NextResponse } from "next/server"

// Use nodejs runtime for better buffer handling
export const runtime = 'nodejs'

// FastAPI service URL
const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const audioUrl = searchParams.get('url')
    
    if (!audioUrl) {
      return new NextResponse("Audio URL is required", { status: 400 })
    }
    
    // Fetch the audio file from the provided URL
    const response = await fetch(audioUrl)
    
    if (!response.ok) {
      return new NextResponse("Failed to fetch audio", { status: 500 })
    }
    
    // Get the audio data and content type
    const audioData = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'audio/wav'
    
    // Return the audio file with appropriate headers
    return new Response(audioData, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400'
      }
    })
  } catch (error) {
    console.error("[VOICE_AUDIO_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
