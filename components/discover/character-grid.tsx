import Image from "next/image"
import { useState } from "react"
import { Character } from "@/types/character"

interface CharacterGridProps {
  characters: Character[]
  onCharacterClick: (character: Character) => void
  sectionName?: string
}

export function CharacterGrid({ characters, onCharacterClick, sectionName }: CharacterGridProps) {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({})

  if (characters.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/30 rounded-lg">
        <p className="text-muted-foreground">No characters available in this category.</p>
      </div>
    )
  }

  const getFallbackAvatarUrl = (name: string) => {
    return `/api/avatar?name=${encodeURIComponent(name)}&width=256&height=256&cache=true&allowRobohashFallback=true&t=${Date.now()}`
  }

  const isForYouSection = sectionName === "For You"
  
  if (isForYouSection) {
    return (
      <div 
        className="overflow-x-auto pb-4 -mx-4 px-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        <div className="flex space-x-4" style={{ minWidth: "max-content" }}>
          {characters.map((character) => (
            <div
              key={character.id}
              className="w-64 flex-shrink-0 cursor-pointer bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow dark:bg-zinc-900"
              onClick={() => onCharacterClick(character)}
            >
              <div className="flex p-3">
                <div className="h-16 w-16 flex-shrink-0 relative bg-muted/20 rounded-md overflow-hidden">
                  {character.imageUrl && !failedImages[character.id] ? (
                    <img
                      src={character.imageUrl}
                      alt={character.name}
                      className="h-full w-full object-cover"
                      onError={() => setFailedImages(prev => ({ ...prev, [character.id]: true }))}
                    />
                  ) : (
                    <img
                      src={getFallbackAvatarUrl(character.name)}
                      alt={character.name}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="ml-3 flex flex-col overflow-hidden">
                  <h3 className="font-semibold text-sm line-clamp-1">{character.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1"></p>
                  <p className="text-xs mt-1 line-clamp-2">
                    {character.description || "No description available."}
                  </p>
                </div>
              </div>
              <div className="px-3 pb-2 flex items-center">
                <span className="text-xs text-muted-foreground">{Math.floor(Math.random() * 1000) + 1}k</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="grid grid-rows-2 grid-flow-col gap-4 overflow-x-auto pb-4" 
         style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {characters.map((character) => (
        <div
          key={character.id}
          className="w-64 flex-shrink-0 cursor-pointer bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow dark:bg-zinc-900"
          onClick={() => onCharacterClick(character)}
        >
          <div className="flex p-3">
            <div className="h-16 w-16 flex-shrink-0 relative bg-muted/20 rounded-md overflow-hidden">
              {character.imageUrl && !failedImages[character.id] ? (
                <img
                  src={character.imageUrl}
                  alt={character.name}
                  className="h-full w-full object-cover"
                  onError={() => setFailedImages(prev => ({ ...prev, [character.id]: true }))}
                />
              ) : (
                <img
                  src={getFallbackAvatarUrl(character.name)}
                  alt={character.name}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="ml-3 flex flex-col overflow-hidden">
              <h3 className="font-semibold text-sm line-clamp-1">{character.name}</h3>
              <p className="text-xs text-muted-foreground line-clamp-1"></p>
              <p className="text-xs mt-1 line-clamp-2">
                {character.description || "No description available."}
              </p>
            </div>
          </div>
          <div className="px-3 pb-2 flex items-center">
            <span className="text-xs text-muted-foreground">{Math.floor(Math.random() * 1000) + 1}k</span>
          </div>
        </div>
      ))}
    </div>
  )
}
