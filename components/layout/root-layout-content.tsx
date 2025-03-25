"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar/sidebar"
import { MobileNavigation } from "@/components/sidebar/mobile-navigation"
import { useAuth, useUser } from "@clerk/nextjs"
import { useSignupDialog } from "@/hooks/use-signup-dialog"

export function RootLayoutContent({
  children
}: {
  children: React.ReactNode
}) {
  const { isSignedIn } = useAuth()
  const { user } = useUser()
  const { setIsOpen: setSignupOpen } = useSignupDialog()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  
  const displayName = user?.firstName || user?.username || "Guest"

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar 
          setIsOpen={setSignupOpen}
          onCollapsedChange={() => {}}
        />
      </div>
      
      {/* Mobile navigation */}
      <div className="md:hidden">
        <MobileNavigation 
          isSignedIn={!!isSignedIn}
          setSignupOpen={setSignupOpen}
          setCreateDialogOpen={setIsCreateDialogOpen}
          isCreateDialogOpen={isCreateDialogOpen}
          displayName={displayName}
        />
      </div>
      
      {/* Main content area */}
      <main className="flex-1 overflow-auto relative">
        <div className="absolute inset-0 flex flex-col">
          {children}
        </div>
      </main>
    </div>
  )
}
