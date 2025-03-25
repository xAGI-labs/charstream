"use client"

import { useState, useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu'

// Time durations in milliseconds
const BEER_DURATION = 30 * 60 * 1000 // 30 minutes
const JOINT_DURATION = 60 * 60 * 1000 // 1 hour

interface UnhingedModeToggleProps {
  isUnhinged: boolean
  onUnhingedChange: (value: boolean) => void
  characterName: string
}

export function UnhingedModeToggle({
  isUnhinged,
  onUnhingedChange,
  characterName
}: UnhingedModeToggleProps) {
  const [remainingTime, setRemainingTime] = useState<number | null>(null)
  const [showWarning, setShowWarning] = useState(false)
  const [currentAddon, setCurrentAddon] = useState<'beer' | 'joint' | null>(null)

  // Format the remaining time as mm:ss
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Set up a timer to update the remaining time
  useEffect(() => {
    if (!isUnhinged || !remainingTime) return

    console.log(`Unhinged mode timer started: ${remainingTime}ms remaining`)
    
    const interval = setInterval(() => {
      setRemainingTime(prev => {
        if (!prev || prev <= 1000) {
          clearInterval(interval)
          console.log("Unhinged mode timer expired, resetting to normal mode")
          onUnhingedChange(false)
          setCurrentAddon(null)
          toast(`${characterName} has sobered up!`)
          return null
        }
        
        // Log remaining time every 30 seconds to avoid console spam
        if (prev % 30000 === 0) {
          console.log(`Unhinged mode timer: ${prev/1000} seconds remaining`)
        }
        
        return prev - 1000
      })
    }, 1000)

    return () => {
      console.log("Clearing unhinged mode timer")
      clearInterval(interval)
    }
  }, [isUnhinged, remainingTime, onUnhingedChange, characterName])

  const handleAddonSelect = (type: 'beer' | 'joint') => {
    const duration = type === 'beer' ? BEER_DURATION : JOINT_DURATION
    setRemainingTime(duration)
    setCurrentAddon(type)
    onUnhingedChange(true)
    setShowWarning(false)
    
    toast(`${characterName} ${type === 'beer' ? 'is enjoying a beer' : 'is smoking a joint'}!`, {
      description: `Unhinged mode activated for ${type === 'beer' ? '30 minutes' : '1 hour'}`
    })
  }

  const handleToggleClick = () => {
    if (!isUnhinged) {
      // When toggling on, show warning instead of activating immediately
      setShowWarning(true)
    } else {
      // When toggling off, deactivate immediately
      onUnhingedChange(false)
      setRemainingTime(null)
      setCurrentAddon(null)
    }
  }

  const dismissWarning = () => {
    setShowWarning(false)
  }

  return (
    <div className="flex items-center relative">
      {showWarning && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center mt-16">
          <div className="bg-card p-6 rounded-lg shadow-lg max-w-md w-full mt-40">
            <div className="flex items-center text-amber-500 mb-4">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <h3 className="text-lg font-semibold">Content Warning</h3>
            </div>
            <p className="mb-4">
              Unhinged mode allows {characterName} to use explicit language and express more extreme opinions.
              Content may be inappropriate for some users.
            </p>
            <div className="flex gap-4 mt-6">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default">
                    Give {characterName} something
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center">
                  <DropdownMenuItem onClick={() => handleAddonSelect('beer')}>
                    <img src="/beer.svg" alt="Beer" className="mr-2 h-6 w-6" />
                    <span>Give a Beer (30 min)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAddonSelect('joint')}>
                    <img src="/joint.svg" alt="Joint" className="mr-2 h-6 w-6" />
                    <span>Give a Joint (1 hour)</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button variant="outline" onClick={dismissWarning}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {currentAddon && (
        <div className="mr-3">
          {currentAddon === 'beer' ? (
            <img src="/beer.svg" alt="Beer" className="h-8 w-8 animate-pulse" />
          ) : (
            <img src="/joint.svg" alt="Joint" className="h-8 w-8 animate-pulse" />
          )}
        </div>
      )}

      {remainingTime && isUnhinged && (
        <span className="text-sm bg-amber-300 rounded-full px-3 py-1 text-neutral-950 mr-2">
          {formatTime(remainingTime)}
        </span>
      )}

      <div
        className={cn(
          "relative w-16 h-8 flex items-center rounded-full cursor-pointer transition-colors",
          isUnhinged ? "bg-amber-500" : "bg-neutral-400 dark:bg-muted animate-pulse"
        )}
        onClick={handleToggleClick}
        aria-label="Toggle unhinged mode"
        title="Unleash the wild side of your character!"
      >
        <div
          className={cn(
            "absolute w-6 h-6 bg-white rounded-full shadow-md transition-transform",
            isUnhinged ? "translate-x-9" : "translate-x-1"
          )}
        />
      </div>

      <span className="ml-3 text-sm font-medium">
        {isUnhinged ? "Unhinged" : "Normal"}
      </span>

      {!isUnhinged && (
        <div className="absolute top-16 left-0 bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-md shadow-md animate-bounce hidden sm:block">
          Try Unhinged Mode!
        </div>
      )}

      {isUnhinged && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 ml-1"
          onClick={() => {
            onUnhingedChange(false)
            setRemainingTime(null)
            setCurrentAddon(null)
            toast(`${characterName} has sobered up!`)
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
