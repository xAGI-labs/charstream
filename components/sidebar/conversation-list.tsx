"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { MessageCircle } from "lucide-react"
import { usePathname } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface Conversation {
  id: string;
  title: string;
  character: {
    name: string;
    imageUrl?: string;
  };
  updatedAt: string;
}

interface ConversationListProps {
  isCollapsed?: boolean;
}

export function ConversationList({ isCollapsed = false }: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const { userId } = useAuth()
  const pathname = usePathname()

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  useEffect(() => {
    const fetchConversations = async () => {
      if (!userId) return

      try {
        const response = await fetch('/api/conversations')
        
        if (!response.ok) {
          throw new Error('Failed to fetch conversations')
        }
        
        const data = await response.json()
        setConversations(data)
      } catch (error) {
        console.error('Error fetching conversations:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      fetchConversations()
    } else {
      setIsLoading(false)
    }
  }, [userId])

  if (isLoading) {
    return (
      <div className="py-2 px-3 space-y-2">
        {Array(3).fill(0).map((_, i) => (
          <div key={i} className={cn(
            "flex items-center gap-2 rounded-md p-2 h-9",
            isCollapsed ? "justify-center px-0" : "px-2",
            isMobile && "py-3"
          )}>
            <Skeleton className={cn("h-5 w-5 rounded-full", isMobile && "h-7 w-7")} />
            {!isCollapsed && <Skeleton className="h-4 w-full" />}
          </div>
        ))}
      </div>
    )
  }
  
  if (conversations.length === 0) {
    return (
      <div className={cn(
        "py-2",
        isCollapsed ? "px-1" : "px-3"
      )}>
        {!isCollapsed && (
          <div className="px-2 py-3 text-xs text-center text-muted-foreground/70 bg-muted/20 rounded-md">
            No conversations yet. Start chatting with a character!
          </div>
        )}
      </div>
    )
  }
  
  return (
    <div className={cn(
      "py-2",
      isCollapsed ? "px-1" : "px-3"
    )}>
      <TooltipProvider delayDuration={300}>
        {conversations.slice(0, 6).map((conversation) => {
          const isActive = pathname === `/chat/${conversation.id}`
          
          // Use the imageUrl directly
          const imageUrl = conversation.character.imageUrl || 
            `https://robohash.org/${encodeURIComponent(conversation.character.name)}?size=40x40&set=set4`;
          
          return (
            <Link
              key={conversation.id}
              href={`/chat/${conversation.id}`}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-2 mb-1 transition-all",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
              title={conversation.character.name} // Remove "Conversation With" prefix
            >
              <Avatar className="h-6 w-6 flex-shrink-0">
                <AvatarImage src={imageUrl} alt={conversation.character.name} />
                <AvatarFallback className="text-[10px]">
                  {conversation.character.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <span className="truncate text-sm">
                  {conversation.character.name} {/* Display only the character's name */}
                </span>
              )}
            </Link>
          )
        })}
      </TooltipProvider>
    </div>
  )
}
