"use client"

import { cn } from "@/lib/utils"

export function TypingIndicator() {
  return (
    <div className="bg-card/90 px-4 py-2.5 rounded-2xl rounded-tl-none shadow-sm max-w-[85%] sm:max-w-[70%] border border-border/10">
      <div className="flex items-center space-x-2">
        <div className="flex space-x-1.5 items-center">
          <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse" 
               style={{ animationDuration: "1.2s", animationDelay: "0ms" }}></div>
          <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse" 
               style={{ animationDuration: "1.2s", animationDelay: "300ms" }}></div>
          <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse" 
               style={{ animationDuration: "1.2s", animationDelay: "600ms" }}></div>
        </div>
      </div>
    </div>
  )
}
