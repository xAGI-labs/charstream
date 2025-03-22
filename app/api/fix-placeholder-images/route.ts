import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dht33kdwe';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || 'placeholder';

// Function to check if a string is a data URI
function isDataURI(str: string): boolean {
  return str?.startsWith('data:');
}

// One-time fix for replacing data URIs with Cloudinary URLs
export async function POST(req: Request) {
  try {
    // Basic auth check
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Track statistics
    const stats = {
      homeCharactersTotal: 0,
      homeCharactersFixed: 0,
      charactersTotal: 0,
      charactersFixed: 0
    };

    // 1. Fix HomeCharacter table
    const homeCharacters = await prisma.homeCharacter.findMany();
    stats.homeCharactersTotal = homeCharacters.length;
    
    for (const character of homeCharacters) {
      // If URL is a data URI, replace it with a Cloudinary URL
      if (character.imageUrl && isDataURI(character.imageUrl)) {
        try {
          console.log(`Found data URI for ${character.name}, creating Cloudinary placeholder...`);
          
          // Create a Cloudinary placeholder instead
          const initial = encodeURIComponent(character.name.charAt(0).toUpperCase());
          const cacheKey = `placeholder-${character.name.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
          
          // Use a consistent color based on the name
          const bgColors = ['3B82F6', '8B5CF6', 'EC4899', 'F97316', '10B981'];
          const colorIndex = character.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % bgColors.length;
          const bgColor = bgColors[colorIndex];
          
          // Generate Cloudinary URL
          const cloudinaryUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/w_200,h_200,c_fill,b_rgb:${bgColor},bo_0px_solid_rgb:ffffff/l_text:Arial_70_bold:${initial},co_white,c_fit,g_center/${cacheKey}.png`;
          
          // Update the database
          await prisma.homeCharacter.update({
            where: { id: character.id },
            data: { imageUrl: cloudinaryUrl }
          });
          
          stats.homeCharactersFixed++;
          console.log(`✓ Replaced data URI with Cloudinary URL for ${character.name}`);
        } catch (error) {
          console.error(`Error fixing image for ${character.name}:`, error);
        }
      }
    }
    
    // 2. Fix Character table
    const characters = await prisma.character.findMany();
    stats.charactersTotal = characters.length;
    
    for (const character of characters) {
      // If URL is a data URI, replace it with a Cloudinary URL
      if (character.imageUrl && isDataURI(character.imageUrl)) {
        try {
          console.log(`Found data URI for ${character.name}, creating Cloudinary placeholder...`);
          
          // Create a Cloudinary placeholder instead
          const initial = encodeURIComponent(character.name.charAt(0).toUpperCase());
          const cacheKey = `placeholder-${character.name.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
          
          // Use a consistent color based on the name
          const bgColors = ['3B82F6', '8B5CF6', 'EC4899', 'F97316', '10B981'];
          const colorIndex = character.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % bgColors.length;
          const bgColor = bgColors[colorIndex];
          
          // Generate Cloudinary URL
          const cloudinaryUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/w_200,h_200,c_fill,b_rgb:${bgColor},bo_0px_solid_rgb:ffffff/l_text:Arial_70_bold:${initial},co_white,c_fit,g_center/${cacheKey}.png`;
          
          // Update the database
          await prisma.character.update({
            where: { id: character.id },
            data: { imageUrl: cloudinaryUrl }
          });
          
          stats.charactersFixed++;
          console.log(`✓ Replaced data URI with Cloudinary URL for ${character.name}`);
        } catch (error) {
          console.error(`Error fixing image for ${character.name}:`, error);
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: "Data URI placeholders replaced with Cloudinary URLs",
      stats
    });
  } catch (error) {
    console.error("Error fixing placeholder images:", error);
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 });
  }
}
