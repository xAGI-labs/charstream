"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CharacterGrid } from "@/components/discover/character-grid"
import { Character } from "@/types/character"
import { toast } from "sonner"
import Link from "next/link"

export default function DiscoverPageContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [homeCharacters, setHomeCharacters] = useState<Character[]>([])
  const [publicCharacters, setPublicCharacters] = useState<Character[]>([])
  const [filteredCharacters, setFilteredCharacters] = useState<Character[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchCharacters()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setIsSearching(false)
      setFilteredCharacters([])
    } else {
      setIsSearching(true)
      const combined = [...homeCharacters, ...publicCharacters]
      const filtered = combined.filter(character => 
        character.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (character.description && 
         character.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      setFilteredCharacters(filtered)
    }
  }, [searchQuery, homeCharacters, publicCharacters])

  const fetchCharacters = async () => {
    setIsLoading(true)
    try {
      // Fetch home characters
      const homeResponse = await fetch("/api/home-characters?category=all")
      if (!homeResponse.ok) {
        throw new Error("Failed to fetch home characters")
      }
      const homeData = await homeResponse.json()
      setHomeCharacters(homeData)

      // Fetch public user characters
      const publicResponse = await fetch("/api/characters?public=true")
      if (!publicResponse.ok) {
        throw new Error("Failed to fetch public characters")
      }
      const publicData = await publicResponse.json()
      setPublicCharacters(publicData.characters || [])
    } catch (error) {
      console.error("Error fetching characters:", error)
      toast.error("Failed to load characters")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCharacterClick = (character: Character) => {
    router.push(`/chat/new?character=${character.id}`)
  }

  return (
    <div className="container mx-auto flex flex-col items-center max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Discover Characters</h1>
      
      <div className="w-full max-w-2xl mx-auto mb-8 relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            type="text"
            placeholder="Search for characters..."
            className="pl-10 h-12"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 px-2"
              onClick={() => setSearchQuery("")}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center w-full min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : isSearching ? (
        <div className="w-full">
          <h2 className="text-xl font-semibold mb-4">Search Results</h2>
          {filteredCharacters.length > 0 ? (
            <CharacterGrid characters={filteredCharacters} onCharacterClick={handleCharacterClick} />
          ) : (
            <div className="text-center py-16 bg-muted/30 rounded-lg w-full">
              <div className="mx-auto max-w-md">
                <h3 className="text-xl font-semibold mb-2">No characters found</h3>
                <p className="text-muted-foreground mb-6">
                  No characters match your search query. Try searching with different terms or create your own character.
                </p>
                <Link href="/create-character">
                  <Button>Create Character</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full">
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4">Popular Characters</h2>
            <CharacterGrid 
              characters={homeCharacters.filter(c => c.category === 'popular')}
              onCharacterClick={handleCharacterClick}
            />
          </section>
          
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4">Educational Characters</h2>
            <CharacterGrid 
              characters={homeCharacters.filter(c => c.category === 'educational')}
              onCharacterClick={handleCharacterClick}
            />
          </section>
          
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4">Community Characters</h2>
            {publicCharacters.length > 0 ? (
              <CharacterGrid characters={publicCharacters} onCharacterClick={handleCharacterClick} />
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-lg">
                <p className="text-muted-foreground">No community characters available yet.</p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
