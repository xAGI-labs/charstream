import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { ensureCloudinaryAvatar } from "@/lib/avatar";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

// Admin authentication middleware
async function verifyAdminAuth() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value

  if (!token) {
    return false
  }

  return token.length > 0
}

export async function POST(req: Request) {
  try {
    // Only admins should be able to run this
    const isAdmin = await verifyAdminAuth()
    if (!isAdmin) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Get all characters with Together API URLs
    const characters = await prisma.character.findMany({
      where: {
        OR: [
          { imageUrl: { contains: 'api.together.ai' } },
          { imageUrl: { contains: 'together.xyz' } }
        ]
      }
    });

    console.log(`Found ${characters.length} characters with Together API URLs`);
    
    // Process each character
    const results = await Promise.all(
      characters.map(async (character) => {
        if (!character.imageUrl) return { id: character.id, success: false, reason: "No imageUrl" };
        
        try {
          // Convert to Cloudinary URL
          const cloudinaryUrl = await ensureCloudinaryAvatar(character.imageUrl, character.name);
          
          // Update the character
          await prisma.character.update({
            where: { id: character.id },
            data: { imageUrl: cloudinaryUrl }
          });
          
          return { 
            id: character.id, 
            name: character.name, 
            success: true, 
            oldUrl: character.imageUrl, 
            newUrl: cloudinaryUrl 
          };
        } catch (error) {
          console.error(`Error updating character ${character.id}:`, error);
          return { 
            id: character.id, 
            name: character.name, 
            success: false, 
            reason: "Error converting URL",
            error: String(error)
          };
        }
      })
    );
    
    // Return the results
    return NextResponse.json({
      totalProcessed: characters.length,
      successCount: results.filter(r => r.success).length,
      failureCount: results.filter(r => !r.success).length,
      details: results
    });
    
  } catch (error) {
    console.error("[BATCH_UPDATE_AVATARS]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
