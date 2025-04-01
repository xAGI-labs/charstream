"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import Script from "next/script"
import SignupDialog from "@/components/signup-dialog"
import { useSignupDialog } from "@/hooks/use-signup-dialog"
import { Header } from "@/components/header/header"
import { HeroSection } from "@/components/hero-section"
import { CharacterSection } from "@/components/characters/character-section"
import { CreateCharacterSection } from "@/components/create-character-section"
import { preloadDefaultAvatars } from "@/lib/preload-avatars"
import { CharacterCards } from "@/components/character-cards"
import CharacterFooter from "@/components/FooterBar"
import { GhiblifyAdSection } from "@/components/ghiblify-ad-section"

export default function Home() {
  const { isOpen, setIsOpen } = useSignupDialog()
  const { isLoaded, isSignedIn } = useAuth()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      setIsOpen(true)
    }
  }, [isLoaded, isSignedIn, setIsOpen])

  useEffect(() => {
    fetch('/api/home-characters?category=all').catch(console.error)
    const timeoutId = setTimeout(() => {
      preloadDefaultAvatars().catch(console.error)
    }, 2000)
    return () => clearTimeout(timeoutId)
  }, [])

  // Schema.org structured data for better SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Chatstream.xyz",
    "applicationCategory": "EntertainmentApplication",
    "description": "Create and chat with AI characters that feel real. Bring your favorite fictional characters to life or create entirely new ones.",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "url": "https://chatstream.xyz"
  }

  return (      
      <div className="flex h-screen bg-background">
        <div className="flex-1 overflow-auto">
          {!isMobile && <Header />}
          <main className="container max-w-7xl mx-auto px-4 pb-16">
            <h1 className="sr-only">Chatstream.xyz - Create and Chat with AI Characters</h1>
            <HeroSection />
            <section aria-labelledby="trending-characters">
              <h2 id="trending-characters" className="sr-only">Trending Characters</h2>
              <CharacterCards/>
            </section>

            <GhiblifyAdSection />

            <section className="py-12" aria-labelledby="popular-characters">
              <h2 id="popular-characters" className="sr-only">Popular Characters</h2>
              <CharacterSection title="Popular Characters" category="popular" />
            </section>
            <section className="py-12 rounded-lg" aria-labelledby="educational-characters">
              <h2 id="educational-characters" className="sr-only">Educational Characters</h2>
              <CharacterSection title="Educational Characters" category="educational" />
            </section>
            <section className="py-12" aria-labelledby="create-character">
              <h2 id="create-character" className="sr-only">Create Your Own Character</h2>
              <CreateCharacterSection />
            </section>
          </main>
          <CharacterFooter/>
        </div>
        <SignupDialog open={isOpen} onOpenChange={setIsOpen} />
      </div>
  )
}

