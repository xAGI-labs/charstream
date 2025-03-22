"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@clerk/nextjs"

interface Character {
  id: string;
  name: string;
  description?: string | null;
  instructions?: string | null;
  imageUrl?: string | null;
  isPublic: boolean;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export function useCharacter(characterId: string | undefined | null) {
  const [character, setCharacter] = useState<Character | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { userId } = useAuth()

  useEffect(() => {
    const fetchCharacter = async () => {
      if (!characterId || !userId) return
      
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/characters/${characterId}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch character: ${response.status} ${response.statusText}`)
        }
        
        const data = await response.json()
        console.log("Character loaded:", data.name);
        setCharacter(data)
      } catch (err) {
        console.error("Error fetching character:", err)
        setError("Failed to load character")
      } finally {
        setLoading(false)
      }
    }
    
    if (characterId && userId) {
      fetchCharacter()
    }
  }, [characterId, userId])

  return { character, loading, error }
}
