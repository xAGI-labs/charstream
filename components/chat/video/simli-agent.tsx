"use client"

import { useState, useEffect, useCallback } from "react"
import { VideoBox } from "./video-box"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Loader2, X } from "lucide-react"

interface SimliAgentProps {
  characterId: string
  characterName: string
  onClose: () => void
}

export function SimliAgent({ characterId, characterName, onClose }: SimliAgentProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [streamUrl, setStreamUrl] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  
  const startVideoSession = useCallback(async () => {
    if (characterName !== "Harry Potter") {
      toast.error("Video mode is only available for Harry Potter")
      onClose()
      return
    }
    
    setIsLoading(true)
    
    try {
      // Hard-coded Harry Potter session for now
      // In production, this would be a proper API call with authentication
      const response = await fetch("https://api.simli.ai/session/1b250748-fbee-470f-9db1-af01fe567c79/gAAAAABn4_OHIv4eIgTr1r71hXqQdgTfnHX99Na6aIizP-wKIds0juXhDwU2c7nfjvoWQQraNDHEjRbl8PwyEPCR_JGE_PrHOsVD2K348OIZp1K-h2tKmptmsdpDTRSkdnBAMvppJjfTqGpRANQqkpepFKz-bXi2wZVxCxQh5T2NwNFrOWYccBwkb4l37he2xwSacWDEr2-h60G8zUAUmBhYydBWFw6_j8e7LHls_IV6zKjomF4zMnL4_HGHcq0D4ggijRP0fwLM8ngJyZr2RFK0Pj8hSwqlNTjLys7pW8iuYelKgK4pr5YoyhAklFl7sPZwHreXFgaQNuxbkIAOMMjATHt9B6QGJOM59loR2YVkSSfbpeYzv6lx95gnh7kCi8j99C2tlWKYasnfLM8EaD5R0CcHbnF22g==", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    })
    
    const data = await response.json();
    const roomUrl = data.roomUrl;
      setStreamUrl(data.streamUrl)
      setSessionId(data.sessionId)
      
    } catch (error) {
      console.error("Error starting video session:", error)
      toast.error("Failed to start video session", {
        description: "Please try again or switch to text mode"
      })
      onClose()
    } finally {
      setIsLoading(false)
    }
  }, [characterId, characterName, onClose])
  
  const endVideoSession = useCallback(async () => {
    if (!sessionId) return
    
    try {
      await fetch(`/api/video/end-session/${sessionId}`, {
        method: "DELETE"
      })
      setStreamUrl(null)
      setSessionId(null)
    } catch (error) {
      console.error("Error ending video session:", error)
    }
    
    onClose()
  }, [sessionId, onClose])
  
  // Start session on mount
  useEffect(() => {
    startVideoSession()
    
    // Clean up on unmount
    return () => {
      if (sessionId) {
        endVideoSession()
      }
    }
  }, [startVideoSession, endVideoSession, sessionId])
  
  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-96 w-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Connecting to video stream...</p>
        </div>
      ) : streamUrl ? (
        <div className="w-full">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-lg font-medium">Video Chat with {characterName}</h3>
            <Button variant="ghost" size="icon" onClick={endVideoSession}>
              <X className="h-4 w-4" />
              <span className="sr-only">Close video chat</span>
            </Button>
          </div>
          <VideoBox 
            streamUrl={streamUrl} 
            className="h-[350px] w-full rounded-lg shadow-lg"
          />
          <div className="mt-4 flex justify-center">
            <Button 
              variant="destructive" 
              onClick={endVideoSession}
              className="px-8"
            >
              End Video Chat
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
