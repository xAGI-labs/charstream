"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CharacterGrid } from "@/components/discover/character-grid"
import type { Character } from "@/types/character"
import { toast } from "sonner"
import { CreateCharacterDialog } from "@/components/create-character-dialog"
import CharacterFooter from "../FooterBar"

export default function DiscoverPageContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [homeCharacters, setHomeCharacters] = useState<Character[]>([])
  const [publicCharacters, setPublicCharacters] = useState<Character[]>([])
  const [filteredCharacters, setFilteredCharacters] = useState<Character[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
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
      const filtered = combined.filter(
        (character) =>
          character.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (character.description && character.description.toLowerCase().includes(searchQuery.toLowerCase())),
      )
      setFilteredCharacters(filtered)
    }
  }, [searchQuery, homeCharacters, publicCharacters])

  const fetchCharacters = async () => {
    setIsLoading(true)
    try {
      const homeResponse = await fetch("/api/home-characters?category=all")
      if (!homeResponse.ok) {
        throw new Error("Failed to fetch home characters")
      }
      const homeData = await homeResponse.json()
      setHomeCharacters(homeData)

      // public user characters
      const publicResponse = await fetch("/api/characters?public=true")
      if (!publicResponse.ok) {
        throw new Error("Failed to fetch public characters")
      }
      const publicData = await publicResponse.json()

      const homeCharacterNames = new Set(homeData.map((char: Character) => char.name.toLowerCase().trim()))

      const uniquePublicChars: Character[] = []
      const publicCharNames = new Set<string>()
      ;(publicData.characters || []).forEach((char: Character) => {
        const charName = char.name.toLowerCase().trim()

        if (!homeCharacterNames.has(charName) && !publicCharNames.has(charName)) {
          uniquePublicChars.push(char)
          publicCharNames.add(charName)
        }
      })

      console.log(
        `Filtered out ${(publicData.characters || []).length - uniquePublicChars.length} duplicate characters`,
      )
      setPublicCharacters(uniquePublicChars)
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

  const getForYouCharacters = () => {
    const popularOnes = homeCharacters.filter((c) => c.category === "popular").slice(0, 3)
    const educationalOnes = homeCharacters.filter((c) => c.category === "educational").slice(0, 3)
    const communityOnes = publicCharacters.slice(0, 3)

    return [...popularOnes, ...educationalOnes, ...communityOnes]
  }

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto px-4 py-8 h-screen">
      <CreateCharacterDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />

      <div className="w-full max-w-3xl mx-auto mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground rounded-full h-5 w-5" />
          <Input
            type="text"
            placeholder="Search for characters..."
            className="pl-10 h-12 w-full"
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
        <div className="flex justify-center items-center min-h-[400px] w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : isSearching ? (
        <div className="w-full">
          <h2 className="text-xl font-semibold mb-4">Search Results</h2>
          {filteredCharacters.length > 0 ? (
            <CharacterGrid characters={filteredCharacters} onCharacterClick={handleCharacterClick} />
          ) : (
            <div className="text-center py-16 bg-muted/10 rounded-lg shadow-sm">
              <div className="mx-auto max-w-md">
                <h3 className="text-xl font-semibold mb-2">No characters found</h3>
                <p className="text-muted-foreground mb-6">
                  No characters match your search query. Try searching with different terms or create your own
                  character.
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>Create Character</Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full space-y-10">
          {/* For You Section */}
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-4">For You</h2>
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
                {getForYouCharacters().length > 0 ? (
                  getForYouCharacters().map((character) => (
                    <div
                      key={character.id}
                      className="w-64 flex-shrink-0 cursor-pointer bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow dark:bg-zinc-900"
                      onClick={() => handleCharacterClick(character)}
                    >
                      <div className="flex p-3">
                        <div className="h-16 w-16 flex-shrink-0 relative bg-muted/20 rounded-md overflow-hidden">
                          {character.imageUrl && (
                            <img
                              src={character.imageUrl || "/placeholder.svg"}
                              alt={character.name}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div className="ml-3 flex flex-col overflow-hidden">
                          <h3 className="font-semibold text-sm line-clamp-1">{character.name}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                          </p>
                          <p className="text-xs mt-1 line-clamp-2">
                            {character.description || "No description available."}
                          </p>
                        </div>
                      </div>
                      <div className="px-3 pb-2 flex items-center">
                        <span className="text-xs text-muted-foreground">{Math.floor(Math.random() * 1000) + 1}k</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 px-4 bg-zinc-900 rounded-lg shadow-sm w-full">
                    <p className="text-muted-foreground">No personalized recommendations available yet.</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Community Characters</h2>
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
                {publicCharacters.length > 0 ? (
                  publicCharacters.map((character) => (
                    <div
                      key={character.id}
                      className="w-64 flex-shrink-0 cursor-pointer bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow dark:bg-zinc-900"
                      onClick={() => handleCharacterClick(character)}
                    >
                      <div className="flex p-3">
                        <div className="h-16 w-16 flex-shrink-0 relative bg-muted/20 rounded-md overflow-hidden">
                          {character.imageUrl && (
                            <img
                              src={character.imageUrl || "/placeholder.svg"}
                              alt={character.name}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div className="ml-3 flex flex-col overflow-hidden">
                          <h3 className="font-semibold text-sm line-clamp-1">{character.name}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                          </p>
                          <p className="text-xs mt-1 line-clamp-2">
                            {character.description || "No description available."}
                          </p>
                        </div>
                      </div>
                      <div className="px-3 pb-2 flex items-center">
                        <span className="text-xs text-muted-foreground">{Math.floor(Math.random() * 1000) + 1}k</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 px-4 bg-zinc-900 rounded-lg shadow-sm w-full">
                    <p className="text-muted-foreground">No community characters available yet.</p>
                  </div>
                )}
              </div>
            </div>
          </section>


          {/* Featured Section */}
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Featured</h2>
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
                {homeCharacters.filter((c) => c.category === "educational").length > 0 ? (
                  homeCharacters
                    .filter((c) => c.category === "educational")
                    .map((character) => (
                      <div
                        key={character.id}
                        className="w-64 flex-shrink-0 cursor-pointer bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow dark:bg-zinc-900"
                        onClick={() => handleCharacterClick(character)}
                      >
                        <div className="flex p-3">
                          <div className="h-16 w-16 flex-shrink-0 relative bg-muted/20 rounded-md overflow-hidden">
                            {character.imageUrl && (
                              <img
                                src={character.imageUrl || "/placeholder.svg"}
                                alt={character.name}
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>
                          <div className="ml-3 flex flex-col overflow-hidden">
                            <h3 className="font-semibold text-sm line-clamp-1">{character.name}</h3>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                            </p>
                            <p className="text-xs mt-1 line-clamp-2">
                              {character.description || "No description available."}
                            </p>
                          </div>
                        </div>
                        <div className="px-3 pb-2 flex items-center">
                          <span className="text-xs text-muted-foreground">{Math.floor(Math.random() * 1000) + 1}k</span>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8 px-4 bg-zinc-900 rounded-lg shadow-sm w-full">
                    <p className="text-muted-foreground">No featured characters available yet.</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Popular Section */}
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Popular</h2>
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
                {homeCharacters.filter((c) => c.category === "popular").length > 0 ? (
                  homeCharacters
                    .filter((c) => c.category === "popular")
                    .map((character) => (
                      <div
                        key={character.id}
                        className="w-64 flex-shrink-0 cursor-pointer bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow dark:bg-zinc-900"
                        onClick={() => handleCharacterClick(character)}
                      >
                        <div className="flex p-3">
                          <div className="h-16 w-16 flex-shrink-0 relative bg-muted/20 rounded-md overflow-hidden">
                            {character.imageUrl && (
                              <img
                                src={character.imageUrl || "/placeholder.svg"}
                                alt={character.name}
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>
                          <div className="ml-3 flex flex-col overflow-hidden">
                            <h3 className="font-semibold text-sm line-clamp-1">{character.name}</h3>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                            </p>
                            <p className="text-xs mt-1 line-clamp-2">
                              {character.description || "No description available."}
                            </p>
                          </div>
                        </div>
                        <div className="px-3 pb-2 flex items-center">
                          <span className="text-xs text-muted-foreground">{Math.floor(Math.random() * 1000) + 1}k</span>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8 px-4 bg-zinc-900 rounded-lg shadow-sm w-full">
                    <p className="text-muted-foreground">No popular characters available yet.</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          <div className="mt-6 mb-6 text-center">
            <p className="text-muted-foreground mb-4">Can't find what you're looking for?</p>
            <Button className="px-6" onClick={() => setIsCreateDialogOpen(true)}>
              Create Your Own Character
            </Button>
          </div>

          <CharacterFooter />
        </div>
      )}
    </div>
  )
}

