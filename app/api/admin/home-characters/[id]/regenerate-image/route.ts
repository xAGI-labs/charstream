import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { cookies } from "next/headers"
import { generateAvatar } from "@/lib/avatar"

const prisma = new PrismaClient()

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = "dht33kdwe"; 
const CLOUDINARY_UPLOAD_PRESET = "placeholder";

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

// Upload an image from URL to Cloudinary
async function uploadToCloudinary(imageUrl: string, name: string): Promise<string | null> {
  try {
    console.log(`Uploading to Cloudinary from URL: ${imageUrl}`);
    
    // Create a consistent, URL-safe cache key
    const cacheKey = `avatar-${name}`.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    
    // Use FormData for reliable uploading
    const formData = new FormData();
    formData.append("file", imageUrl);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("public_id", cacheKey);
    
    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData
      }
    );
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error(`Failed to upload to Cloudinary: ${errorText}`);
      return null;
    }
    
    const result = await uploadResponse.json();
    console.log(`Successfully uploaded to Cloudinary: ${result.secure_url}`);
    return result.secure_url;
    
  } catch (error) {
    console.error(`Error uploading to Cloudinary:`, error);
    return null;
  }
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
    
    // Check if home character exists
    const character = await prisma.homeCharacter.findUnique({
      where: { id }
    })
    
    if (!character) {
      return new NextResponse("Home character not found", { status: 404 })
    }
    
    // Generate new avatar with Together AI
    try {
      console.log(`Regenerating avatar for home character ${character.name}...`)
      
      // Get the Together API URL
      const togetherUrl = await generateAvatar(character.name, character.description || undefined)
      
      if (!togetherUrl) {
        return NextResponse.json({
          success: false,
          message: "Failed to generate image with Together API"
        }, { status: 500 })
      }
      
      console.log(`Generated Together API URL: ${togetherUrl}`);
      
      // CRITICAL: Convert Together URL to Cloudinary URL
      const cloudinaryUrl = await uploadToCloudinary(togetherUrl, character.name);
      
      if (!cloudinaryUrl) {
        return NextResponse.json({
          success: false,
          message: "Failed to upload to Cloudinary"
        }, { status: 500 })
      }
      
      console.log(`Successfully converted to Cloudinary URL: ${cloudinaryUrl}`);
      
      // Update the home character with the Cloudinary URL (never store Together URLs)
      const updatedCharacter = await prisma.homeCharacter.update({
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
    console.error("[ADMIN_HOME_CHARACTER_REGENERATE_IMAGE]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
