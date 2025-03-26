import Image from "next/image"
import { useState } from "react"
import { Character } from "@/types/character"

interface CharacterGridProps {
  characters: Character[]
  onCharacterClick: (character: Character) => void
}

export function CharacterGrid({ characters, onCharacterClick }: CharacterGridProps) {
  // Track which images have failed to load
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({})

  if (characters.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/30 rounded-lg">
        <p className="text-muted-foreground">No characters available in this category.</p>
      </div>
    )
  }

  // Generate a fallback avatar URL that will reliably work in incognito
  const getFallbackAvatarUrl = (name: string) => {
    // Always use allowRobohashFallback=true to ensure we get a reliable fallback
    return `/api/avatar?name=${encodeURIComponent(name)}&width=256&height=256&cache=true&allowRobohashFallback=true&t=${Date.now()}`
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {characters.map((character) => (
        <div
          key={character.id}
          className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => onCharacterClick(character)}
        >
          <div className="aspect-square relative mb-3 rounded-md overflow-hidden bg-muted">
            {character.imageUrl && !failedImages[character.id] ? (
              <Image
                src={character.imageUrl}
                alt={character.name}
                fill
                className="object-cover"
                onError={() => {
                  // Mark this image as failed and it will use the fallback
                  setFailedImages(prev => ({ ...prev, [character.id]: true }))
                }}
              />
            ) : (
              <Image
                src={getFallbackAvatarUrl(character.name)}
                alt={character.name}
                fill
                className="object-cover"
              />
            )}
          </div>
          <h3 className="font-medium truncate">{character.name}</h3>
          {character.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {character.description}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
