"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface AudioWaveformProps {
  className?: string;
  isActive?: boolean;
}

export function AudioWaveform({ className, isActive = false }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationRef = useRef<number>(0)
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Set the canvas dimensions
    const dpr = window.devicePixelRatio || 1
    canvas.width = canvas.offsetWidth * dpr
    canvas.height = canvas.offsetHeight * dpr
    ctx.scale(dpr, dpr)
    
    const width = canvas.offsetWidth
    const height = canvas.offsetHeight
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(width, height) / 2.2
    const waveCount = 3
    const waveWidth = radius * 0.08
    const waves: { radius: number; opacity: number }[] = []
    
    // Initialize waves
    for (let i = 0; i < waveCount; i++) {
      waves.push({ 
        radius: radius - (i * waveWidth), 
        opacity: 1 - (i * 0.2) 
      })
    }
    
    // Create gradient for circle and waves
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.8)') // Indigo
    gradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.8)') // Purple
    gradient.addColorStop(1, 'rgba(236, 72, 153, 0.8)') // Pink
    
    // Animation function
    const animate = () => {
      ctx.clearRect(0, 0, width, height)
      
      // Draw main center circle with gradient first (behind waves)
      ctx.beginPath()
      ctx.fillStyle = gradient
      ctx.globalAlpha = 0.9
      ctx.arc(centerX, centerY, radius - (waveCount * waveWidth) - 2, 0, Math.PI * 2)
      ctx.fill()
      
      // Now draw the animated waves on top
      waves.forEach((wave, index) => {
        ctx.beginPath()
        ctx.strokeStyle = gradient
        ctx.lineWidth = waveWidth
        ctx.globalAlpha = wave.opacity * (isActive ? 0.9 : 0.5) // Dim when not speaking
        
        // Draw wavy circle
        const segments = 80
        const angleStep = (Math.PI * 2) / segments
        const time = Date.now() / 1000
        const baseFrequency = isActive ? 8 : 4 // Higher frequency when active
        const baseAmplitude = isActive ? 4 : 1.5 // Larger amplitude when active
        
        // Calculate frequency and amplitude based on the wave index
        const frequency = baseFrequency - (index * 0.5) 
        const amplitude = baseAmplitude * (1 - (index * 0.2))
        
        for (let i = 0; i <= segments; i++) {
          const angle = i * angleStep
          const waveOffset = Math.sin(angle * frequency + time * (isActive ? 3 : 1) + index) * amplitude
          const waveRadius = wave.radius + waveOffset
          
          const x = centerX + waveRadius * Math.cos(angle)
          const y = centerY + waveRadius * Math.sin(angle)
          
          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }
        
        ctx.closePath()
        ctx.stroke()
      })
      
      // Draw subtle glow when active
      if (isActive) {
        // Create radial gradient for glow effect
        const glowGradient = ctx.createRadialGradient(
          centerX, centerY, radius * 0.5,
          centerX, centerY, radius * 1.2
        )
        glowGradient.addColorStop(0, 'rgba(168, 85, 247, 0.1)')
        glowGradient.addColorStop(1, 'rgba(168, 85, 247, 0)')
        
        ctx.beginPath()
        ctx.fillStyle = glowGradient
        ctx.arc(centerX, centerY, radius * 1.2, 0, Math.PI * 2)
        ctx.fill()
      }
      
      animationRef.current = requestAnimationFrame(animate)
    }
    
    // Start animation
    animate()
    
    // Cleanup
    return () => {
      cancelAnimationFrame(animationRef.current)
    }
  }, [isActive]) // Re-run when isActive changes
  
  return (
    <canvas 
      ref={canvasRef} 
      className={cn("w-full h-full rounded-full", className)}
    />
  )
}
