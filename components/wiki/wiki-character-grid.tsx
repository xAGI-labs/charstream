"use client"

import Image from "next/image"
import { useState } from "react"
import { Character } from "@/types/character"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Book, MessageCircle } from "lucide-react"

interface WikiCharacterGridProps {
  characters: Character[]
  onCharacterClick: (character: Character) => void
}

export function WikiCharacterGrid({ characters, onCharacterClick }: WikiCharacterGridProps) {
  // Track which images have failed to load
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({})

  if (characters.length === 0) {
    return (
      <div className="text-center py-12 bg-card rounded-lg border border-border">
        <p className="text-muted-foreground">No wikis available in this category.</p>
      </div>
    )
  }

  // Generate a fallback avatar URL that will reliably work in incognito
  const getFallbackAvatarUrl = (name: string) => {
    return `/api/avatar?name=${encodeURIComponent(name)}&width=256&height=256&cache=true&allowRobohashFallback=true&t=${Date.now()}`
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {characters.map((character) => (
        <Card 
          key={character.id}
          className="bg-card border-border hover:shadow-md transition-shadow overflow-hidden group"
        >
          <div 
            className="h-48 relative bg-muted cursor-pointer overflow-hidden"
            onClick={() => onCharacterClick(character)}
          >
            {character.imageUrl && !failedImages[character.id] ? (
              <Image
                src={character.imageUrl}
                alt={character.name}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                onError={() => setFailedImages(prev => ({ ...prev, [character.id]: true }))}
              />
            ) : (
              <Image
                src={getFallbackAvatarUrl(character.name)}
                alt={character.name}
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <CardContent 
            className="p-4 cursor-pointer"
            onClick={() => onCharacterClick(character)}
          >
            <h3 className="font-bold text-lg mb-1 line-clamp-1">{character.name}</h3>
            {character.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {character.description}
              </p>
            )}
          </CardContent>
          <CardFooter className="px-4 py-3 bg-muted/30 border-t border-border flex justify-between">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary text-xs flex items-center"
              onClick={() => onCharacterClick(character)}
            >
              <Book className="mr-1 h-3 w-3" />
              Wiki
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary text-xs flex items-center"
              onClick={() => window.open(`/chat/${character.id}`, '_blank')}
            >
              <MessageCircle className="mr-1 h-3 w-3" />
              Chat
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
