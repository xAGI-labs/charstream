"use client"

import React, { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAdminAuth } from "@/lib/admin-auth"

export function withAdminAuth<P extends React.ComponentProps<'div'>>(Component: React.ComponentType<P>) {
  return function AdminProtectedRoute(props: P) {
    const { isAuthenticated, isLoading, checkAuth } = useAdminAuth()
    const router = useRouter()

    useEffect(() => {
      const verify = async () => {
        const isAuthed = await checkAuth()
        if (!isAuthed) {
          router.push('/admin')
        }
      }

      verify()
    }, [router, checkAuth])

    if (isLoading) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p>Verifying authentication...</p>
          </div>
        </div>
      )
    }

    if (!isAuthenticated) {
      return null // Will redirect in useEffect
    }

    return <Component {...props} />
  }
}