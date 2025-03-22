"use client"

import Image from "next/image"
import { useState, useEffect } from 'react'
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, MoreVertical, Info, Settings, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { UnhingedModeToggle } from "./unhinged-mode-toggle"

interface ChatHeaderProps {
  character?: {
    name: string;
    imageUrl?: string | null;
    id?: string;
  };
  title?: string;
  loading?: boolean; // Keep this as boolean | undefined only
  isUnhinged?: boolean;
  onUnhingedChange?: (value: boolean) => void;
}

export function ChatHeader({ 
  character, 
  title, 
  loading = false,
  isUnhinged = false,
  onUnhingedChange
}: ChatHeaderProps) {
  const [imgError, setImgError] = useState(false);
  const router = useRouter();
  
  // Add debug logging to see what's coming in
  useEffect(() => {
    console.log("ChatHeader - Props:", { 
      characterExists: !!character,
      characterName: character?.name, 
      hasImageUrl: !!character?.imageUrl,
      imageUrlType: character?.imageUrl ? 
        (character.imageUrl.includes('cloudinary') ? 'cloudinary' : 
         character.imageUrl.includes('together') ? 'together' : 'other') : 'none',
      imageUrl: character?.imageUrl?.substring(0, 50),
      title, 
      loading 
    });
  }, [character, title, loading]);
  
  // Reset error state when character changes
  useEffect(() => {
    if (character) setImgError(false);
  }, [character?.imageUrl]);
  
  // Use the character's image URL if available - handle null value
  const avatarUrl = !imgError && character?.imageUrl ? character.imageUrl : null;
  
  // Determine character display name with better fallback handling
  const displayName = character?.name || 
    (loading ? "Loading..." : "AI Assistant");

  return (
    <header className="flex items-center justify-between p-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky top-0 z-10 h-16">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2 md:mr-3 h-8 w-8"
          onClick={() => router.push('/')}
          aria-label="Back to home"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        
        {loading ? (
          <div className="flex items-center space-x-3">
            <Skeleton className="w-9 h-9 rounded-full" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <div className="relative h-9 w-9 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-background shadow-sm">
              {avatarUrl ? (
                <Image 
                  src={avatarUrl} 
                  alt={displayName} 
                  fill
                  className="object-cover"
                  onError={(e) => {
                    console.error(`Header image error for ${displayName}:`, e);
                    setImgError(true);
                  }}
                  unoptimized // Add this to avoid Next.js image optimization issues with Cloudinary
                  priority
                />
              ) : (
                <div className="bg-primary/20 h-full w-full flex items-center justify-center">
                  <span className="font-semibold text-primary">{displayName[0] || '?'}</span>
                </div>
              )}
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background"></div>
            </div>
            <div>
              <div className="flex items-center">
                <h3 className="font-semibold text-sm">
                  {displayName}
                </h3>
                <div className="bg-green-500/20 text-green-600 text-xs px-1.5 py-0.5 rounded ml-2">
                  Online
                </div>
              </div>
              {title && <p className="text-xs text-muted-foreground line-clamp-1">{title}</p>}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        {!loading && onUnhingedChange && character && (
          <UnhingedModeToggle 
            isUnhinged={isUnhinged} 
            onUnhingedChange={(newValue) => {
              console.log(`Setting unhinged mode to: ${newValue}`);
              onUnhingedChange(newValue);
            }}
            characterName={character.name}
          />
        )}
        
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
