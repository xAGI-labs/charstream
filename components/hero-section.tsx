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

// Function to generate character-specific prompts
const generateCharacterPrompt = (name: string, description: string): string => {
  const keywords = description.toLowerCase();

  if (name.toLowerCase() === "chota bheem") {
    return `Hi, I'm Chota Bheem! I'm always ready to protect Dholakpur with my strength and courage. What adventure shall we embark on today?`;
  } else if (name.toLowerCase() === "chanakya") {
    return `Greetings, I am Chanakya, the master strategist and philosopher. How may I assist you with wisdom and guidance?`;
  } else if (name.toLowerCase() === "harry potter") {
    return `Hello, I'm Harry Potter, the Boy Who Lived. Shall we explore the magical world together or face some dark wizards?`;
  } else if (name.toLowerCase() === "sherlock holmes") {
    return `Good day, I am Sherlock Holmes, the world's only consulting detective. Do you have a mystery that needs solving?`;
  } else if (keywords.includes('wizard') || keywords.includes('magic')) {
    return `Behold, I am ${name}, a wielder of the arcane arts. What enchantment or spell do you seek today?`;
  } else if (keywords.includes('warrior') || keywords.includes('fighter') || keywords.includes('battle')) {
    return `I am ${name}, a fearless warrior. My blade thirsts for glory. Shall we march into battle together?`;
  } else if (keywords.includes('guide') || keywords.includes('helper')) {
    return `Greetings, traveler! I am ${name}, your trusted guide. Where shall our journey take us?`;
  } else if (keywords.includes('healer') || keywords.includes('doctor')) {
    return `I am ${name}, a healer of body and soul. Tell me, where does it hurt?`;
  } else if (keywords.includes('scholar') || keywords.includes('knowledge')) {
    return `Salutations! I am ${name}, a seeker of wisdom. What mysteries shall we unravel today?`;
  } else if (keywords.includes('rogue') || keywords.includes('thief')) {
    return `*whispers* The name's ${name}. I specialize in... delicate operations. What needs to be done?`;
  } else {
    return `Greetings, I am ${name}. What grand adventure shall we embark on today?`;
  }
};

export function HeroSection() {
  const [characterSets, setCharacterSets] = useState<[Character[], Character[]]>([[], []]);
  const [displayState, setDisplayState] = useState<0 | 1>(0);
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const router = useRouter()

  // Transition effect - switch between states every 6 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayState((prev) => (prev === 0 ? 1 : 0));
    }, 6000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const response = await fetch("/api/home-characters?category=all")
        if (!response.ok) {
          throw new Error("Failed to fetch characters")
        }
        const data = await response.json()
        
        // Create two sets of characters with personalized prompts
        const firstSet = data.slice(0, 2).map((char: any) => ({
          id: char.id,
          name: char.name,
          description: char.description || "",
          imageUrl: char.imageUrl || `https://robohash.org/${encodeURIComponent(char.name)}?size=256x256&set=set4`,
          prompt: char.prompt || generateCharacterPrompt(char.name, char.description || ""),
        }));
        
        const secondSet = data.slice(2, 4).map((char: any) => ({
          id: char.id,
          name: char.name,
          description: char.description || "",
          imageUrl: char.imageUrl || `https://robohash.org/${encodeURIComponent(char.name)}?size=256x256&set=set4`,
          prompt: char.prompt || generateCharacterPrompt(char.name, char.description || ""),
        }));
        
        setCharacterSets([firstSet, secondSet]);
      } catch (error) {
        console.error("Error fetching characters:", error)
      }
    }

    fetchCharacters()
  }, [])

  const handleReplyClick = async (characterId: string, prompt: string) => {
    try {
      setIsLoading(characterId);
      
      // Create a conversation first
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          characterId,
          initialMessage: prompt
        })
      });

      if (!response.ok) {
        throw new Error("Failed to create conversation");
      }

      const data = await response.json();
      
      // Now navigate to the newly created conversation
      router.push(`/chat/${data.id}`);
    } catch (error) {
      console.error("Error creating conversation:", error);
      // Handle error state if needed
    } finally {
      setIsLoading(null);
    }
  }

  return (
    <div className="relative w-full min-h-[400px] text-white mt-10 hidden md:block">
      {/* Background Images with Transition */}
      <div className="absolute inset-0 z-0 rounded-4xl overflow-hidden">
        <Image
          src="/bg-card.jpg"
          alt="Adventure landscape"
          fill
          className={`object-cover rounded-xl transition-transform duration-5000 ${displayState === 0 ? 'scale-110 translate-x-10' : 'scale-100 translate-x-0'} ${displayState === 0 ? 'opacity-100' : 'opacity-0'}`}
          priority
        />
        <Image
          src="/bg-card2.jpg"
          alt="Adventure landscape alternate"
          fill
          className={`object-cover rounded-xl transition-transform text-black duration-5000 ${displayState === 1 ? 'scale-110 translate-x-10' : 'scale-100 translate-x-0'} ${displayState === 1 ? 'opacity-100' : 'opacity-0'}`}
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

        {/* Right Side - Character Cards with Transition */}
        <div className="md:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-4">
          {characterSets[displayState].map((character) => (
            <Card 
              key={character.id} 
              className={`bg-gray-100/50 dark:bg-gray-800/80 border-0 text-neutral-900 dark:text-white overflow-hidden transition-shadow `}
            >
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
                  className="w-full text-left dark:bg-neutral-800/60 bg-neutral-200/60 rounded-full p-3 text-neutral-900 dark:text-white text-sm cursor-pointer hover:underline"
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

