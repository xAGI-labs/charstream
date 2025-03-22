"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"

interface AdminAuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  logout: () => Promise<void>
  checkAuth: () => Promise<boolean>
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const checkAuth = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/admin/verify')
      if (response.ok) {
        setIsAuthenticated(true)
        return true
      } else {
        setIsAuthenticated(false)
        return false
      }
    } catch (error) {
      console.error('Auth verification error:', error)
      setIsAuthenticated(false)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async (): Promise<void> => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
      setIsAuthenticated(false)
      router.push('/admin')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, isLoading, logout, checkAuth }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider')
  }
  return context
}