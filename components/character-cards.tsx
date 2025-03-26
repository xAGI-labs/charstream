"use client"

import Image from "next/image"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { useTheme } from "next-themes"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@clerk/nextjs"
import { toast } from "sonner"
import { useSignupDialog } from "@/hooks/use-signup-dialog"

interface Character {
  id: string
  name: string
  description: string
  imageUrl: string
  category?: string
}

interface CategoryGroup {
  title: string
  characters: Character[]
}

export function CharacterCards() {
  const [categories, setCategories] = useState<CategoryGroup[]>([
    { title: "Try these", characters: [] },
  ])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { theme } = useTheme()
  const [clickingCharId, setClickingCharId] = useState<string | null>(null)
  const { isSignedIn } = useAuth()
  const { setIsOpen } = useSignupDialog()

  // Refs for scrolling
  const scrollContainerRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const fetchCharacters = async () => {
      setLoading(true)
      setError(null)
      try {
        console.log("Fetching characters...")
        // Fetch both home and public characters in parallel for speed
        const [homeResponse, publicResponse] = await Promise.all([
          fetch("/api/home-characters?category=all"),
          fetch("/api/characters?public=true")
        ])
        
        if (!homeResponse.ok) {
          throw new Error(`Failed to fetch home characters: ${homeResponse.status}`)
        }
        
        if (!publicResponse.ok) {
          throw new Error(`Failed to fetch public characters: ${publicResponse.status}`)
        }
        
        const homeData = await homeResponse.json()
        const publicData = await publicResponse.json()
        
        console.log("Fetched home data:", homeData)
        console.log("Fetched public data:", publicData)

        if (!Array.isArray(homeData)) {
          throw new Error("Invalid data format received from home characters API")
        }

        const publicCharacters = Array.isArray(publicData.characters) ? publicData.characters : []

        const communityCharacters = publicCharacters
          .slice(0, 8)
          .map(mapCharacterData)

        setCategories([
          { title: "Try These", characters: communityCharacters },
        ])
      } catch (error: any) {
        console.error("Error fetching characters:", error)
        setError(error.message || "An unknown error occurred")

      } finally {
        setLoading(false)
      }
    }

    fetchCharacters()
  }, [])

  const mapCharacterData = (char: any): Character => {
    // Check if required properties exist
    if (!char || typeof char !== 'object') {
      console.error("Invalid character data:", char)
      // Return a fallback character
      return {
        id: `fallback-${Math.random().toString(36).substring(7)}`,
        name: "Unnamed Character",
        description: "No description available",
        imageUrl: `/placeholder.svg`,
        category: "unknown"
      }
    }

    // More robust mapping with fallbacks for each property
    return {
      id: char.id || `id-${Math.random().toString(36).substring(7)}`,
      name: char.name || "Unnamed Character",
      description: char.description || (char.name ? `with ${char.name.split(" ")[0]}` : "Chat with this character"),
      imageUrl: isValidImageUrl(char.imageUrl) ? char.imageUrl : `https://robohash.org/${encodeURIComponent(char.name || "unknown")}?size=64x64&set=set4`,
      category: char.category || "activity",
    }
  }

  // Function to validate image URLs
  const isValidImageUrl = (url: any): boolean => {
    if (!url || typeof url !== 'string') return false
    
    // Check if URL is a data URL or a proper HTTP URL
    return url.startsWith('data:') || 
           url.startsWith('http://') || 
           url.startsWith('https://') || 
           url.startsWith('/')
  }


  const handleCardClick = async (character: Character) => {
    // If user is not signed in, prompt them to sign up first
    if (!isSignedIn) {
      setIsOpen(true)
      return
    }
    
    try {
      setClickingCharId(character.id)
      console.log(`Creating conversation for character: ${character.id}`)
      
      // Create a conversation with this character via the API
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ characterId: character.id })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Server error: ${response.status} - ${errorText}`)
        throw new Error(`Failed to create conversation: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log("Conversation created successfully:", data)
      
      // Navigate to the chat with the created conversation
      router.push(`/chat/${data.id}`)
    } catch (error) {
      console.error("Error creating conversation:", error)
      toast.error("Failed to start chat", {
        description: "Please try again later."
      })
    } finally {
      setClickingCharId(null)
    }
  }

  const scroll = (categoryIndex: number, direction: "left" | "right") => {
    const container = scrollContainerRefs.current[categoryIndex]
    if (!container) return

    const scrollAmount = 320 // Approximate card width + gap
    const scrollLeft = direction === "left" ? container.scrollLeft - scrollAmount : container.scrollLeft + scrollAmount

    container.scrollTo({
      left: scrollLeft,
      behavior: "smooth",
    })
  }

  // Character card skeleton
  const CharacterCardSkeleton = () => (
    <div className="flex-shrink-0 w-64 rounded-lg bg-card border p-3 animate-pulse">
      <div className="flex">
        <div className="h-16 w-16 flex-shrink-0 rounded-md bg-muted"></div>
        <div className="ml-3 flex flex-col flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
      </div>
      <div className="mt-2">
        <Skeleton className="h-3 w-12 ml-auto" />
      </div>
    </div>
  )

  return (
    <div className="w-full py-6 space-y-8">
      {loading ? (
        categories.map((category, categoryIndex) => (
          <div key={categoryIndex} className="space-y-3">
            <h2 className="text-xl font-semibold px-4 md:px-6">{category.title}</h2>
            <div className="flex overflow-x-auto scrollbar-hide gap-3 px-4 md:px-6 pb-2">
              {Array.from({ length: 4 }).map((_, idx) => (
                <CharacterCardSkeleton key={idx} />
              ))}
            </div>
          </div>
        ))
      ) : error ? (
        <div className="text-center text-red-500">Error: {error}</div>
      ) : (
        categories.map((category, categoryIndex) => (
          <div key={category.title} className="space-y-3">
            <h2 className="text-xl font-semibold px-4 md:px-2">{category.title}</h2>

            <div className="relative group">
              {/* Scroll buttons */}
              <button
                onClick={() => scroll(categoryIndex, "left")}
                className="absolute left-1 top-1/2 -translate-y-1/2 z-10 bg-background/80 dark:bg-background/80 rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                disabled={scrollContainerRefs.current[categoryIndex]?.scrollLeft === 0}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                onClick={() => scroll(categoryIndex, "right")}
                className="absolute right-1 top-1/2 -translate-y-1/2 z-10 bg-background/80 dark:bg-background/80 rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              {/* Scrollable container */}
              <div
                ref={(el) => {
                  scrollContainerRefs.current[categoryIndex] = el;
                }}
                className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory gap-3 px-4 md:px-6 pb-2"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {category.characters.map((character) => (
                  <div
                    key={character.id}
                    className={`w-64 flex-shrink-0 cursor-pointer bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow dark:bg-neutral-900 border dark:border-neutral-800 hover:border-primary/50 dark:hover:border-primary/50 snap-start ${
                      clickingCharId === character.id ? "opacity-70 pointer-events-none" : ""
                    }`}
                    onClick={() => handleCardClick(character)}
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
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {character.description || "No description available."}
                        </p>
                      </div>
                    </div>
                    <div className="px-3 pb-2 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{Math.floor(Math.random() * 1000) + 1}k</span>
                      {clickingCharId === character.id && (
                        <span className="text-xs text-primary animate-pulse">Creating chat...</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

