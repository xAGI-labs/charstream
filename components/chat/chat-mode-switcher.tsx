"use client"

import { useState } from "react"
import { MessageSquare, Mic, Video, Image } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"

export type ChatMode = "text" | "voice" | "video" | "image"

interface ChatModeSwitcherProps {
  mode: ChatMode
  setMode: (mode: ChatMode) => void
}

// Define proper type for mode items
interface ModeItem {
  id: ChatMode
  label: string
  icon: LucideIcon
  available: boolean
  comingSoon?: boolean
}

export function ChatModeSwitcher({ mode, setMode }: ChatModeSwitcherProps) {
  const modes: ModeItem[] = [
    {
      id: "text",
      label: "Text",
      icon: MessageSquare,
      available: true
    },
    {
      id: "voice",
      label: "Voice",
      icon: Mic,
      available: true  // We're enabling voice mode
    },
    {
      id: "video",
      label: "Video",
      icon: Video,
      available: false,
      comingSoon: true
    }
  ]

  const handleModeChange = (newMode: ChatMode) => {
    setMode(newMode)
  }

  return (
    <div className="flex justify-center sticky top-0 z-10 py-2 bg-background/80 backdrop-blur-sm">
      <div className="inline-flex rounded-lg bg-muted/40 p-1 shadow-sm">
        {modes.map((item) => {
          const isActive = mode === item.id
          const isDisabled = !item.available
          const isComingSoon = item.comingSoon
          
          return (
            <button
              key={item.id}
              className={cn(
                "relative flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-all",
                "rounded-md",
                isDisabled ? "opacity-50 cursor-not-allowed" : "hover:text-foreground",
                isActive && !isDisabled 
                  ? "text-foreground" 
                  : "text-muted-foreground",
                isComingSoon && "hover:text-foreground"
              )}
              onClick={() => !isDisabled && handleModeChange(item.id)}
              disabled={isDisabled}
            >
              {isActive && !isDisabled && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 bg-background rounded-md border shadow-sm"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative flex items-center gap-1.5">
                <item.icon className="h-4 w-4" />
                {item.label}
                {item.comingSoon && (
                  <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded-full leading-none">
                    Soon
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
