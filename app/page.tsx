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

export default function Home() {
  const { isOpen, setIsOpen } = useSignupDialog()
  const { isLoaded, isSignedIn } = useAuth()
  const [isMobile, setIsMobile] = useState(false)

  // Check for mobile screen size
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    // Initial check
    checkIsMobile()
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIsMobile)
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  useEffect(() => {
    // Show sign-up dialog only if user is not signed in
    if (isLoaded && !isSignedIn) {
      setIsOpen(true)
    }
  }, [isLoaded, isSignedIn, setIsOpen])
  
  // Preload avatars for default characters on initial load
  useEffect(() => {
    // Prime the database with characters by calling our API endpoint
    fetch('/api/home-characters?category=all').catch(console.error);
    
    // We'll keep the preloading logic as a backup, but it's less critical now
    const timeoutId = setTimeout(() => {
      preloadDefaultAvatars().catch(console.error);
    }, 2000);
    
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - only render for desktop */}
      <Sidebar setIsOpen={setIsOpen} />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Don't render header in mobile view to avoid duplicates with mobile navbar */}
        {!isMobile && <Header />}
        
        <main className="container max-w-7xl mx-auto px-4 pb-16">
          <HeroSection />
          <CharacterSection title="Popular Characters" category="popular" />
          <CharacterSection title="Educational Characters" category="educational" />
          <CreateCharacterSection />
        </main>
      </div>
      
      <SignupDialog open={isOpen} onOpenChange={setIsOpen} />
    </div>
  )
}

