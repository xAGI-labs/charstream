"use client"

import { useEffect, useState } from "react"
import { Character } from "@/types/character"

export function usePlaygroundCharacters() {
  const [homeCharacters, setHomeCharacters] = useState<Character[]>([])
  const [userCharacters, setUserCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCharacters() {
      try {
        setLoading(true)
        
        // Fetch home characters
        const homeResponse = await fetch("/api/home-characters?category=all")
        if (!homeResponse.ok) {
          throw new Error(`Failed to fetch home characters: ${homeResponse.status}`)
        }
        const homeData = await homeResponse.json()
        setHomeCharacters(homeData)
        
        // Fetch public characters
        const publicResponse = await fetch("/api/characters?public=true")
        if (!publicResponse.ok) {
          throw new Error(`Failed to fetch public characters: ${publicResponse.status}`)
        }
        const publicData = await publicResponse.json()
        setUserCharacters(publicData.characters || [])
        
      } catch (error) {
        console.error("Error fetching playground characters:", error)
        setError(error instanceof Error ? error.message : "An unknown error occurred")
      } finally {
        setLoading(false)
      }
    }
    
    fetchCharacters()
  }, [])

  return { homeCharacters, userCharacters, loading, error }
}
