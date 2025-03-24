"use client"

import { useState, useEffect } from "react"
import { useAuth, useUser, UserButton } from "@clerk/nextjs"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  PlusCircle, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Home,
  MessageCircle,
  Star,
  Settings,
  LogOut
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSignupDialog } from "@/hooks/use-signup-dialog"
import { CreateCharacterDialog } from "@/components/create-character-dialog"
import { ConversationList } from "./conversation-list"
import { MobileNavigation } from "./mobile-navigation"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import  ThemeSwitch  from "@/components/theme-switch"
import { FaCcDiscover, FaFire } from "react-icons/fa"

// Update the SidebarProps interface
interface SidebarProps {
  setIsOpen?: (open: boolean) => void;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({ setIsOpen, onCollapsedChange }: SidebarProps) {
  const { isSignedIn } = useAuth()
  const { user } = useUser()
  const pathname = usePathname()
  const { setIsOpen: setSignupOpen } = useSignupDialog()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  // Detect mobile screen size
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
  
  // Load collapsed state from localStorage on component mount
  useEffect(() => {
    const savedCollapsedState = localStorage.getItem('sidebarCollapsed')
    if (savedCollapsedState !== null && !isMobile) {
      setIsCollapsed(JSON.parse(savedCollapsedState))
      // Notify parent component on initial load
      if (onCollapsedChange) {
        onCollapsedChange(JSON.parse(savedCollapsedState))
      }
    }
  }, [isMobile, onCollapsedChange])
  
  // Save collapsed state to localStorage whenever it changes
  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed))
    }
  }, [isCollapsed, isMobile])
  
  // Check if we're in a chat route
  const isChatRoute = pathname?.startsWith('/chat')
  
  const handleCreateClick = () => {
    if (!isSignedIn) {
      setSignupOpen?.(true)
      return
    }
    
    setIsCreateDialogOpen(true)
  }
  
  // Get user's first name or username for display
  const displayName = user?.firstName || user?.username || "Guest"
  
  // Pre-define avatar URLs with cache parameter and timestamp to ensure long-term caching
  const harryPotterAvatar = `/api/avatar?name=Harry%20Potter&width=20&height=20&cache=true&t=1`
  const chotaBheemAvatar = `/api/avatar?name=Chota%20Bheem&width=20&height=20&cache=true&t=1`

  // Update the collapsed state and notify parent
  const toggleCollapsed = () => {
    const newCollapsedState = !isCollapsed
    setIsCollapsed(newCollapsedState)
    
    // Notify parent component
    if (onCollapsedChange) {
      onCollapsedChange(newCollapsedState)
    }
    
    // Save to localStorage
    if (!isMobile) {
      localStorage.setItem('sidebarCollapsed', JSON.stringify(newCollapsedState))
    }
  }

  // Render mobile navigation on small screens
  if (isMobile) {
    return (
      <MobileNavigation 
        setSignupOpen={setSignupOpen}
        setCreateDialogOpen={setIsCreateDialogOpen}
        isCreateDialogOpen={isCreateDialogOpen}
        isSignedIn={!!isSignedIn} // Convert to boolean with double negation
        displayName={displayName}
      />
    )
  }

  // Desktop sidebar view
  return (
    <>
      <aside className={cn(
        "border-r border-border/40 flex flex-col transition-all duration-300 relative bg-sidebar shadow-sm",
        "h-full min-h-screen", // Ensure sidebar always has full height
        isCollapsed ? "w-[68px]" : "w-[240px]"
      )}>
        {/* Logo Section - Made clickable */}
        <div className="py-5 px-4 flex items-center justify-between border-b border-border/30 relative">
          <Link href="/" className={cn(
            "flex items-center gap-2", 
            isCollapsed && "justify-center w-full"
          )}>
            <div className={cn("flex items-center justify-center", isCollapsed ? "w-8 h-8" : "w-8 h-8")}>
              <Image 
                src="/logo.png"
                alt="Chatstream Logo"
                width={32}
                height={32}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            {!isCollapsed && <span className="text-sm font-semibold">charstream.xyz</span>}
          </Link>

          {/* Collapse Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn("h-8 w-8 rounded-full text-muted-foreground hover:text-foreground", 
              isCollapsed && "absolute -right-3 bg-background shadow-sm border border-border/40"
            )}
            onClick={toggleCollapsed} // Use the updated function
          >
            {isCollapsed ? 
              <ChevronRight className="h-3.5 w-3.5" /> : 
              <ChevronLeft className="h-3.5 w-3.5" />
            }
          </Button>
        </div>

        <div className="flex flex-col flex-grow overflow-hidden min-h-0">
          <div className="px-3 py-4">
            <TooltipProvider delayDuration={300}>
              <div className="space-y-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleCreateClick}
                      variant="default"
                      className={cn(
                        "justify-start w-fit gap-3 font-medium rounded-full p-4 h-10 bg-yellow-300",
                        isCollapsed && "justify-center p-2 h-9 w-9"
                      )}
                    >
                      <PlusCircle className="h-4 w-4" />
                      {!isCollapsed && <span>Create</span>}
                    </Button>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">Create</TooltipContent>
                  )}
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href="/discover">
                      <Button
                        variant="secondary"
                        className={cn(
                          "w-full justify-start gap-3 font-medium rounded-full p-4 h-10 mt-2 border cursor-pointer",
                          isCollapsed && "justify-center p-2 h-9 w-9"
                        )}
                      >
                        <FaFire className="h-4 w-4" />
                        {!isCollapsed && <span>Discover</span>}
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">Discover</TooltipContent>
                  )}
                </Tooltip>

              </div>
            </TooltipProvider>
          </div>

          {/* Search Bar - Only in expanded mode */}
          {!isCollapsed && (
            <div className="px-3 mb-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 transform text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search"
                  className="pl-8 h-9 text-sm bg-background/50"
                />
              </div>
            </div>
          )}

          {/* Section Label */}
          {!isCollapsed && (
            <div className="px-4 py-2">
              <h3 className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
                Recent Chats
              </h3>
            </div>
          )}

          {/* Conversations List */}
          <div className="flex-grow overflow-y-auto scrollbar-thin">
            <ConversationList isCollapsed={isCollapsed} />
          </div>
        </div>

        {/* Theme Switch Section */}
        <div className={cn("p-3 flex justify-center transition-opacity", isCollapsed && "opacity-0 pointer-events-none")}>
          <div className="w-[4rem] h-[1.5rem]">
            <ThemeSwitch />
          </div>
        </div>


        {/* User Profile Section */}
        <div className="p-3 border-t border-border/30 mt-auto cursor-pointer">
          {isSignedIn ? (
            <div className={cn(
              "flex items-center",
              isCollapsed ? "justify-center" : "justify-between p-2 bg-background/40 rounded-md"
            )}>
              <div className="flex items-center gap-2">
                <UserButton afterSignOutUrl="/" />
                {!isCollapsed && <span className="text-sm font-medium">{displayName}</span>}
              </div>
              {!isCollapsed && (
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full cursor-pointer">
                  <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              )}
            </div>
          ) : (
            <div className={cn(
              "flex items-center",
              isCollapsed ? "justify-center" : "justify-between"
            )}>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary">
                ?
              </div>
              {!isCollapsed && (
                <Button
                  size="sm"
                  onClick={() => setIsOpen?.(true)}
                >
                  Sign In
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Footer Links */}
        <div className={cn("mt-3 flex items-center justify-center gap-3 text-[10px] text-muted-foreground/60 mb-4 transition-opacity", isCollapsed && "opacity-0 pointer-events-none")}>
          <Link href="#" className="hover:text-muted-foreground">
            Privacy
          </Link>
          <Link href="#" className="hover:text-muted-foreground">
            Terms
          </Link>
          <Link href="#" className="hover:text-muted-foreground">
            Help
          </Link>
        </div>
      </aside>
      
      {/* Character creation dialog */}
      <CreateCharacterDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </>
  )
}
