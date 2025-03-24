"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import SignupDialog from "@/components/signup-dialog"
import { useSignupDialog } from "@/hooks/use-signup-dialog"
import { Sidebar } from "@/components/sidebar/sidebar"
import { Header } from "@/components/header/header"
import { HeroSection } from "@/components/hero-section"
import { CharacterSection } from "@/components/characters/character-section"
import { CreateCharacterSection } from "@/components/create-character-section"
import { preloadDefaultAvatars } from "@/lib/preload-avatars"
import { CharacterCards } from "@/components/character-cards" // Ensure no conflicting imports
import CharacterFooter from "@/components/FooterBar"

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

  return (
    <div className="flex h-screen bg-background">
      <Sidebar setIsOpen={setIsOpen} />
      <div className="flex-1 overflow-auto">
        {!isMobile && <Header />}
        <main className="container max-w-7xl mx-auto px-4 pb-16">
          <HeroSection />
          <section>
            <CharacterCards/>
          </section>
          <section className="py-12">
            <CharacterSection title="Popular Characters" category="popular" />
          </section>
          <section className="py-12 bg-muted/10 rounded-lg">
            <CharacterSection title="Educational Characters" category="educational" />
          </section>
          <section className="py-12">
            <CreateCharacterSection />
          </section>
        </main>
        <CharacterFooter/>
      </div>
      <SignupDialog open={isOpen} onOpenChange={setIsOpen} />
    </div>
  )
}

