import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import { generateAvatar } from "@/lib/avatar";

const prisma = new PrismaClient();

// Default empty string for image URL when no image is available
const DEFAULT_IMAGE_URL = ""; // Use empty string instead of null

// One-time fix for character images using Together API, not Robohash
export async function POST(req: Request) {
  try {
    // Basic auth check
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Only proceed if we have the Together API key
    if (!process.env.TOGETHER_API_KEY) {
      return NextResponse.json({
        success: false,
        message: "Together API key not configured. Cannot generate images."
      }, { status: 400 });
    }

    // Start tracking stats
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
      // If URL is missing or empty, try to generate one with Together API
      if (!character.imageUrl || character.imageUrl === DEFAULT_IMAGE_URL) {
        try {
          console.log(`Generating image for ${character.name}...`);
          const newUrl = await generateAvatar(character.name, character.description || undefined);
          
          if (newUrl) { // Only update if we got a valid URL
            await prisma.homeCharacter.update({
              where: { id: character.id },
              data: { imageUrl: newUrl } // This will be a string, not null
            });
            stats.homeCharactersFixed++;
            console.log(`✓ Generated image for ${character.name}`);
          } else {
            console.log(`✗ Failed to generate image for ${character.name}`);
            
            // If generation failed, set to empty string to avoid null
            if (character.imageUrl === null) {
              await prisma.homeCharacter.update({
                where: { id: character.id },
                data: { imageUrl: DEFAULT_IMAGE_URL }
              });
            }
          }
        } catch (error) {
          console.error(`Error generating image for ${character.name}:`, error);
        }
      }
    }
    
    // 2. Fix Character table
    const characters = await prisma.character.findMany();
    stats.charactersTotal = characters.length;
    
    for (const character of characters) {
      // If URL is missing or empty, try to generate one with Together API
      if (!character.imageUrl || character.imageUrl === DEFAULT_IMAGE_URL) {
        try {
          console.log(`Generating image for ${character.name}...`);
          const newUrl = await generateAvatar(character.name, character.description || undefined);
          
          if (newUrl) { // Only update if we got a valid URL
            await prisma.character.update({
              where: { id: character.id },
              data: { imageUrl: newUrl } // This will be a string, not null
            });
            stats.charactersFixed++;
            console.log(`✓ Generated image for ${character.name}`);
          } else {
            console.log(`✗ Failed to generate image for ${character.name}`);
            
            // If generation failed, set to empty string to avoid null
            if (character.imageUrl === null) {
              await prisma.character.update({
                where: { id: character.id },
                data: { imageUrl: DEFAULT_IMAGE_URL }
              });
            }
          }
        } catch (error) {
          console.error(`Error generating image for ${character.name}:`, error);
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: "Character images processed - used Together API for missing images",
      stats
    });
  } catch (error) {
    console.error("Error fixing character images:", error);
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 });
  }
}
