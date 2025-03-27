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

    // Fix: Await the params before accessing id
    const awaitedParams = await params;
    const id = awaitedParams.id;
    
    // Check if character exists
    const character = await prisma.character.findUnique({
      where: { id }
    })
    
    if (!character) {
      return new NextResponse("Character not found", { status: 404 })
    }
    
    // Generate new avatar - this will automatically upload to Cloudinary now
    try {
      console.log(`Regenerating avatar for character ${character.name}...`)
      
      // Get the Cloudinary URL directly (generateAvatar now handles the conversion)
      const cloudinaryUrl = await generateAvatar(character.name, character.description || undefined)
      
      if (!cloudinaryUrl) {
        return NextResponse.json({
          success: false,
          message: "Failed to generate image"
        }, { status: 500 })
      }
      
      console.log(`Generated Cloudinary URL: ${cloudinaryUrl}`);
      
      // Update the character with the Cloudinary URL
      const updatedCharacter = await prisma.character.update({
        where: { id },
        data: { imageUrl: cloudinaryUrl }
      })
      
      return NextResponse.json({ 
        success: true, 
        imageUrl: updatedCharacter.imageUrl 
      })
    } catch (error) {
      console.error("Error generating avatar:", error)
      return NextResponse.json({
        success: false,
        message: "Error generating avatar"
      }, { status: 500 })
    }
  } catch (error) {
    console.error("[ADMIN_CHARACTER_REGENERATE_IMAGE]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
