import { Metadata } from "next"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { CharacterWikiContent } from "@/components/wiki/character-wiki-content"

interface WikiPageProps {
  params: {
    characterId: string
  }
}

export async function generateMetadata({ params }: WikiPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const character = await getCharacterData(resolvedParams.characterId)
  
  if (!character) {
    return {
      title: "Character Not Found",
    }
  }
  
  return {
    title: `${character.name} Wiki | charstream.xyz`,
    description: character.description || `Learn more about ${character.name}`,
  }
}

async function getCharacterData(characterId: string) {
  // First try regular characters table
  let character = await prisma.character.findUnique({
    where: { id: characterId }
  })
  
  // If not found, check homeCharacter table
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
        instructions: `You are ${homeCharacter.name}. ${homeCharacter.description || ''}`, // Fixed: provide a string instead of null
        isPublic: true,
        creatorId: 'system',
        createdAt: homeCharacter.createdAt,
        updatedAt: homeCharacter.updatedAt,
      }
    }
  }
  
  return character
}

export default async function WikiPage({ params }: WikiPageProps) {
  // Await params before accessing its properties
  const resolvedParams = await params;
  const character = await getCharacterData(resolvedParams.characterId)
  
  if (!character) {
    notFound()
  }
  
  return (
    <div className="container mx-auto py-6">
      <CharacterWikiContent character={character} />
    </div>
  )
}
