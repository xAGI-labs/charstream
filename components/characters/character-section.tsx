"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { useState, useEffect } from "react"
import { useSignupDialog } from "@/hooks/use-signup-dialog"
import { ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Character, CharacterCard } from "./character-card"
import { toast } from "sonner"

interface CharacterSectionProps {
  title: string
  category: string // We'll use this to fetch the right category
}

export function CharacterSection({ title, category }: CharacterSectionProps) {
  const { isSignedIn } = useAuth()
  const router = useRouter()
  const { setIsOpen } = useSignupDialog()
  const [isLoading, setIsLoading] = useState(false)
  const [characters, setCharacters] = useState<Character[]>([])
  const [isFetching, setIsFetching] = useState(true)
  
  // Fetch characters from database on component mount
  useEffect(() => {
    async function fetchHomeCharacters() {
      try {
        setIsFetching(true)
        // Add a timestamp to bust cache
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/home-characters?category=${category}&t=${timestamp}`)
        
        if (!response.ok) {
          throw new Error("Failed to fetch characters")
        }
        
        const data = await response.json()
        
        // Add debugging to check imageUrls
        console.log(`Character Section: Fetched ${data.length} ${category} characters:`, 
          data.map((c: any) => ({ 
            name: c.name, 
            hasImageUrl: !!c.imageUrl,
            imageUrlType: c.imageUrl ? (
              c.imageUrl.includes('cloudinary') ? 'cloudinary' : 
              c.imageUrl.includes('together') ? 'together' :
              c.imageUrl.startsWith('data:') ? 'data-uri' :  
              'other'
            ) : 'none',
            imageUrlStart: c.imageUrl?.substring(0, 50)
          }))
        );
        
        // Ensure we handle image URLs consistently
        setCharacters(data.map((char: any) => {
          // Map database characters to component characters
          return {
            id: char.id,
            name: char.name,
            description: char.description,
            // Ensure image URL is valid or set to undefined
            imageUrl: char.imageUrl || undefined
          };
        }))
      } catch (error) {
        console.error("Error fetching home characters:", error)
        toast.error("Failed to load characters")
      } finally {
        setIsFetching(false)
      }
    }
    
    fetchHomeCharacters()
  }, [category])
  
  const handleCharacterClick = async (characterId: string) => {
    if (!isSignedIn) {
      setIsOpen(true)
      return
    }
    
    try {
      setIsLoading(true)
      console.log(`Creating conversation for character: ${characterId}`)
      
      // Create a new conversation with this character
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ characterId })
      })
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Server error: ${response.status} - ${errorText}`);
        throw new Error(`Failed to create conversation: ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json()
      console.log("Conversation created successfully:", data)
      
      // Redirect to the chat page
      router.push(`/chat/${data.id}`)
    } catch (error) {
      console.error("Error creating conversation:", error)
      toast.error("Failed to start chat", {
        description: "Please try again later or check the console for details."
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-gray-300">{title}</h2>
        <Button variant="ghost" size="sm" className="h-7 text-xs text-gray-400 hover:text-white">
          See all <ChevronRight className="ml-1 h-3 w-3" />
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {isFetching ? (
          // Show loading placeholders
          Array(4).fill(0).map((_, i) => (
            <div 
              key={i} 
              className="bg-card border border-border rounded-lg p-3 flex flex-col items-center text-center aspect-[3/4]"
            >
              <div className="w-full aspect-square rounded-md bg-gradient-to-b from-gray-700 to-gray-800 animate-pulse mb-3" />
              <div className="h-4 w-20 bg-gradient-to-r from-gray-700 to-gray-800 animate-pulse rounded" />
            </div>
          ))
        ) : characters.length === 0 ? (
          <div className="col-span-4 py-8 text-center text-muted-foreground">
            No characters found in this category.
          </div>
        ) : (
          characters.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              onClick={() => handleCharacterClick(character.id)}
              disabled={isLoading}
            />
          ))
        )}
      </div>
    </section>
  )
}
