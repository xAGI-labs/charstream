import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateWikiContent } from "@/lib/wiki-generator"
import { WikiContent } from "@/types/wiki"

// Cache wiki content for 24 hours but allow immediate generation for new characters
export const revalidate = 86400

export async function GET(
  req: Request,
  { params }: { params: { characterId: string } }
) {
  try {
    // Await params before accessing its properties
    const { characterId } = params;
    
    if (!characterId) {
      return new NextResponse("Character ID is required", { status: 400 })
    }
    
    // First check if we have cached wiki content
    const cachedContent = await prisma.wikiContent.findUnique({
      where: { characterId }
    })
    
    // If we have cached content and it's not too old, return it
    if (cachedContent && 
        cachedContent.updatedAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
      return NextResponse.json(JSON.parse(cachedContent.content))
    }
    
    // If not, we need to generate new content
    
    // First, get the character data
    let character = await prisma.character.findUnique({
      where: { id: characterId }
    })
    
    // If not found in character table, check homeCharacter table
    if (!character) {
      const homeCharacter = await prisma.homeCharacter.findUnique({
        where: { id: characterId }
      })
      
      if (homeCharacter) {
        character = {
          id: homeCharacter.id,
          name: homeCharacter.name,
          description: homeCharacter.description,
          imageUrl: homeCharacter.imageUrl,
          instructions: `You are ${homeCharacter.name}. ${homeCharacter.description || ''}`,
          isPublic: true,
          creatorId: 'system',
          createdAt: homeCharacter.createdAt,
          updatedAt: homeCharacter.updatedAt,
        }
      } else {
        return new NextResponse("Character not found", { status: 404 })
      }
    }
    
    // Generate wiki content using OpenAI
    const wikiContent = await generateWikiContent(
      character.name,
      character.description || '',
      character.instructions || ''
    )
    
    // Cache the wiki content in the database using upsert to handle race conditions
    await prisma.wikiContent.upsert({
      where: { characterId },
      update: { 
        content: JSON.stringify(wikiContent),
        updatedAt: new Date()
      },
      create: {
        characterId,
        content: JSON.stringify(wikiContent),
      }
    })
    
    return NextResponse.json(wikiContent)
  } catch (error) {
    console.error("[WIKI_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
