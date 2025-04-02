"use client"

import { useRef, useState, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import { Html } from "@react-three/drei"
import { useRouter } from "next/navigation"
import { Character } from "@/types/character"
import * as THREE from "three"
import { useSpring, animated } from "@react-spring/three"

interface CharacterModelProps {
  character: Character
  position: [number, number, number]
  moveRadius?: number // How far the character can wander from its starting position
  moveSpeed?: number // How fast the character moves
}

export function CharacterModel({ 
  character, 
  position, 
  moveRadius = 2,
  moveSpeed = 0.5
}: CharacterModelProps) {
  const router = useRouter()
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const [clicked, setClicked] = useState(false)
  const [isMoving, setIsMoving] = useState(false)
  const [walkCycle, setWalkCycle] = useState(Math.random() * Math.PI * 2) // Randomize starting phase
  
  // Store original position and movement target
  const originalPos = useRef<THREE.Vector3>(new THREE.Vector3(...position))
  const targetPos = useRef<THREE.Vector3>(new THREE.Vector3(...position))
  const movementAngle = useRef<number>(Math.random() * Math.PI * 2)
  const nextMoveTime = useRef<number>(0)
  const idleTime = useRef<number>(0)
  const avoidanceVector = useRef<THREE.Vector3>(new THREE.Vector3())
  
  // Spring animation for hover effect
  const { scale } = useSpring({
    scale: hovered ? 1.1 : 1,
    config: { tension: 300, friction: 10 }
  })
  
  // Generate a consistent color based on character name
  const getColorFromName = (name: string) => {
    const hash = name.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc)
    }, 0)
    
    const hue = Math.abs(hash % 360)
    return `hsl(${hue}, 70%, 60%)`
  }
  
  const bodyColor = getColorFromName(character.name)
  
  // Character personality traits (derived from name hash)
  const personalityTraits = useRef({
    nervousness: (character.name.charCodeAt(0) % 10) / 10, // 0-1 scale
    speed: moveSpeed * (0.8 + (character.name.charCodeAt(0) % 5) / 10), // Slightly vary speed
    pauseFrequency: 0.3 + (character.name.charCodeAt(0) % 5) / 10, // How often they pause
  })
  
  // Determine new random target position for character movement
  const pickNewTarget = (time: number, shouldIdle: boolean = false) => {
    if (!groupRef.current) return
    
    // Chance to idle based on personality
    if (shouldIdle || Math.random() < personalityTraits.current.pauseFrequency) {
      setIsMoving(false)
      idleTime.current = time + 1 + Math.random() * 3 // Idle for 1-4 seconds
      nextMoveTime.current = idleTime.current // Next movement after idle
      return
    }
    
    setIsMoving(true)
    // Set next movement time - more nervous characters change direction more often
    const moveDuration = 3 + (1 - personalityTraits.current.nervousness) * 5
    nextMoveTime.current = time + moveDuration // Move for 3-8 seconds
    
    // Randomize the movement angle with slight bias toward original position if far away
    const currentPos = groupRef.current.position
    const distanceFromOrigin = new THREE.Vector2(
      currentPos.x - originalPos.current.x,
      currentPos.z - originalPos.current.z
    ).length()
    
    // If too far from origin, bias movement back toward it
    let angleToOrigin = Math.atan2(
      originalPos.current.z - currentPos.z,
      originalPos.current.x - currentPos.x
    )
    
    // Mix between random angle and origin angle based on distance
    const returnBias = Math.min(1, distanceFromOrigin / (moveRadius * 1.2))
    const randomAngle = Math.random() * Math.PI * 2
    movementAngle.current = randomAngle * (1 - returnBias) + angleToOrigin * returnBias
    
    // Add some randomness
    movementAngle.current += (Math.random() - 0.5) * Math.PI / 4
    
    // Calculate new target position
    const randomDistance = (0.5 + Math.random() * 0.5) * moveRadius
    let newX = currentPos.x + Math.cos(movementAngle.current) * randomDistance
    let newZ = currentPos.z + Math.sin(movementAngle.current) * randomDistance
    
    // Ensure character doesn't wander too far
    const distanceLimit = moveRadius * 1.5
    const dx = newX - originalPos.current.x
    const dz = newZ - originalPos.current.z
    const distFromOrigin = Math.sqrt(dx*dx + dz*dz)
    
    if (distFromOrigin > distanceLimit) {
      const scale = distanceLimit / distFromOrigin
      newX = originalPos.current.x + dx * scale
      newZ = originalPos.current.z + dz * scale
    }
    
    targetPos.current.set(newX, position[1], newZ)
  }
  
  // Character animation and movement
  useFrame((state, delta) => {
    if (!groupRef.current) return
    
    const time = state.clock.getElapsedTime()
    
    // Update walk cycle for animations if moving
    if (isMoving) {
      // Characters walk at different speeds based on personality
      const walkSpeed = 5 + personalityTraits.current.nervousness * 4
      setWalkCycle((prev) => (prev + delta * walkSpeed) % (Math.PI * 2))
    }
    
    // Check if it's time to pick a new target position
    if (time > nextMoveTime.current) {
      pickNewTarget(time)
    } else if (time > idleTime.current && !isMoving) {
      // If idle time has passed, start moving again
      pickNewTarget(time, false)
    }
    
    // Move character towards target position
    const currentPos = groupRef.current.position
    const distanceToTarget = new THREE.Vector2(
      targetPos.current.x - currentPos.x,
      targetPos.current.z - currentPos.z
    ).length()
    
    // Only move if not too close to target and not idling
    if (distanceToTarget > 0.1 && isMoving) {
      // Calculate movement vector
      const moveVector = new THREE.Vector3(
        targetPos.current.x - currentPos.x,
        0,
        targetPos.current.z - currentPos.z
      ).normalize()
      
      // Apply personality-based speed variations
      const actualSpeed = personalityTraits.current.speed * delta
      
      // Add avoidance vector (decays over time)
      avoidanceVector.current.multiplyScalar(0.9) // Decay
      moveVector.add(avoidanceVector.current)
      moveVector.normalize().multiplyScalar(actualSpeed)
      
      // Update position with acceleration/deceleration
      currentPos.x += moveVector.x
      currentPos.z += moveVector.z
      
      // Apply bobbing - the bobbing amount varies based on personality
      const bobAmount = Math.sin(walkCycle) * 0.04 * (1 + personalityTraits.current.nervousness)
      currentPos.y = position[1] + bobAmount
      
      // Update rotation to face movement direction with anticipation
      const targetAngle = Math.atan2(moveVector.z, moveVector.x)
      const currentRotation = groupRef.current.rotation.y
      
      // Smooth rotation
      const rotationSpeed = 10 * delta
      const angleDiff = (targetAngle - currentRotation + Math.PI * 3) % (Math.PI * 2) - Math.PI
      groupRef.current.rotation.y = currentRotation + angleDiff * Math.min(1, rotationSpeed)
    } else {
      // Just apply slight bobbing when idle
      const idleBobbing = Math.sin(time * 1.5) * 0.015
      currentPos.y = position[1] + idleBobbing
    }
    
    // When hovered, override rotation
    if (hovered) {
      groupRef.current.rotation.y += 0.03
    }
  })
  
  // Handle character click
  const handleClick = () => {
    if (clicked) return
    
    setClicked(true)
    setTimeout(() => {
      router.push(`/chat/${character.id}`)
    }, 500)
  }
  
  // Initialize movement
  useEffect(() => {
    // Set initial target to the starting position
    originalPos.current.set(...position)
    targetPos.current.set(...position)
    
    // Set first movement time
    nextMoveTime.current = Math.random() * 2 // Start moving after 0-2 seconds
  }, [position])

  return (
    <group 
      ref={groupRef} 
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={handleClick}
    >
      {/* Character Minecraft-style model */}
      <animated.group scale={scale}>
        {/* Body */}
        <mesh castShadow>
          <boxGeometry args={[0.6, 0.8, 0.3]} />
          <meshStandardMaterial color={bodyColor} />
        </mesh>
        
        {/* Head with slight animation */}
        <mesh 
          castShadow 
          position={[0, 0.65, 0]}
          rotation={[
            Math.sin(walkCycle * 0.5) * 0.1 * (isMoving ? 1 : 0.2),
            Math.sin(walkCycle * 0.4) * 0.1 * (isMoving ? 0.5 : 0.3),
            0
          ]}
        >
          <boxGeometry args={[0.4, 0.4, 0.4]} />
          <meshStandardMaterial color="#ffcc88" />
        </mesh>
        
        {/* Arms with walking animation */}
        <mesh 
          castShadow 
          position={[0.35, 0, 0]} 
          rotation={[isMoving ? Math.sin(walkCycle) * 0.7 : Math.sin(walkCycle * 0.3) * 0.1, 0, 0]}
        >
          <boxGeometry args={[0.1, 0.6, 0.1]} />
          <meshStandardMaterial color={bodyColor} />
        </mesh>
        <mesh 
          castShadow 
          position={[-0.35, 0, 0]} 
          rotation={[isMoving ? -Math.sin(walkCycle) * 0.7 : Math.sin(walkCycle * 0.3 + 0.5) * 0.1, 0, 0]}
        >
          <boxGeometry args={[0.1, 0.6, 0.1]} />
          <meshStandardMaterial color={bodyColor} />
        </mesh>
        
        {/* Legs with walking animation */}
        <mesh 
          castShadow 
          position={[0.15, -0.6, 0]} 
          rotation={[isMoving ? -Math.sin(walkCycle) * 0.5 : 0, 0, 0]}
        >
          <boxGeometry args={[0.1, 0.4, 0.1]} />
          <meshStandardMaterial color="#555555" />
        </mesh>
        <mesh 
          castShadow 
          position={[-0.15, -0.6, 0]} 
          rotation={[isMoving ? Math.sin(walkCycle) * 0.5 : 0, 0, 0]}
        >
          <boxGeometry args={[0.1, 0.4, 0.1]} />
          <meshStandardMaterial color="#555555" />
        </mesh>
      </animated.group>
      
      {/* Character name label */}
      <Html
        position={[0, 1.2, 0]}
        center
        distanceFactor={10}
      >
        <div className={`px-2 py-1 rounded-lg text-center text-sm font-bold ${hovered ? 'bg-yellow-300' : 'bg-white/80'}`}>
          {character.name}
        </div>
      </Html>
    </group>
  )
}
