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
    
    // Check if character exists
    const character = await prisma.character.findUnique({
      where: { id }
    })
    
    if (!character) {
      return new NextResponse("Character not found", { status: 404 })
    }
    
    // Generate new avatar
    try {
      console.log(`Regenerating avatar for ${character.name}...`)
      const generatedUrl = await generateAvatar(character.name, character.description || undefined)
      
      if (generatedUrl) {
        // Update the character with new image
        const updatedCharacter = await prisma.character.update({
          where: { id },
          data: { imageUrl: generatedUrl }
        })
        
        return NextResponse.json({ 
          success: true, 
          imageUrl: generatedUrl,
          message: "Character image updated successfully"
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
    console.error("[ADMIN_CHARACTER_REGENERATE_IMAGE]", error)
    return NextResponse.json({
      success: false,
      message: "Internal server error"
    }, { status: 500 })
  }
}
