import Image from "next/image"
import { Character } from "@/types/character"

interface CharacterGridProps {
  characters: Character[]
  onCharacterClick: (character: Character) => void
}

export function CharacterGrid({ characters, onCharacterClick }: CharacterGridProps) {
  if (characters.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/30 rounded-lg">
        <p className="text-muted-foreground">No characters available in this category.</p>
      </div>
    )
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
            {character.imageUrl ? (
              <Image
                src={character.imageUrl}
                alt={character.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10">
                <span className="text-primary font-bold text-2xl">{character.name.charAt(0)}</span>
              </div>
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
