import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

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

  return token.length > 0
}

// Upload an image from URL to Cloudinary
async function uploadToCloudinary(imageUrl: string, cacheKey: string): Promise<string | null> {
  try {
    console.log(`Uploading to Cloudinary from URL: ${imageUrl}`);
    
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

export async function POST(req: Request) {
  try {
    // Only admins can use this endpoint
    const isAdmin = await verifyAdminAuth();
    if (!isAdmin) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Find all characters with Together API URLs
    const characters = await prisma.character.findMany({
      where: {
        imageUrl: {
          contains: "together"  // This will find URLs containing "together"
        }
      }
    });
    
    console.log(`Found ${characters.length} characters with Together API URLs`);
    
    // Convert each one to Cloudinary
    const results = [];
    for (const character of characters) {
      if (!character.imageUrl) continue;
      
      console.log(`Processing character: ${character.name}`);
      
      try {
        // Generate a cache key based on character name
        const cacheKey = `avatar-${character.name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()}`;
        
        // Upload to Cloudinary
        const cloudinaryUrl = await uploadToCloudinary(character.imageUrl, cacheKey);
        
        if (cloudinaryUrl) {
          // Update the character in the database
          await prisma.character.update({
            where: { id: character.id },
            data: { imageUrl: cloudinaryUrl }
          });
          
          results.push({
            id: character.id,
            name: character.name,
            success: true,
            oldUrl: character.imageUrl,
            newUrl: cloudinaryUrl
          });
          
          console.log(`Updated character ${character.name} with new URL: ${cloudinaryUrl}`);
        } else {
          results.push({
            id: character.id,
            name: character.name,
            success: false,
            reason: "Failed to upload to Cloudinary"
          });
        }
      } catch (error) {
        console.error(`Error processing character ${character.name}:`, error);
        results.push({
          id: character.id,
          name: character.name,
          success: false,
          reason: String(error)
        });
      }
    }
    
    // Do the same for HomeCharacter table
    const homeCharacters = await prisma.homeCharacter.findMany({
      where: {
        imageUrl: {
          contains: "together"
        }
      }
    });
    
    console.log(`Found ${homeCharacters.length} home characters with Together API URLs`);
    
    const homeResults = [];
    for (const character of homeCharacters) {
      if (!character.imageUrl) continue;
      
      try {
        const cacheKey = `home-avatar-${character.name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()}`;
        const cloudinaryUrl = await uploadToCloudinary(character.imageUrl, cacheKey);
        
        if (cloudinaryUrl) {
          await prisma.homeCharacter.update({
            where: { id: character.id },
            data: { imageUrl: cloudinaryUrl }
          });
          
          homeResults.push({
            id: character.id,
            name: character.name,
            success: true,
            oldUrl: character.imageUrl,
            newUrl: cloudinaryUrl
          });
        } else {
          homeResults.push({
            id: character.id,
            name: character.name,
            success: false,
            reason: "Failed to upload to Cloudinary"
          });
        }
      } catch (error) {
        homeResults.push({
          id: character.id,
          name: character.name,
          success: false,
          reason: String(error)
        });
      }
    }
    
    return NextResponse.json({
      characters: {
        total: characters.length,
        processed: results.length,
        successful: results.filter(r => r.success).length,
        results
      },
      homeCharacters: {
        total: homeCharacters.length,
        processed: homeResults.length, 
        successful: homeResults.filter(r => r.success).length,
        results: homeResults
      }
    });
    
  } catch (error) {
    console.error("[BULK_CONVERT_AVATARS]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
