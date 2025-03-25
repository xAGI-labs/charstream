"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Mic, PhoneOff, Volume2, MicOff, Square, Send, Bug, Repeat } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface FullscreenVoiceCallProps {
  isActive: boolean;
  characterName?: string;
  characterAvatarUrl?: string | null;
  isRecording: boolean;
  isProcessing: boolean;
  isResponding: boolean;
  isMuted: boolean;
  recordingTime: number;
  userMessage?: string;
  aiMessage?: string;
  onMuteToggle: () => void;
  onEndCall: () => void; 
  onInterrupt: () => void;
  onStopRecording: () => void;
  onStartRecording: () => void;
  autoListen?: boolean; // Add this prop
  onAutoListenToggle?: () => void; // Add this handler
}

export function FullscreenVoiceCall({
  isActive,
  characterName = "AI Assistant",
  characterAvatarUrl,
  isRecording,
  isProcessing,
  isResponding,
  isMuted,
  recordingTime,
  userMessage,
  aiMessage,
  onMuteToggle,
  onEndCall,
  onInterrupt,
  onStopRecording,
  onStartRecording,
  autoListen = false, // Default to false
  onAutoListenToggle
}: FullscreenVoiceCallProps) {
  // Add state to track image loading errors
  const [imgError, setImgError] = useState(false);
  const [lastClicked, setLastClicked] = useState<string>('none');
  const [clickCount, setClickCount] = useState(0);
  
  // Add refs to buttons for direct access
  const actionButtonRef = useRef<HTMLButtonElement>(null);
  
  // Reset image error state when the avatar URL changes
  useEffect(() => {
    setImgError(false);
  }, [characterAvatarUrl]);
  
  // Format recording time as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Add direct button press tracking
  useEffect(() => {
    console.log(`Button clicked: ${lastClicked} (${clickCount} times)`);
  }, [lastClicked, clickCount]);

  // Add debug logs to monitor component re-renders
  useEffect(() => {
    console.log("FullscreenVoiceCall state:", {
      isRecording,
      isProcessing,
      isResponding,
      isMuted
    });
  }, [isRecording, isProcessing, isResponding, isMuted]);

  // Create direct handlers that bypass all checks
  const directStartRecording = () => {
    console.log("🎯 DIRECT START RECORDING");
    setLastClicked('start');
    setClickCount(prev => prev + 1);
    onStartRecording();
  };

  const directStopRecording = () => {
    console.log("🎯 DIRECT STOP RECORDING");
    setLastClicked('stop');
    setClickCount(prev => prev + 1);
    onStopRecording();
  };

  const directInterrupt = () => {
    console.log("🎯 DIRECT INTERRUPT");
    setLastClicked('interrupt');
    setClickCount(prev => prev + 1);
    onInterrupt();
  };

  // Don't render if not active
  if (!isActive) {
    return null;
  }

  // Helper function to validate image URL
  const isValidImageUrl = (url?: string | null): boolean => {
    return !!url && 
           typeof url === 'string' && 
           (url.startsWith('http://') || 
            url.startsWith('https://') || 
            url.startsWith('/'));
  };

  // Add test button to directly trigger processAudio in dev mode
  const isDevMode = process.env.NODE_ENV === 'development';

  return (
    <div className="w-full h-full flex flex-col items-center justify-center py-10 px-4">
      {/* Character Avatar and Info */}
      <div className="mb-8 flex flex-col items-center">
        <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-primary/20 mb-3">
          {isValidImageUrl(characterAvatarUrl) && !imgError ? (
            <Image 
              src={characterAvatarUrl!}
              alt={characterName}
              fill
              className="object-cover"
              onError={() => {
                console.log("Avatar image failed to load, using fallback");
                setImgError(true);
              }}
              priority 
            />
          ) : (
            <div className="bg-primary/20 h-full w-full flex items-center justify-center">
              <span className="font-semibold text-2xl text-primary">{characterName[0] || 'A'}</span>
            </div>
          )}
        </div>
        <h3 className="text-xl font-semibold mb-1">{characterName}</h3>
        
        {/* Status indicator */}
        <div className="flex items-center text-sm text-muted-foreground">
          <span className={`inline-block h-2 w-2 rounded-full mr-2 ${isRecording ? "bg-red-500 animate-pulse" : isProcessing ? "bg-yellow-500" : isResponding ? "bg-blue-500" : "bg-green-500"}`}></span>
          <span>{isRecording ? "Listening..." : isProcessing ? "Processing..." : isResponding ? "Speaking..." : "Ready"}</span>
        </div>
      </div>
      
      {/* Live Transcript Area */}
      <div className="w-full max-w-2xl mb-10">
        <div className="bg-card/60 rounded-lg p-6 shadow-sm">
          <div className="flex flex-col gap-4">
            {userMessage && (
              <div className="flex items-start">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-sm font-semibold text-white">You</span>
                </div>
                <div className="bg-muted p-3 rounded-lg flex-1">
                  {userMessage}
                </div>
              </div>
            )}
            
            {aiMessage && (
              <div className="flex items-start">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-sm font-semibold">{characterName[0]}</span>
                </div>
                <div className="bg-primary/10 p-3 rounded-lg flex-1">
                  {aiMessage}
                </div>
              </div>
            )}
            
            {!userMessage && !aiMessage && (
              <p className="text-center text-muted-foreground">Your conversation will appear here</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Call Controls */}
      <div className="flex items-center justify-center gap-4 z-50">
        {/* Mute Button */}
        <Button
          onClick={() => {
            console.log("Mute toggle clicked, current state:", isMuted);
            onMuteToggle();
            setLastClicked('mute');
            setClickCount(prev => prev + 1);
          }}
          variant={isMuted ? "destructive" : "outline"}
          size="icon"
          className="rounded-full h-14 w-14"
          disabled={isProcessing}
        >
          {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </Button>
        
        <div className="relative">
          {isRecording && (
            <div className="absolute inset-0 -m-1 rounded-full animate-ping bg-red-500/20 z-0"></div>
          )}
          
          <Button
            ref={actionButtonRef}
            onClick={() => {
              console.log("🔴 MAIN BUTTON CLICKED - Current state:", 
                isRecording ? "RECORDING" : isResponding ? "RESPONDING" : "READY");
              
              if (isRecording) {
                directStopRecording();
              } else if (isResponding) {
                directInterrupt();
              } else {
                directStartRecording();
              }
            }}
            variant={isRecording ? "destructive" : (isResponding ? "secondary" : "default")}
            disabled={false}
            size="icon"
            className={cn(
              "rounded-full h-16 w-16 z-10 relative border-2",
              isRecording ? "bg-red-500 hover:bg-red-600 border-red-200" : 
              isResponding ? "bg-blue-500 hover:bg-blue-600 border-blue-200" : 
              "bg-green-500 hover:bg-green-600 border-green-200",
            )}
            data-state={isRecording ? "recording" : isResponding ? "responding" : "ready"}
            data-testid="voice-action-button"
          >
            {/* Make icon selection explicit and clear */}
            {isRecording === true ? (
              <Square className="h-8 w-8 text-white" />
            ) : isResponding === true ? (
              <Volume2 className="h-8 w-8 text-white" />
            ) : (
              <Mic className="h-8 w-8 text-white" />
            )}
          </Button>
          
          {isRecording && (
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-sm font-medium text-red-500">
              {formatTime(recordingTime)}
            </div>
          )}
        </div>
        
        {/* End Call Button */}
        <Button
          onClick={() => {
            console.log("End call button clicked");
            onEndCall();
            setLastClicked('end');
            setClickCount(prev => prev + 1);
          }}
          variant="destructive"
          size="icon"
          className="rounded-full h-14 w-14"
        >
          <PhoneOff className="h-6 w-6" />
        </Button>
      </div>
      
      {/* Auto-listen toggle button */}
      {onAutoListenToggle && (
        <Button
          onClick={() => {
            onAutoListenToggle();
            setLastClicked('autoListen');
            setClickCount(prev => prev + 1);
          }}
          variant="outline"
          size="sm"
          className="mt-4 gap-2"
        >
          <Repeat className={cn("h-4 w-4", autoListen ? "text-primary" : "text-muted-foreground")} />
          <span>{autoListen ? "Auto-Listening On" : "Auto-Listening Off"}</span>
        </Button>
      )}
            
    </div>
  )
}
