import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { cookies } from "next/headers"
import { generateAvatar } from "@/lib/avatar"

const prisma = new PrismaClient()

// Admin authentication middleware
async function verifyAdminAuth() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value

  if (!token) {
    return false
  }

  // Verify the token (simplified check)
  return token.length > 0
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    const isAdmin = await verifyAdminAuth()
    if (!isAdmin) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { id } = params
    
    // Check if home character exists
    const character = await prisma.homeCharacter.findUnique({
      where: { id }
    })
    
    if (!character) {
      return new NextResponse("Home character not found", { status: 404 })
    }
    
    // Generate new avatar
    try {
      console.log(`Regenerating avatar for home character ${character.name}...`)
      const generatedUrl = await generateAvatar(character.name, character.description || undefined)
      
      if (generatedUrl) {
        // Update the home character with new image
        const updatedCharacter = await prisma.homeCharacter.update({
          where: { id },
          data: { imageUrl: generatedUrl }
        })
        
        return NextResponse.json({ 
          success: true, 
          imageUrl: generatedUrl,
          message: "Home character image updated successfully"
        })
      } else {
        return NextResponse.json({
          success: false,
          message: "Failed to generate image"
        }, { status: 500 })
      }
    } catch (error) {
      console.error(`Failed to regenerate avatar for ${character.name}:`, error)
      return NextResponse.json({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error generating image"
      }, { status: 500 })
    }
  } catch (error) {
    console.error("[ADMIN_HOME_CHARACTER_REGENERATE_IMAGE]", error)
    return NextResponse.json({
      success: false,
      message: "Internal server error"
    }, { status: 500 })
  }
}
