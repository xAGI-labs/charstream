"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, BookOpen, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { WikiCharacterGrid } from "@/components/wiki/wiki-character-grid"
import { Character } from "@/types/character"
import { toast } from "sonner"
import CharacterFooter from "@/components/FooterBar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function WikiPageContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [homeCharacters, setHomeCharacters] = useState<Character[]>([])
  const [publicCharacters, setPublicCharacters] = useState<Character[]>([])
  const [filteredCharacters, setFilteredCharacters] = useState<Character[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
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

      setPublicCharacters(uniquePublicChars)
    } catch (error) {
      console.error("Error fetching characters:", error)
      toast.error("Failed to load characters")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCharacterClick = (character: Character) => {
    router.push(`/wiki/${character.id}`)
  }

  // Get characters based on active tab
  const getDisplayedCharacters = () => {
    if (isSearching) return filteredCharacters
    
    switch (activeTab) {
      case "popular":
        return homeCharacters.filter(c => c.category === "popular")
      case "educational":
        return homeCharacters.filter(c => c.category === "educational")
      case "community":
        return publicCharacters
      default:
        return [...homeCharacters, ...publicCharacters]
    }
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-background">
      {/* Wiki Header */}
      <div className="bg-yellow-300 text-neutral-900 py-4 px-4 sm:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center">
            <BookOpen className="h-6 w-6 mr-2" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Character Wiki</h1>
          </div>
          <div className="w-full max-w-md relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search wikis..."
              className="pl-9 pr-8 h-10 w-full bg-primary-foreground/10 border-neutral-900/20 placeholder:text-primary-neutral-900/60 text-neutral-900"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 px-2 text-primary-foreground/70 hover:text-primary-foreground"
                onClick={() => setSearchQuery("")}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 container max-w-7xl mx-auto px-4 py-6">
        {/* Category Filter */}
        <div className="mb-6 flex justify-between items-center">
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="popular">Popular</TabsTrigger>
              <TabsTrigger value="educational">Educational</TabsTrigger>
              <TabsTrigger value="community">Community</TabsTrigger>
            </TabsList>
          </Tabs>
          
          {/* Mobile Filter Dropdown */}
          <div className="sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setActiveTab("all")}>
                  All Characters
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("popular")}>
                  Popular
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("educational")}>
                  Educational
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("community")}>
                  Community
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[400px] w-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : isSearching ? (
          <div className="w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">
                Search Results for "{searchQuery}"
              </h2>
              <div className="text-sm text-muted-foreground">
                {filteredCharacters.length} {filteredCharacters.length === 1 ? 'result' : 'results'}
              </div>
            </div>
            
            {filteredCharacters.length > 0 ? (
              <WikiCharacterGrid characters={filteredCharacters} onCharacterClick={handleCharacterClick} />
            ) : (
              <div className="text-center py-16 bg-card rounded-lg shadow-sm border border-border">
                <div className="mx-auto max-w-md">
                  <h3 className="text-xl font-semibold mb-2">No wikis found</h3>
                  <p className="text-muted-foreground mb-6">
                    No character wikis match your search query. Try searching with different terms.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center">
                  {activeTab === "all" ? "All Character Wikis" : 
                   activeTab === "popular" ? "Popular Character Wikis" : 
                   activeTab === "educational" ? "Educational Character Wikis" : 
                   "Community Character Wikis"}
                </h2>
                <div className="text-sm text-muted-foreground">
                  {getDisplayedCharacters().length} {getDisplayedCharacters().length === 1 ? 'character' : 'characters'}
                </div>
              </div>
              <WikiCharacterGrid characters={getDisplayedCharacters()} onCharacterClick={handleCharacterClick} />
            </section>
          </div>
        )}
      </main>
      
      <CharacterFooter />
    </div>
  )
}
