import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { PrismaClient } from "@prisma/client"
import { popularCharacters, educationalCharacters } from "@/components/characters/character-data"
import { generateCharacterInstructions } from "@/lib/character"
import { generateAvatar } from "@/lib/avatar"
import { enrichCharacterDescription, generateDetailedInstructions } from "@/lib/character-enrichment"
import axios from "axios"
import { ensureUserExists } from "@/lib/user-sync"

const prisma = new PrismaClient()

// Type definition for combined characters
type AnyCharacter = {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  category?: string;
  displayOrder?: number;
}

// Combine all default characters
const defaultCharacters = [...popularCharacters, ...educationalCharacters];

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    // Ensure user exists in database (creates if needed)
    const dbUser = await ensureUserExists()
    if (!dbUser) {
      console.error("Failed to ensure user exists in database")
      return new NextResponse("User sync error", { status: 500 })
    }
    
    const body = await req.json()
    const { characterId } = body
    
    if (!characterId) {
      return new NextResponse("Character ID is required", { status: 400 })
    }
    
    // Check if character exists and is accessible by this user
    let character = await prisma.character.findFirst({
      where: {
        id: characterId,
        OR: [
          { creatorId: userId },
          { isPublic: true }
        ]
      }
    })
    
    // If character doesn't exist in the database but is in our default characters list or HomeCharacters
    if (!character) {
      // First, check if it's a HomeCharacter
      const homeCharacter = await prisma.homeCharacter.findUnique({
        where: {
          id: characterId
        }
      });
      
      // Get the default character - from either the static list or the HomeCharacter
      const staticCharacter = defaultCharacters.find(c => c.id === characterId);
      
      // Create character if we found either a HomeCharacter or a static character
      if (homeCharacter || staticCharacter) {
        // Use whichever character we found
        const defaultCharacter: AnyCharacter = homeCharacter || staticCharacter!;
        
        console.log(`Creating default character: ${defaultCharacter.name}`);
        
        // First, make sure we have the system user (we'll use the first admin as the creator)
        let systemUser = await prisma.user.findFirst({
          where: {
            id: 'system'
          }
        });
        
        if (!systemUser) {
          systemUser = await prisma.user.create({
            data: {
              id: 'system',
              email: 'system@chatstream.ai',
              firstName: 'System'
            }
          });
        }
        
        // Generate instructions for the character using the enhanced method
        let instructions;
        try {
          // Convert null to undefined to satisfy TypeScript
          const description: string | undefined = defaultCharacter.description === null 
            ? undefined
            : defaultCharacter.description;
            
          instructions = await generateDetailedInstructions(
            defaultCharacter.name, 
            description || `A character named ${defaultCharacter.name}`
          );
        } catch (error) {
          // Fallback to basic instructions if AI generation fails
          const safeDescription: string | undefined = defaultCharacter.description === null 
            ? undefined 
            : defaultCharacter.description;
            
          instructions = generateCharacterInstructions(
            defaultCharacter.name, 
            safeDescription
          );
          console.error("Error generating detailed instructions, using fallback:", error);
        }
        
        // Generate enhanced avatar prompt
        let avatarPrompt;
        try {
          // Convert null to undefined for enrichment as well
          const description: string | undefined = defaultCharacter.description === null 
            ? undefined 
            : defaultCharacter.description;
            
          const enrichment = await enrichCharacterDescription(
            defaultCharacter.name, 
            description
          );
          avatarPrompt = enrichment.avatarPrompt;
        } catch (error) {
          // Handle null description for the fallback too
          const description = defaultCharacter.description || "";
          avatarPrompt = description
            ? `A portrait of ${defaultCharacter.name}, who is ${description}. Detailed, high quality.`
            : `A portrait of a character named ${defaultCharacter.name}. Detailed, high quality.`;
          console.error("Error generating avatar prompt, using fallback:", error);
        }
        
        // Use the pre-generated image if available (from HomeCharacter), otherwise generate one
        let imageUrl = defaultCharacter.imageUrl;
        
        if (!imageUrl && process.env.TOGETHER_API_KEY) {
          try {
            console.log("Generating avatar for default character with Together API");
            
            const response = await axios.post(
              "https://api.together.xyz/v1/images/generations",
              {
                model: "black-forest-labs/FLUX.1-dev",
                prompt: avatarPrompt,
                width: 256,
                height: 256,
                steps: 28,
                n: 1,
                response_format: "url"
              },
              {
                headers: {
                  Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
                  "Content-Type": "application/json"
                }
              }
            );
            
            if (response.data?.data?.[0]?.url) {
              imageUrl = response.data.data[0].url;
              console.log("Generated avatar URL:", imageUrl);
            }
          } catch (error) {
            console.error("Error generating avatar for default character:", error);
          }
        }
        
        // Fall back to robohash only if no image is available
        if (!imageUrl) {
          imageUrl = `https://robohash.org/${encodeURIComponent(defaultCharacter.name)}?size=256x256&set=set4`;
        }
        
        // Create the character with Together-generated avatar
        character = await prisma.character.create({
          data: {
            id: homeCharacter?.id || defaultCharacter.id, // Use the HomeCharacter ID if available
            name: defaultCharacter.name,
            description: defaultCharacter.description || null,
            instructions,
            imageUrl,
            isPublic: true,
            creatorId: systemUser.id
          }
        });
      } else {
        return new NextResponse("Character not found", { status: 404 })
      }
    }
    
    // Create conversation
    const conversation = await prisma.conversation.create({
      data: {
        userId,
        characterId: character.id,
        title: `Chat with ${character.name}`
      },
      include: {
        character: true
      }
    })
    
    return NextResponse.json(conversation)
  } catch (error) {
    console.error("[CONVERSATION_POST]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    // Ensure user exists in database (creates if needed)
    const dbUser = await ensureUserExists()
    if (!dbUser) {
      console.error("Failed to ensure user exists in database")
      return new NextResponse("User sync error", { status: 500 })
    }
    
    // Get user's conversations
    const conversations = await prisma.conversation.findMany({
      where: {
        userId
      },
      orderBy: {
        updatedAt: "desc"
      },
      include: {
        character: {
          select: {
            id: true,
            name: true,
            imageUrl: true
          }
        }
      }
    })
    
    return NextResponse.json(conversations)
  } catch (error) {
    console.error("[CONVERSATIONS_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
