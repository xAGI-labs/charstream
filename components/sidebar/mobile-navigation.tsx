"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { 
  Home, 
  Search, 
  MessageSquare, 
  PlusCircle, 
  Menu, 
  ChevronRight,
  Settings,
  ArrowLeft,
  Users,
  Star,
  X,
  Sparkles,
  Compass,
  Book
} from "lucide-react"
import { UserButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { CreateCharacterDialog } from "@/components/create-character-dialog"
import { ConversationList } from "./conversation-list"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

interface MobileNavigationProps {
  isSignedIn?: boolean;
  setSignupOpen: (open: boolean) => void;
  setCreateDialogOpen: (open: boolean) => void;
  isCreateDialogOpen: boolean;
  displayName: string;
}

export function MobileNavigation({ 
  isSignedIn = false, 
  setSignupOpen, 
  setCreateDialogOpen,
  isCreateDialogOpen,
  displayName 
}: MobileNavigationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [showSearch, setShowSearch] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  
  // Track scroll for adding shadow to header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  // Close navigation when route changes
  useEffect(() => {
    setIsSheetOpen(false)
    setShowSearch(false)
  }, [pathname])
  
  const handleCreateClick = () => {
    if (!isSignedIn) {
      setSignupOpen(true)
      return
    }
    
    setCreateDialogOpen(true)
    setIsSheetOpen(false) // Close the sheet when opening create dialog
  }
  
  // Check if current route is active
  const isActive = (path: string) => {
    if (path === '/') return pathname === '/'
    return pathname?.startsWith(path)
  }

  return (
    <>
      {/* Top navigation bar with modern shadow and blur effect */}
      <div className={cn(
        "fixed top-0 left-0 right-0 h-16 border-b bg-background/80 backdrop-blur-md z-[100] px-4 flex items-center justify-between transition-all duration-200",
        scrolled ? "border-border/40 shadow-sm" : "border-border/10"
      )}>
        <div className="flex items-center space-x-4">
          {/* Sidebar menu trigger */}
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] sm:w-[350px] p-0 border-r border-border/20 bg-background">
              <SheetHeader className="sr-only">
                <SheetTitle>
                  <VisuallyHidden>Mobile Navigation</VisuallyHidden>
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col h-full">
                <SheetHeader className="border-b border-border/20 p-4">
                  <div className="flex items-center justify-between">
                    <Link href="/" className="flex items-center space-x-2" onClick={() => setIsSheetOpen(false)}>
                      <Image
                        src="/logo.png"
                        alt="Chatstream Logo"
                        width={120}
                        height={28}
                        className="h-6 w-auto"
                        priority
                      />
                      <span className="text-sm font-medium">charstream.xyz</span>
                    </Link>
                    <SheetClose asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                        <X className="h-4 w-4" />
                      </Button>
                    </SheetClose>
                  </div>
                </SheetHeader>
                
                {/* Upgrade to Chatstream+ button */}
                <div className="px-4 pt-4">
                  <Link href="/pricing" onClick={() => setIsSheetOpen(false)}>
                    <Button 
                      variant="outline" 
                      className="w-full bg-gradient-to-r from-yellow-300 to-yellow-500 hover:from-yellow-600 hover:to-yellow-600 text-black border-none h-11 justify-between group relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0)_25%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0)_75%)] animate-shimmer" />
                      <div className="flex items-center">
                        <Sparkles className="h-4 w-4 mr-2" />
                        <span>Upgrade to Chatstream+</span>
                      </div>
                      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  </Link>
                </div>
                
                <div className="flex-1 overflow-y-auto scrollbar-thin">
                  {/* Main navigation items */}
                  <div className="py-4 px-2">
                    <div className="space-y-1">
                      <SheetClose asChild>
                        <Link href="/">
                          <Button 
                            variant={isActive('/') ? "secondary" : "ghost"}
                            className="w-full justify-start text-base"
                          >
                            <Home className="mr-3 h-5 w-5" />
                            Home
                          </Button>
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link href="/discover">
                          <Button 
                            variant={isActive('/discover') ? "secondary" : "ghost"} 
                            className="w-full justify-start text-base"
                          >
                            <Compass className="mr-3 h-5 w-5" />
                            Discover
                          </Button>
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start text-base"
                          onClick={handleCreateClick}
                        >
                          <PlusCircle className="mr-3 h-5 w-5" />
                          Create Character
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start text-base"
                          onClick={() => setShowSearch(!showSearch)}
                        >
                          <Search className="mr-3 h-5 w-5" />
                          Search
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link href="/wiki">
                          <Button 
                            variant="ghost" 
                            className="w-full justify-start text-base"
                          >
                            <Book className="mr-3 h-5 w-5" />
                            Wiki
                          </Button>
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link href="/ghiblify">
                          <Button 
                            variant={isActive('/ghiblify') ? "secondary" : "ghost"} 
                            className="w-full justify-start text-base"
                          >
                            <Sparkles className="mr-3 h-5 w-5" />
                            Ghiblify Your Images
                          </Button>
                        </Link>
                      </SheetClose>
                    </div>
                    
                    {/* Recent conversations with modern styling */}
                    <div className="mt-6">
                      <div className="flex items-center justify-between px-3 mb-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Recent Chats</h3>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground">
                          See all
                        </Button>
                      </div>
                      <div className="max-h-[250px] overflow-y-auto scrollbar-thin pr-2">
                        <ConversationList isCollapsed={false} />
                      </div>
                    </div>
                    
                    {/* Favorites section */}
                    <div className="mt-6">
                      <div className="flex items-center justify-between px-3 mb-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Favorites</h3>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground">
                          <Star className="h-3.5 w-3.5 mr-1" />
                          Manage
                        </Button>
                      </div>
                      <div className="space-y-1 px-1">
                        {["Harry Potter", "Chota Bheem"].map((name) => (
                          <SheetClose asChild key={name}>
                            <Button 
                              variant="ghost" 
                              className="w-full justify-start text-sm hover:bg-accent/50"
                            >
                              <Avatar className="h-6 w-6 mr-3">
                                <AvatarImage 
                                  src={`/api/avatar?name=${encodeURIComponent(name)}&width=32&height=32&cache=true&t=1`}
                                  alt={name}
                                />
                                <AvatarFallback>{name.substring(0, 2)}</AvatarFallback>
                              </Avatar>
                              <span className="truncate">{name}</span>
                              <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground opacity-60" />
                            </Button>
                          </SheetClose>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* User profile section with clean border */}
                <div className="border-t border-border/20 p-4 mt-auto">
                  {isSignedIn ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <UserButton afterSignOutUrl="/" />
                        <div>
                          <p className="text-sm font-medium">{displayName}</p>
                          <p className="text-xs text-muted-foreground">Personal Account</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <SheetClose asChild>
                      <Button 
                        className="w-full gap-2"
                        onClick={() => setSignupOpen(true)}
                      >
                        <Users className="h-4 w-4" />
                        Sign In
                      </Button>
                    </SheetClose>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
          
          {/* Logo with cleaner layout */}
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="Chatstream Logo"
              width={120}
              height={28}
              className="h-6 w-auto"
              priority
            />
          </Link>
        </div>
        
        {/* Right side actions with improved spacing */}
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={() => setShowSearch(!showSearch)}
          >
            <Search className="h-5 w-5" />
          </Button>
          
          {isSignedIn ? (
            <div className="flex items-center gap-3">
              <Link href="/pricing">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 rounded-full hidden sm:flex items-center gap-1 bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 text-foreground border-purple-200/50"
                >
                  <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                  <span>Upgrade</span>
                </Button>
              </Link>
              <UserButton afterSignOutUrl="/" />
            </div>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() => setSignupOpen(true)}
              className="h-9 px-3 rounded-full"
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
      
      {/* Search overlay with smooth animation */}
      <div className={cn(
        "fixed inset-0 bg-background/95 backdrop-blur-sm z-50 transition-all duration-300 ease-in-out",
        showSearch ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"
      )}>
        <div className="flex flex-col h-full">
          <div className="border-b border-border/20 p-4 flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={() => setShowSearch(false)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <Input
                type="search"
                placeholder="Search characters..."
                className="h-10 bg-background/50 border-border/30 focus-visible:border-primary/30 focus-visible:ring-1 focus-visible:ring-primary/20 rounded-full pl-4"
                autoFocus
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium">Popular Characters</h3>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground">
                View all
              </Button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {["Harry Potter", "Chota Bheem", "Sherlock Holmes", "Iron Man", "Captain America", "Doraemon"].map((name) => (
                <Button
                  key={name}
                  variant="outline"
                  className="flex flex-col items-center justify-center space-y-2 p-4 h-auto bg-card/50 border-border/30 hover:border-border/50 hover:bg-card/80 rounded-xl transition-all"
                  onClick={() => setShowSearch(false)}
                >
                  <Avatar className="h-14 w-14 mb-2">
                    <AvatarImage
                      src={`/api/avatar?name=${encodeURIComponent(name)}&width=56&height=56&cache=true&t=1`}
                      alt={name}
                      className="object-cover"
                    />
                    <AvatarFallback>{name.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium line-clamp-1">{name}</span>
                </Button>
              ))}
            </div>
            
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium">Categories</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {["Fiction", "History", "Science", "Movies", "AI", "Education", "Entertainment"].map((category) => (
                  <Button 
                    key={category} 
                    variant="outline" 
                    className="h-8 px-3 py-1 text-xs rounded-full bg-card/50 border-border/30"
                    onClick={() => setShowSearch(false)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating action button with modern dropShadow */}
      <Button
        onClick={handleCreateClick}
        className="fixed right-4 bottom-20 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 hover:scale-105 hover:shadow-xl z-[100]"
      >
        <PlusCircle className="h-6 w-6" />
      </Button>
      
      {/* Add padding to page content */}
      <div className="h-16 pb-20"></div>
      
      {/* Character creation dialog */}
      <CreateCharacterDialog
        open={isCreateDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </>
  )
}
