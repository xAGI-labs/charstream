"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { AdminAuthProvider, useAdminAuth } from "@/lib/admin-auth"
import { withAdminAuth } from "@/lib/with-admin-auth"
import { useRouter } from "next/navigation"
import { CharacterManagement } from "@/components/admin/character-management"

function CharactersPageContent() {
  const { logout } = useAdminAuth()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await logout()
      toast.success("Logged out successfully")
    } catch (error) {
      console.error('Logout error:', error)
      toast.error("Logout failed")
    }
  }

  const handleBackToDashboard = () => {
    router.push('/admin/dashboard')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <header className="flex justify-between items-center mb-8 pb-4 border-b">
          <div>
            <h1 className="text-2xl font-bold">Character Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage AI characters in the Chatstream platform
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleBackToDashboard}>
              Back to Dashboard
            </Button>
            <Button variant="outline" onClick={handleLogout}>Logout</Button>
          </div>
        </header>
        
        <CharacterManagement />
      </div>
    </div>
  )
}

// Wrap the component with admin auth protection
const ProtectedCharactersPage = withAdminAuth(CharactersPageContent)

// Export a wrapper component that provides the auth context
export default function CharactersPage() {
  return (
    <AdminAuthProvider>
      <ProtectedCharactersPage />
    </AdminAuthProvider>
  )
}
