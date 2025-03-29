"use client"

import Image from "next/image"
import { useState, useEffect } from 'react'
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Info, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { UnhingedModeToggle } from "./unhinged-mode-toggle"
import { AlertDialog, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils"

interface ChatHeaderProps {
  character?: {
    name: string;
    imageUrl?: string | null;
    id?: string;
  };
  title?: string;
  loading?: boolean;
  isUnhinged?: boolean;
  onUnhingedChange?: (value: boolean) => void;
  onDeleteChat: () => Promise<void>;
}

export function ChatHeader({ 
  character, 
  title, 
  loading = false,
  isUnhinged = false,
  onUnhingedChange,
  onDeleteChat
}: ChatHeaderProps) {
  const [imgError, setImgError] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();
  
  useEffect(() => {
    if (character) setImgError(false);
  }, [character?.imageUrl]);
  
  const avatarUrl = !imgError && character?.imageUrl ? character.imageUrl : null;
  const displayName = character?.name || (loading ? "Loading..." : "AI Assistant");

  // Fix the event type to match what onSelect expects (standard Event)
  const handleUnhingedToggle = () => {
    if (onUnhingedChange) {
      onUnhingedChange(!isUnhinged);
    }
  };

  // Fix the event type to match what onSelect expects (standard Event)
  const handleDeleteClick = () => {
    setIsAlertOpen(true);
    setDropdownOpen(false);
  };

  return (
    <header className="flex items-center justify-between p-2 sm:p-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky top-0 z-10 h-14 sm:h-16">
      <div className="flex items-center overflow-hidden">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2 h-8 w-8 flex-shrink-0"
          onClick={() => router.push('/')}
          aria-label="Back to home"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        
        {loading ? (
          <div className="flex items-center space-x-2 sm:space-x-3 overflow-hidden">
            <Skeleton className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex-shrink-0" />
            <div className="flex flex-col gap-1.5 min-w-0">
              <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
              <Skeleton className="h-2 sm:h-3 w-24 sm:w-32" />
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 overflow-hidden">
            <div className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-background shadow-sm">
              {avatarUrl ? (
                <>
                  <Image 
                    src={avatarUrl} 
                    alt={displayName} 
                    fill
                    className="object-cover"
                    onError={() => setImgError(true)}
                    unoptimized
                    priority
                  />
                  {imgError && (
                    <div className="bg-primary/20 h-full w-full flex items-center justify-center">
                      <span className="font-semibold text-primary text-xs sm:text-sm">{displayName[0] || '?'}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-primary/20 h-full w-full flex items-center justify-center">
                  <span className="font-semibold text-primary text-xs sm:text-sm">{displayName[0] || '?'}</span>
                </div>
              )}
              <div className="absolute bottom-0 right-0 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-500 rounded-full border-[1.5px] sm:border-2 border-background"></div>
            </div>
            <div className="min-w-0 overflow-hidden">
              <div className="flex items-center">
                <h3 className="font-semibold text-xs sm:text-sm truncate">
                  {displayName}
                </h3>
                <div className="bg-green-500/20 text-green-600 text-[10px] sm:text-xs rounded-full px-1 sm:px-1.5 py-0.5 ml-1 sm:ml-2 whitespace-nowrap flex-shrink-0">
                  Online
                </div>
              </div>
              {title && (
                <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1 truncate max-w-[150px] sm:max-w-none">
                  {title}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-1 sm:gap-2">
        {!loading && character?.name && (
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "gap-1.5 px-1.5 sm:px-3 h-8", 
              "text-xs sm:text-sm"
            )}
            onClick={() => {
              const wikiParam = character.id 
                ? character.id 
                : encodeURIComponent(character.name);
                
              const wikiUrl = character.id 
                ? `/wiki/${wikiParam}`
                : `/wiki/by-name/${wikiParam}`;
                
              window.open(wikiUrl, '_blank');
            }}
          >
            <Info className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Wiki</span>
          </Button>
        )}
        
        {!loading && onUnhingedChange && character && (
          <div className="hidden sm:block">
            <UnhingedModeToggle 
              isUnhinged={isUnhinged} 
              onUnhingedChange={onUnhingedChange}
              characterName={character.name}
            />
          </div>
        )}
        
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!loading && onUnhingedChange && character && (
              <DropdownMenuItem 
                className="sm:hidden flex items-center justify-between"
                onSelect={handleUnhingedToggle}
              >
                <span>Unhinged Mode</span>
                <div className={cn(
                  "ml-2 rounded-full w-3 h-3",
                  isUnhinged ? "bg-red-500" : "bg-gray-300"
                )}/>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem 
              className="text-red-500 hover:text-red-700"
              onSelect={handleDeleteClick}
            >
              Delete Chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent className="max-w-xs sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Chat</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this chat? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel onClick={() => setIsAlertOpen(false)}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={async () => {
                  await onDeleteChat();
                  setIsAlertOpen(false);
                }}
                className="bg-red-500 text-white hover:bg-red-600 sm:ml-2"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </header>
  )
}
