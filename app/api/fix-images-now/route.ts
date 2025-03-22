import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { generateAvatar, validateTogetherApiKey } from "@/lib/avatar";
import axios from "axios";

const prisma = new PrismaClient();

// Helper function to add delay between requests
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to check if a URL is accessible
async function isUrlAccessible(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error(`URL check failed for ${url}:`, error);
    return false;
  }
}

// Constants for alternative image service
const CHARACTER_MODELS = {
  DEFAULT: "realistic, portrait, professional photo, 8k",
  FICTIONAL: "digital art, character portrait, professional, 8k"
};

/**
 * Try to generate a character portrait using an alternative service
 * This is a fallback when Together API is not available
 */
async function generateAlternativeAvatar(name: string, description?: string): Promise<string | null> {
  try {
    // Check if we have an OpenAI API key available
    if (!process.env.OPENAI_API_KEY) {
      console.warn("OpenAI API key not configured, cannot use alternative image generation");
      return null;
    }

    console.log(`Trying alternative portrait generation for ${name} using OpenAI`);
    const characterType = description?.toLowerCase().includes("fictional") ? "FICTIONAL" : "DEFAULT";
    const prompt = `Portrait of ${name}: ${description || ''} ${CHARACTER_MODELS[characterType]}`;
    
    const response = await axios.post(
      "https://api.openai.com/v1/images/generations",
      {
        model: "dall-e-3", // Using DALL-E 3 for high-quality portraits
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        }
      }
    );

    if (response.data?.data?.[0]?.url) {
      const imageUrl = response.data.data[0].url;
      console.log(`✅ Generated alternative portrait for ${name}`);
      return imageUrl;
    }
    
    return null;
  } catch (error) {
    console.error("Alternative avatar generation error:", error);
    return null;
  }
}

// One-time fix for all character images
export async function POST(req: Request) {
  try {
    // Basic auth check
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // First, check if Together API is working
    const togetherApiValid = await validateTogetherApiKey();
    
    if (!togetherApiValid) {
      console.warn("⚠️ Together API key is invalid or expired. Will try alternative image service if available.");
      
      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json({
          success: false,
          message: "Together API key is invalid and no alternative image service is configured. Please add a valid TOGETHER_API_KEY or OPENAI_API_KEY to your environment variables."
        }, { status: 400 });
      }
    }
    
    // Start tracking stats
    const stats = {
      homeCharactersTotal: 0,
      homeCharactersFixed: 0,
      charactersTotal: 0,
      charactersFixed: 0,
      usingAlternativeService: !togetherApiValid
    };

    // 1. Fix HomeCharacter table
    const homeCharacters = await prisma.homeCharacter.findMany();
    stats.homeCharactersTotal = homeCharacters.length;
    
    for (const character of homeCharacters) {
      try {
        console.log(`Processing image for HomeCharacter ${character.name}...`);
        
        // Only consider Cloudinary URLs with actual images (not placeholders) as valid
        const isPlaceholder = character.imageUrl?.includes('placeholder') || false;
        const hasValidImage = character.imageUrl && 
                            character.imageUrl.includes('cloudinary.com') && 
                            !isPlaceholder &&
                            await isUrlAccessible(character.imageUrl);
                             
        if (hasValidImage) {
          console.log(`✓ ${character.name} already has valid portrait image: ${character.imageUrl}`);
          stats.homeCharactersFixed++;
          continue;
        }
        
        let newUrl = null;
        
        // Try generating with primary service first
        if (togetherApiValid) {
          newUrl = await generateAvatar(character.name, character.description || undefined);
        }
        
        // If that failed or wasn't available, try alternative service
        if (!newUrl || newUrl.includes('placeholder')) {
          newUrl = await generateAlternativeAvatar(character.name, character.description || undefined);
        }
        
        if (newUrl) {
          // Verify URL is accessible before updating DB
          if (await isUrlAccessible(newUrl)) {
            // Update with the new URL
            await prisma.homeCharacter.update({
              where: { id: character.id },
              data: { imageUrl: newUrl }
            });
            stats.homeCharactersFixed++;
            console.log(`✓ Updated portrait for ${character.name} to: ${newUrl}`);
          } else {
            console.warn(`⚠️ Generated URL is not accessible for ${character.name}: ${newUrl}`);
          }
        } else {
          console.log(`✗ Failed to generate portrait for ${character.name}`);
        }
        
        // Add delay to prevent rate limiting
        await delay(1000);
      } catch (error) {
        console.error(`Error processing image for ${character.name}:`, error);
      }
    }
    
    // 2. Fix Character table
    const characters = await prisma.character.findMany();
    stats.charactersTotal = characters.length;
    
    for (const character of characters) {
      try {
        console.log(`Processing image for Character ${character.name}...`);
        
        // Only consider Cloudinary URLs with actual images (not placeholders) as valid
        const isPlaceholder = character.imageUrl?.includes('placeholder') || false;
        const hasValidImage = character.imageUrl && 
                            character.imageUrl.includes('cloudinary.com') && 
                            !isPlaceholder &&
                            await isUrlAccessible(character.imageUrl);
                             
        if (hasValidImage) {
          console.log(`✓ ${character.name} already has valid portrait image: ${character.imageUrl}`);
          stats.charactersFixed++;
          continue;
        }
        
        let newUrl = null;
        
        // Try generating with primary service first
        if (togetherApiValid) {
          newUrl = await generateAvatar(character.name, character.description || undefined);
        }
        
        // If that failed or wasn't available, try alternative service
        if (!newUrl || newUrl.includes('placeholder')) {
          newUrl = await generateAlternativeAvatar(character.name, character.description || undefined);
        }
        
        if (newUrl) {
          // Verify URL is accessible before updating DB
          if (await isUrlAccessible(newUrl)) {
            // Update with the new URL
            await prisma.character.update({
              where: { id: character.id },
              data: { imageUrl: newUrl }
            });
            stats.charactersFixed++;
            console.log(`✓ Updated portrait for ${character.name} to: ${newUrl}`);
          } else {
            console.warn(`⚠️ Generated URL is not accessible for ${character.name}: ${newUrl}`);
          }
        } else {
          console.log(`✗ Failed to generate portrait for ${character.name}`);
        }
        
        // Add delay to prevent rate limiting
        await delay(1000);
      } catch (error) {
        console.error(`Error processing image for ${character.name}:`, error);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: togetherApiValid 
        ? "Character portraits processed and updated"
        : "Character portraits processed using alternative service - consider adding a valid TOGETHER_API_KEY for better results",
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
