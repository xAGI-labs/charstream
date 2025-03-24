"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"

interface Character {
  id: string
  name: string
  description: string
  imageUrl: string
  prompt: string
}

export function HeroSection() {
  const [characters, setCharacters] = useState<Character[]>([])
  const router = useRouter()

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const response = await fetch("/api/home-characters?category=all")
        if (!response.ok) {
          throw new Error("Failed to fetch characters")
        }
        const data = await response.json()
        const selectedCharacters = data.slice(0, 2).map((char: any) => ({
          id: char.id,
          name: char.name,
          description: char.description,
          imageUrl: char.imageUrl || `https://robohash.org/${encodeURIComponent(char.name)}?size=256x256&set=set4`,
          prompt: char.prompt || "Hi, looking for me?",
        }))
        setCharacters(selectedCharacters)
      } catch (error) {
        console.error("Error fetching characters:", error)
      }
    }

    fetchCharacters()
  }, [])

  const handleReplyClick = (characterId: string, prompt: string) => {
    router.push(`/chat/${characterId}?prompt=${encodeURIComponent(prompt)}`)
  }

  return (
    <div className="relative w-full min-h-[400px] text-white mt-10 hidden md:block">
      {/* Background Image */}
      <div className="absolute inset-0 z-0 rounded-4xl">
        <Image
          src="/bg-card.jpg"
          alt="Adventure landscape"
          fill
          className="object-cover opacity-80 rounded-xl"
          priority
        />
      </div>

      {/* Content Container */}
      <div className="relative z-10 container mx-auto px-6 py-16 flex flex-col md:flex-row items-start justify-between gap-8">
        {/* Left Side - Heading */}
        <div className="md:w-1/3 pt-8">
          <p className="text-gray-300 mb-2">What do you want to do?</p>
          <h1 className="text-3xl md:text-4xl font-bold mb-6">Venture beyond. Forge your path.</h1>

          {/* Refresh button */}
          <button
            className="p-2 rounded-full bg-gray-100/50 hover:bg-gray-50/50 dark:bg-gray-800/50 dark:hover:bg-gray-700/50 transition-colors"
            onClick={() => window.location.reload()}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-refresh-cw"
            >
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M3 21v-5h5" />
            </svg>
          </button>
        </div>

        {/* Right Side - Character Cards */}
        <div className="md:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-4">
          {characters.map((character) => (
            <Card key={character.id} className="bg-gray-100/50 dark:bg-gray-800/80 border-0 text-neutral-900 dark:text-white overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden">
                    <Image
                      src={character.imageUrl || "/placeholder.svg"}
                      alt={character.name}
                      width={48}
                      height={48}
                      className="object-cover"
                    />
                  </div>
                  <h2 className="text-lg font-medium text-neutral-900 dark:text-white">{character.name}</h2>
                </div>

                <div className="min-h-[80px] text-sm mb-4 text-neutral-900 dark:text-white">{character.prompt}</div>

                <button
                  onClick={() => handleReplyClick(character.id, character.prompt)}
                  className="w-full text-left text-neutral-900 dark:text-white text-sm cursor-pointer hover:underline"
                >
                  Reply...
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

