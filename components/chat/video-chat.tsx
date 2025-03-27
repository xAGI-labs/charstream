"use client"

import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { ChatMode } from "./chat-mode-switcher"

interface VideoSessionData {
  sessionId: string;
  url: string;
  token: string;
}

interface VideoProps {
  characterId: string;
  disabled: boolean;
  characterName?: string; // Make characterName optional
  characterAvatarUrl?: string | null;
  onModeChange?: (mode: ChatMode) => void; // Add onModeChange prop with proper typing
}

export function VideoChat({
  characterId,
  disabled,
  characterName = "AI Assistant", // Provide default value
  characterAvatarUrl,
  onModeChange
}: VideoProps) {
  const [loading, setLoading] = useState(false)
  const [sessionData, setSessionData] = useState<VideoSessionData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const sessionStarted = useRef(false)

  // Track component mounting status to prevent state updates after unmount
  const isMounted = useRef(true)
  
  // Create video session on component mount
  useEffect(() => {
    console.log("Video chat component mounted")
    
    async function setupVideoSession() {
      if (sessionStarted.current) return
      
      try {
        setLoading(true)
        setError(null)
        sessionStarted.current = true
        
        const response = await fetch('/api/video/start-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ characterId })
        })
        
        if (!response.ok) {
          const text = await response.text()
          throw new Error(`Failed to start video session: ${text}`)
        }
        
        const data = await response.json()
        const roomUrl = data.roomUrl;

        if (!roomUrl) {
          console.error("Room URL is missing in API response");
          throw new Error("Room URL is missing in API response");
        }

        console.log("Video session created with room URL:", roomUrl);

        if (isMounted.current) {
          setSessionData({ sessionId: "simli-session", url: roomUrl, token: "" });
        }
      } catch (err) {
        console.error("Error setting up video session:", err)
        if (isMounted.current) {
          setError(err instanceof Error ? err.message : "Failed to start video chat")
          toast.error("Failed to start video chat", {
            description: "Please try again or switch to text mode"
          })
          
          // If session fails, switch back to text mode
          if (onModeChange) {
            setTimeout(() => onModeChange("text"), 3000);
          }
        }
      } finally {
        if (isMounted.current) {
          setLoading(false)
        }
      }
    }
    
    setupVideoSession()
    
    // Clean up on unmount or mode change
    return () => {
      isMounted.current = false
      
      if (sessionData?.sessionId) {
        // End the session
        console.log("Cleaning up video session:", sessionData.sessionId)
        fetch(`/api/video/end-session/${sessionData.sessionId}`, {
          method: 'DELETE'
        }).catch(err => {
          console.error("Error ending video session:", err)
        })
      }
    }
  }, [characterId, onModeChange])
  
  // Handle video container sizing and visibility
  useEffect(() => {
    if (!containerRef.current) return
    
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        console.log(`Video container size: ${width}x${height}`)
      }
    })
    
    resizeObserver.observe(containerRef.current)
    
    return () => {
      resizeObserver.disconnect()
    }
  }, [])
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p>Starting video chat with {characterName}...</p>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <div className="mb-4 text-destructive">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h3 className="font-semibold text-lg">Video Chat Error</h3>
        <p className="text-muted-foreground mt-2">{error}</p>
        <p className="mt-4">Please try switching to text mode instead.</p>
      </div>
    )
  }
  
  if (!sessionData) {
    console.log("Session data is null, waiting for room URL...");
    return null;
  }

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col items-center justify-center bg-black">
      {sessionData.url && (
        <>
          <p className="text-white mb-2">Room URL: {sessionData.url}</p> {/* Debugging */}
          <iframe
            ref={videoRef}
            src={sessionData.url}
            allow="camera; microphone; fullscreen; speaker; display-capture; autoplay"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            className="w-full h-full border-0"
            style={{ minHeight: "500px" }} // Ensure iframe has sufficient size
            onLoad={() => console.log("Iframe loaded successfully")}
            onError={(e) => console.error("Iframe failed to load", e)}
          ></iframe>
        </>
      )}
    </div>
  );
}
