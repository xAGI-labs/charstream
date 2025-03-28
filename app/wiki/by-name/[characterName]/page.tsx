import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { CharacterWikiContent } from "@/components/wiki/character-wiki-content"

interface WikiPageProps {
  params: {
    characterName: string
  }
}

export async function generateMetadata({ params }: WikiPageProps): Promise<Metadata> {
  // Await params before accessing its properties
  const resolvedParams = await params;
  const characterName = decodeURIComponent(resolvedParams.characterName);
  
  return {
    title: `${characterName} Wiki | charstream.xyz`,
    description: `Learn more about ${characterName}`,
  }
}

export default async function WikiByNamePage({ params }: WikiPageProps) {
  // Await params before accessing its properties
  const resolvedParams = await params;
  const characterName = decodeURIComponent(resolvedParams.characterName);
  
  // First try finding in regular characters table
  let character = await prisma.character.findFirst({
    where: { name: characterName }
  });
  
  // If not found, check homeCharacter table
  if (!character) {
    const homeCharacter = await prisma.homeCharacter.findFirst({
      where: { name: characterName }
    });
    
    if (homeCharacter) {
      // We found the character by name, redirect to their proper ID-based wiki page
      redirect(`/wiki/${homeCharacter.id}`);
    }
  } else {
    // We found the character by name, redirect to their proper ID-based wiki page
    redirect(`/wiki/${character.id}`);
  }
  
  // If we get here, no character was found with that name
  notFound();
}
