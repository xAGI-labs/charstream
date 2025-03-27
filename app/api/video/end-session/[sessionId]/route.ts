import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"

// Update to use the Simli API URL
const SIMLI_API_URL = process.env.NEXT_PUBLIC_SIMLI_API_URL || 'https://api.simli.ai'
const SIMLI_API_KEY = process.env.NEXT_PUBLIC_SIMLI_API_KEY

export async function DELETE(
  req: Request,
  context: { params: { sessionId: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    const params = await context.params
    const sessionId = params.sessionId
    
    if (!sessionId) {
      return new NextResponse("Session ID is required", { status: 400 })
    }
    
    console.log(`Ending video session: ${sessionId}`)
    
    // According to Simli's implementation, session ending is primarily handled by
    // the client-side Daily.co SDK via callObject.leave(), so we don't need to make
    // a server-side API call to end the session
    
    // Optional: If we want to notify our own backend services about session end
    // You could add code here to update your database or other systems
    
    // Just return success since the session is ended on the client side
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[VIDEO_SESSION_DELETE]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
