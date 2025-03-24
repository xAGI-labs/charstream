"use client"

import Image from "next/image"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { useTheme } from "next-themes"
import { ChevronLeft, ChevronRight } from "lucide-react"

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
    { title: "Voices", characters: [] },
  ])
  const [loading, setLoading] = useState(true) // Add loading state
  const [error, setError] = useState<string | null>(null) // Add error state
  const router = useRouter()
  const { theme } = useTheme()

  // Refs for scrolling
  const scrollContainerRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const fetchCharacters = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch("/api/home-characters?category=all")
        if (!response.ok) {
          throw new Error(`Failed to fetch characters: ${response.statusText}`)
        }
        const data = await response.json()

        if (!Array.isArray(data)) {
          throw new Error("Invalid data format received from API")
        }

        // Split characters into categories
        const activities = data
          .filter((char: any) => char.category === "activity" || !char.category)
          .slice(0, 8)
          .map(mapCharacterData)

        const voices = data
          .filter((char: any) => char.category === "voice")
          .slice(0, 4)
          .map(mapCharacterData)

        setCategories([
          { title: "Try these", characters: activities },
          { title: "Voices", characters: voices },
        ])
      } catch (error: any) {
        console.error("Error fetching characters:", error)
        setError(error.message || "An unknown error occurred")

        // Fallback data if API fails
        setCategories([
          {
            title: "Try these",
            characters: generateFallbackCharacters("activity", 8),
          },
          {
            title: "Voices",
            characters: generateFallbackCharacters("voice", 4),
          },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchCharacters()
  }, [])

  const mapCharacterData = (char: any): Character => ({
    id: char.id,
    name: char.name,
    description: char.description || `with ${char.name.split(" ")[0]}`,
    imageUrl: char.imageUrl || `https://robohash.org/${encodeURIComponent(char.name)}?size=64x64&set=set4`,
    category: char.category,
  })

  const generateFallbackCharacters = (category: string, count: number): Character[] => {
    const activityData = [
      { name: "Practice a new language", description: "with HyperGlot" },
      { name: "Practice interviewing", description: "with Interviewer" },
      { name: "Brainstorm ideas", description: "with Brainstormer" },
      { name: "Get book recommendations", description: "with Librarian Linda" },
      { name: "Plan a trip", description: "with Trip Planner" },
      { name: "Write a story", description: "with Creative Helper" },
      { name: "Play a game", description: "with Space Adventure Game" },
      { name: "Help me make a decision", description: "with DecisionHelper" },
    ]

    const voiceData = [
      { name: "Bodyguard", description: '"My job is to protect you..." 👍 (Esp-Eng)' },
      { name: "Soft Bubbly", description: "bubbly little voice" },
      { name: "Galen", description: "Illuminates dark corners of wisdom, lore and legend" },
      { name: "Tala", description: "Always up for an adventure" },
    ]

    const data = category === "activity" ? activityData : voiceData

    return data.slice(0, count).map((item, index) => ({
      id: `${category}-${index}`,
      name: item.name,
      description: item.description,
      imageUrl: `https://robohash.org/${encodeURIComponent(item.name)}?size=64x64&set=set4`,
      category,
    }))
  }

  const handleCardClick = (character: Character) => {
    router.push(`/chat/${character.id}?prompt=Hi`)
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

  return (
    <div className="w-full py-6 space-y-8">
      {loading ? (
        <div className="text-center text-muted-foreground">Loading characters...</div>
      ) : error ? (
        <div className="text-center text-red-500">Error: {error}</div>
      ) : (
        categories.map((category, categoryIndex) => (
          <div key={category.title} className="space-y-3">
            <h2 className="text-xl font-semibold px-4 md:px-6">{category.title}</h2>

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
                  <Card
                    key={character.id}
                    className="flex-shrink-0 w-[250px] snap-start cursor-pointer border dark:border-gray-800 hover:border-primary/50 dark:hover:border-primary/50 transition-colors"
                    onClick={() => handleCardClick(character)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-muted">
                          <Image
                            src={character.imageUrl || "/placeholder.svg"}
                            alt={character.name}
                            width={48}
                            height={48}
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="font-medium text-sm">{character.name}</h3>
                          <p className="text-xs text-muted-foreground">{character.description}</p>
                        </div>
                      </div>

                      {category.title === "Voices" && (
                        <div className="mt-3 flex justify-center">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-primary"
                            >
                              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

