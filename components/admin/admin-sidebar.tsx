"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAdminAuth } from "@/lib/admin-auth"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { 
  BarChart3, 
  Users, 
  MessageSquare, 
  Settings, 
  Shield, 
  Home,
  LogOut,
  UserCircle,
  Activity,
  LineChart
} from "lucide-react"
import Link from "next/link"

export function AdminSidebar() {
  const { logout } = useAdminAuth()
  const router = useRouter()
  const pathname = usePathname()
  
  const handleLogout = async () => {
    try {
      await logout()
      toast.success("Logged out successfully")
    } catch (error) {
      console.error('Logout error:', error)
      toast.error("Logout failed")
    }
  }

  const navigateToHome = () => {
    router.push('/')
  }

  // Check which route is active
  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + '/')
  }

  return (
    <div className="w-64 h-screen border-r bg-sidebar text-sidebar-foreground p-4 flex flex-col overflow-y-auto">
      <div className="mb-8 flex items-center gap-2 px-2">
        <Shield className="h-6 w-6" />
        <h1 className="text-xl font-bold">Admin Panel</h1>
      </div>
      
      <div className="space-y-1">
        <Button 
          variant={isActive('/admin/dashboard') ? "sidebar-primary" : "sidebar"} 
          className="w-full justify-start" 
          onClick={() => router.push('/admin/dashboard')}
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Overview
        </Button>
        <Button 
          variant={isActive('/admin/dashboard/users') ? "sidebar-primary" : "sidebar"} 
          className="w-full justify-start" 
          onClick={() => router.push('/admin/dashboard/users')}
        >
          <Users className="h-4 w-4 mr-2" />
          Users
        </Button>
        <Button 
          variant={isActive('/admin/dashboard/characters') ? "sidebar-primary" : "sidebar"} 
          className="w-full justify-start"
          onClick={() => router.push('/admin/dashboard/characters')}
        >
          <UserCircle className="h-4 w-4 mr-2" />
          Characters
        </Button>
        <Button 
          variant={isActive('/admin/dashboard/content') ? "sidebar-primary" : "sidebar"} 
          className="w-full justify-start"
          onClick={() => router.push('/admin/dashboard/content')}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Content
        </Button>
        <Button 
          variant={isActive('/admin/analytics') ? "sidebar-primary" : "sidebar"} 
          className="w-full justify-start"
          onClick={() => router.push('/admin/analytics')}
        >
          <Activity className="h-4 w-4 mr-2" />
          Analytics
        </Button>
        <Button 
          variant={isActive('/admin/settings') ? "sidebar-primary" : "sidebar"} 
          className="w-full justify-start"
          onClick={() => router.push('/admin/settings')}
        >
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>
      
      <div className="mt-auto space-y-1">
        <Button 
          variant="sidebar" 
          className="w-full justify-start"
          onClick={navigateToHome}
        >
          <Home className="h-4 w-4 mr-2" />
          Back to Site
        </Button>
        <Button 
          variant="sidebar" 
          className="w-full justify-start"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  )
}
