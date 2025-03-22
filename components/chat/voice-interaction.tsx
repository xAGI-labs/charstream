"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Mic, Loader2, Volume2 } from "lucide-react"
import { AudioWaveform } from "./audio-waveform"

interface VoiceInteractionProps {
  isRecording: boolean;
  isProcessing: boolean;
  isResponding: boolean;
  recordingTime: number;
  characterName?: string;
  lastUserMessage?: string;
  lastAIMessage?: string;
}

export function VoiceInteraction({
  isRecording,
  isProcessing,
  isResponding,
  recordingTime,
  characterName = "AI",
  lastUserMessage,
  lastAIMessage
}: VoiceInteractionProps) {
  // Format recording time as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <div className="bg-background/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg max-w-md w-full">
        <AnimatePresence mode="wait">
          {isRecording && (
            <motion.div 
              key="recording"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center text-center"
            >
              <div className="relative h-24 w-24 mb-4">
                <div className="absolute inset-0 flex items-center justify-center">
                  <AudioWaveform className="w-full h-full" isActive={true} />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-red-500 h-14 w-14 rounded-full flex items-center justify-center">
                    <Mic className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
              <div className="text-xl font-semibold mb-2 text-red-500">
                {formatTime(recordingTime)}
              </div>
              <p className="text-muted-foreground mb-4">Recording your message...</p>
              {lastUserMessage && (
                <div className="mt-4 text-sm opacity-75 max-w-xs overflow-hidden text-ellipsis">
                  "{lastUserMessage}"
                </div>
              )}
            </motion.div>
          )}
          
          {isProcessing && (
            <motion.div 
              key="processing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center text-center"
            >
              <div className="h-24 w-24 mb-4 flex items-center justify-center">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
              </div>
              <div className="text-xl font-semibold mb-2">
                Processing
              </div>
              <p className="text-muted-foreground">Converting your voice to text...</p>
            </motion.div>
          )}
          
          {isResponding && (
            <motion.div 
              key="responding"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center text-center"
            >
              <div className="relative h-24 w-24 mb-4">
                <div className="absolute inset-0 flex items-center justify-center">
                  <AudioWaveform className="w-full h-full" isActive={true} />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-primary h-14 w-14 rounded-full flex items-center justify-center">
                    <Volume2 className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
              <div className="text-xl font-semibold mb-2">
                {characterName} is speaking
              </div>
              {lastAIMessage && (
                <div className="mt-4 text-sm opacity-75 max-w-xs overflow-hidden text-ellipsis">
                  "{lastAIMessage}"
                </div>
              )}
            </motion.div>
          )}
          
          {!isRecording && !isProcessing && !isResponding && (
            <motion.div 
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center text-center"
            >
              <div className="h-24 w-24 mb-4 flex items-center justify-center">
                <Mic className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="text-xl font-semibold mb-2">
                Voice Chat
              </div>
              <p className="text-muted-foreground">Press the microphone button to start speaking</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
