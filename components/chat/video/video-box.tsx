"use client"

import { useRef, useEffect, useState } from "react"
import Image from "next/image"

interface VideoBoxProps {
  streamUrl: string
  className?: string
}

export function VideoBox({ streamUrl, className = "" }: VideoBoxProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [error, setError] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const videoElement = videoRef.current
    if (!videoElement) return

    const handleCanPlay = () => {
      setLoading(false)
    }

    const handleError = (e: ErrorEvent) => {
      console.error("Video error:", e)
      setError(true)
      setLoading(false)
    }

    videoElement.addEventListener("canplay", handleCanPlay)
    videoElement.addEventListener("error", handleError as EventListener)

    // Clean up
    return () => {
      videoElement.removeEventListener("canplay", handleCanPlay)
      videoElement.removeEventListener("error", handleError as EventListener)
    }
  }, [])

  // Handle stream URL change
  useEffect(() => {
    if (!videoRef.current) return
    if (streamUrl) {
      videoRef.current.src = streamUrl
      videoRef.current.play().catch(err => {
        console.error("Failed to play video:", err)
        setError(true)
      })
    }
  }, [streamUrl])

  if (error) {
    return (
      <div className={`bg-muted flex items-center justify-center rounded-lg ${className}`}>
        <div className="text-center p-4">
          <p className="text-muted-foreground">Failed to load video stream</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading video stream...</p>
          </div>
        </div>
      )}
      <video 
        ref={videoRef} 
        className="w-full h-full object-cover"
        autoPlay 
        playsInline
      />
    </div>
  )
}
