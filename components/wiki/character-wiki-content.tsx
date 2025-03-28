"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { WikiSection } from "./wiki-section"
import { toast } from "sonner"
import { User, AlertCircle } from "lucide-react"

const Icons = {
  user: User,
  exclamation: AlertCircle
}

interface Character {
  id: string
  name: string
  description?: string | null
  imageUrl?: string | null
  instructions?: string | null
  isPublic?: boolean
  creatorId?: string
  createdAt?: Date
  updatedAt?: Date
}

interface WikiContent {
  biography: string
  personality: string
  appearance: string
  abilities: string
  background: string
  relationships: string
  trivia: string
  quotes: string[]
}

interface CharacterWikiContentProps {
  character: Character
}

export function CharacterWikiContent({ character }: CharacterWikiContentProps) {
  const [wikiContent, setWikiContent] = useState<WikiContent | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchWikiContent() {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/wiki/${character.id}`)
        
        if (!response.ok) {
          throw new Error("Failed to fetch wiki content")
        }
        
        const data = await response.json()
        setWikiContent(data)
      } catch (error) {
        console.error("Error fetching wiki content:", error)
        toast.error("Failed to load wiki content")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchWikiContent()
  }, [character.id])

  return (
    <div className="flex flex-col space-y-6 p-4 md:p-10 md:px-14">
      {/* Wiki Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{character.name}</h1>
          <p className="text-muted-foreground md:pr-44">{character.description}</p>
        </div>
        <Button variant="outline" onClick={() => window.history.back()}>
          Back
        </Button>
      </div>
      
      <Separator />
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Sidebar */}
        <div>
          <Card className="overflow-hidden">
            <div className="aspect-square relative">
              {character.imageUrl ? (
                <Image 
                  src={character.imageUrl} 
                  alt={character.name} 
                  fill 
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-muted">
                  <Icons.user className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-2">{character.name}</h2>
              <div className="space-y-2 text-sm">
                {isLoading ? (
                  <>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/6" />
                  </>
                ) : wikiContent ? (
                  <>
                    <p><strong>Full Name:</strong> {character.name}</p>
                    <p><strong>Occupation:</strong> {extractOccupation(wikiContent.biography)}</p>
                    <p><strong>Abilities:</strong> {extractMainAbility(wikiContent.abilities)}</p>
                  </>
                ) : (
                  <p className="text-muted-foreground">No additional information available</p>
                )}
              </div>
            </div>
          </Card>

          <Button variant="secondary" className="w-full mt-4" asChild>
            <a href={`/chat/${character.id}`}>Chat with {character.name}</a>
          </Button>
        </div>
        
        {/* Main Content */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : wikiContent ? (
            <Tabs defaultValue="overview">
              <TabsList className="mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="biography">Biography</TabsTrigger>
                <TabsTrigger value="personality">Personality</TabsTrigger>
                <TabsTrigger value="abilities">Abilities</TabsTrigger>
                <TabsTrigger value="relationships">Relationships</TabsTrigger>
                <TabsTrigger value="quotes">Quotes</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview">
                <div className="space-y-6">
                  <WikiSection title="Biography" content={wikiContent.biography} />
                  <WikiSection title="Appearance" content={wikiContent.appearance} />
                  <WikiSection title="Trivia" content={wikiContent.trivia} />
                </div>
              </TabsContent>
              
              <TabsContent value="biography">
                <div className="space-y-6">
                  <WikiSection title="Background" content={wikiContent.background} />
                  <WikiSection title="Biography" content={wikiContent.biography} />
                  <WikiSection title="Trivia" content={wikiContent.trivia} />
                </div>
              </TabsContent>
              
              <TabsContent value="personality">
                <div className="space-y-6">
                  <WikiSection title="Personality" content={wikiContent.personality} />
                  <WikiSection title="Appearance" content={wikiContent.appearance} />
                </div>
              </TabsContent>
              
              <TabsContent value="abilities">
                <WikiSection title="Abilities and Skills" content={wikiContent.abilities} />
              </TabsContent>
              
              <TabsContent value="relationships">
                <WikiSection title="Relationships" content={wikiContent.relationships} />
              </TabsContent>
              
              <TabsContent value="quotes">
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold">Notable Quotes</h2>
                  {wikiContent.quotes.length > 0 ? (
                    <ul className="space-y-4">
                      {wikiContent.quotes.map((quote, index) => (
                        <li key={index} className="p-4 bg-muted rounded-md italic">
                          "{quote}"
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">No notable quotes recorded.</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Icons.exclamation className="h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-2xl font-semibold">Wiki Content Not Available</h2>
              <p className="text-muted-foreground mt-2">
                We couldn't load the wiki content for this character.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Helper functions to extract information from wiki content
function extractOccupation(biography: string): string {
  // Simple heuristic to extract occupation
  const occupationKeywords = [
    "wizard", "witch", "warrior", "detective", "doctor", "scientist",
    "teacher", "student", "king", "queen", "prince", "princess",
    "superhero", "villain", "agent", "spy"
  ]
  
  const bioLower = biography.toLowerCase()
  
  for (const keyword of occupationKeywords) {
    if (bioLower.includes(keyword)) {
      return keyword.charAt(0).toUpperCase() + keyword.slice(1)
    }
  }
  
  return "Unknown"
}

function extractMainAbility(abilities: string): string {
  if (!abilities || abilities.length < 10) return "Various"
  
  // Take first sentence or first 50 characters
  const firstSentence = abilities.split('. ')[0]
  return firstSentence.length > 50 
    ? firstSentence.substring(0, 50) + '...'
    : firstSentence
}
