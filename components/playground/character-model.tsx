"use client"

import { useRef, useState, useEffect } from "react"
import { useFrame, ThreeEvent } from "@react-three/fiber"
import { Html } from "@react-three/drei"
import { useRouter } from "next/navigation"
import { Character } from "@/types/character"
import * as THREE from "three"
import { useSpring, animated } from "@react-spring/three"
import { toast } from "sonner"

interface CharacterModelProps {
  character: Character
  position: [number, number, number]
  moveRadius?: number 
  moveSpeed?: number 
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
  const [walkCycle, setWalkCycle] = useState(Math.random() * Math.PI * 2) 
  
  const isRequestInProgress = useRef(false)
  
  const originalPos = useRef<THREE.Vector3>(new THREE.Vector3(...position))
  const targetPos = useRef<THREE.Vector3>(new THREE.Vector3(...position))
  const movementAngle = useRef<number>(Math.random() * Math.PI * 2)
  const nextMoveTime = useRef<number>(0)
  const idleTime = useRef<number>(0)
  const avoidanceVector = useRef<THREE.Vector3>(new THREE.Vector3())
  
  const { scale } = useSpring({
    scale: hovered ? 1.1 : 1,
    config: { tension: 300, friction: 10 }
  })
  
  const getColorFromName = (name: string, saturation = 70, lightness = 60) => {
    const hash = name.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc)
    }, 0)
    
    const hue = Math.abs(hash % 360)
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`
  }
  
  const characterColors = {
    primary: getColorFromName(character.name),
    secondary: getColorFromName(character.name, 60, 40),
    accent: getColorFromName(character.name + "accent", 80, 70),
    hair: getColorFromName(character.name + "hair", 40, 30)
  }
  
  const personalityTraits = useRef({
    nervousness: (character.name.charCodeAt(0) % 10) / 10, 
    speed: moveSpeed * (0.8 + (character.name.charCodeAt(0) % 5) / 10), 
    pauseFrequency: 0.3 + (character.name.charCodeAt(0) % 5) / 10,
    hairStyle: Math.floor(character.name.charCodeAt(0) % 3), 
    hasGlasses: character.name.charCodeAt(0) % 5 === 0, 
    hasHat: character.name.charCodeAt(0) % 7 === 0, 
  })
  
  const pickNewTarget = (time: number, shouldIdle: boolean = false) => {
    if (!groupRef.current) return
    
    if (shouldIdle || Math.random() < personalityTraits.current.pauseFrequency) {
      setIsMoving(false)
      idleTime.current = time + 1 + Math.random() * 3
      nextMoveTime.current = idleTime.current
      return
    }
    
    setIsMoving(true)
    const moveDuration = 3 + (1 - personalityTraits.current.nervousness) * 5
    nextMoveTime.current = time + moveDuration 
    
    const currentPos = groupRef.current.position
    const distanceFromOrigin = new THREE.Vector2(
      currentPos.x - originalPos.current.x,
      currentPos.z - originalPos.current.z
    ).length()
    
    let angleToOrigin = Math.atan2(
      originalPos.current.z - currentPos.z,
      originalPos.current.x - currentPos.x
    )
    
    const returnBias = Math.min(1, distanceFromOrigin / (moveRadius * 1.2))
    const randomAngle = Math.random() * Math.PI * 2
    movementAngle.current = randomAngle * (1 - returnBias) + angleToOrigin * returnBias
    
    movementAngle.current += (Math.random() - 0.5) * Math.PI / 4
    
    const randomDistance = (0.5 + Math.random() * 0.5) * moveRadius
    let newX = currentPos.x + Math.cos(movementAngle.current) * randomDistance
    let newZ = currentPos.z + Math.sin(movementAngle.current) * randomDistance
    
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
  
  useFrame((state, delta) => {
    if (!groupRef.current) return
    
    const time = state.clock.getElapsedTime()
    
    if (isMoving) {
      const walkSpeed = 5 + personalityTraits.current.nervousness * 4
      setWalkCycle((prev) => (prev + delta * walkSpeed) % (Math.PI * 2))
    }
    
    if (time > nextMoveTime.current) {
      pickNewTarget(time)
    } else if (time > idleTime.current && !isMoving) {
      pickNewTarget(time, false)
    }
    
    const currentPos = groupRef.current.position
    const distanceToTarget = new THREE.Vector2(
      targetPos.current.x - currentPos.x,
      targetPos.current.z - currentPos.z
    ).length()
    
    if (distanceToTarget > 0.1 && isMoving) {
      const moveVector = new THREE.Vector3(
        targetPos.current.x - currentPos.x,
        0,
        targetPos.current.z - currentPos.z,
      ).normalize()
      
      const actualSpeed = personalityTraits.current.speed * delta
      
      avoidanceVector.current.multiplyScalar(0.9)
      moveVector.add(avoidanceVector.current)
      moveVector.normalize().multiplyScalar(actualSpeed)
      
      currentPos.x += moveVector.x
      currentPos.z += moveVector.z
      
      const bobAmount = Math.sin(walkCycle) * 0.04 * (1 + personalityTraits.current.nervousness)
      currentPos.y = position[1] + bobAmount
      
      const targetAngle = Math.atan2(moveVector.z, moveVector.x)
      const currentRotation = groupRef.current.rotation.y
      
      const rotationSpeed = 10 * delta
      const angleDiff = (targetAngle - currentRotation + Math.PI * 3) % (Math.PI * 2) - Math.PI
      groupRef.current.rotation.y = currentRotation + angleDiff * Math.min(1, rotationSpeed)
    } else {
      const idleBobbing = Math.sin(time * 1.5) * 0.015
      currentPos.y = position[1] + idleBobbing
    }
    
    if (hovered) {
      groupRef.current.rotation.y += 0.03
    }
  })
  
  const handleClick = async (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    
    if (clicked || isRequestInProgress.current) return
    
    setClicked(true)
    isRequestInProgress.current = true
    
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ characterId: character.id }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to create conversation")
      }
      
      const data = await response.json()
      
      router.push(`/chat/${data.id}`)
    } catch (error) {
      console.error("Error creating conversation:", error)
      toast.error("Failed to start conversation")
      setClicked(false)
    } finally {
      setTimeout(() => {
        isRequestInProgress.current = false
      }, 1000)
    }
  }
  
  useEffect(() => {
    originalPos.current.set(...position)
    targetPos.current.set(...position)
    
    nextMoveTime.current = Math.random() * 2
  }, [position])

  const shimmerRef = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (shimmerRef.current && hovered) {
      shimmerRef.current.rotation.y = clock.getElapsedTime() * 2
      
      const material = shimmerRef.current.material as THREE.MeshStandardMaterial
      material.opacity = 0.1 + Math.sin(clock.getElapsedTime() * 3) * 0.05
    }
  })

  return (
    <group 
      ref={groupRef} 
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={handleClick}
      userData={{ pointerEvents: { puncture: false } }}
    >
      <animated.group scale={scale}>
        {hovered && (
          <mesh ref={shimmerRef} position={[0, 0.7, 0]} scale={1.3}>
            <sphereGeometry args={[0.6, 16, 16]} />
            <meshStandardMaterial 
              color="#ffffff" 
              transparent 
              opacity={0.15} 
              emissive="#ffffff"
              emissiveIntensity={0.5}
            />
          </mesh>
        )}

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.45, 0]} receiveShadow>
          <circleGeometry args={[0.4, 16]} />
          <meshBasicMaterial color="black" transparent opacity={0.2} />
        </mesh>

        <mesh castShadow position={[0, 0, 0]}>
          <capsuleGeometry args={[0.35, 0.7, 8, 16]} />
          <meshStandardMaterial 
            color={characterColors.primary} 
            roughness={0.6}
            metalness={0.1}
          />
        </mesh>

        <mesh castShadow position={[0, 0.05, 0.18]} scale={[0.9, 0.75, 0.5]}>
          <boxGeometry args={[0.8, 0.8, 0.3]} />
          <meshStandardMaterial 
            color={characterColors.secondary}
            roughness={0.8}
            metalness={0}
          />
        </mesh>
        
        <group position={[0, 0.7, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial 
              color="#ffdbac" 
              roughness={0.6}
              metalness={0}
            />
          </mesh>
          
          <mesh position={[0.12, 0.05, 0.2]} rotation={[0, 0, 0]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="white" />
          </mesh>
          <mesh position={[0.12, 0.05, 0.24]} rotation={[0, 0, 0]} scale={0.5}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="black" />
          </mesh>
          
          <mesh position={[-0.12, 0.05, 0.2]} rotation={[0, 0, 0]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="white" />
          </mesh>
          <mesh position={[-0.12, 0.05, 0.24]} rotation={[0, 0, 0]} scale={0.5}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="black" />
          </mesh>
          
          {personalityTraits.current.hairStyle === 0 && (
            <mesh position={[0, 0.2, 0]}>
              <sphereGeometry args={[0.32, 16, 16]} />
              <meshStandardMaterial 
                color={characterColors.hair}
                roughness={0.8}
              />
            </mesh>
          )}
          
          {personalityTraits.current.hairStyle === 1 && (
            <mesh position={[0, 0.15, -0.05]}>
              <boxGeometry args={[0.65, 0.2, 0.5]} />
              <meshStandardMaterial 
                color={characterColors.hair}
                roughness={0.8}
              />
            </mesh>
          )}
          
          {personalityTraits.current.hairStyle === 2 && (
            <>
              <mesh position={[0, 0.15, 0]} rotation={[0.2, 0, 0]}>
                <cylinderGeometry args={[0.35, 0.3, 0.4, 16]} />
                <meshStandardMaterial 
                  color={characterColors.hair}
                  roughness={0.8}
                />
              </mesh>
              <mesh position={[0, 0.35, 0]} scale={[0.5, 0.3, 0.5]}>
                <torusGeometry args={[0.3, 0.1, 8, 16]} />
                <meshStandardMaterial 
                  color={characterColors.hair}
                  roughness={0.8}
                />
              </mesh>
            </>
          )}
          
          {personalityTraits.current.hasGlasses && (
            <group position={[0, 0.05, 0.25]}>
              <mesh position={[0, 0, 0]}>
                <boxGeometry args={[0.35, 0.1, 0.05]} />
                <meshStandardMaterial color="#333333" metalness={0.8} />
              </mesh>
              <mesh position={[0.15, 0, 0]}>
                <torusGeometry args={[0.08, 0.02, 8, 16]} />
                <meshStandardMaterial color="#333333" metalness={0.8} />
              </mesh>
              <mesh position={[-0.15, 0, 0]}>
                <torusGeometry args={[0.08, 0.02, 8, 16]} />
                <meshStandardMaterial color="#333333" metalness={0.8} />
              </mesh>
            </group>
          )}
          
          {personalityTraits.current.hasHat && (
            <group position={[0, 0.25, 0]}>
              <mesh position={[0, 0.05, 0]}>
                <cylinderGeometry args={[0.35, 0.35, 0.1, 16]} />
                <meshStandardMaterial color={characterColors.accent} />
              </mesh>
              <mesh position={[0, 0.15, 0]}>
                <cylinderGeometry args={[0.25, 0.25, 0.2, 16]} />
                <meshStandardMaterial color={characterColors.accent} />
              </mesh>
            </group>
          )}
        </group>
        
        <group
          position={[0.4, 0.2, 0]}
          rotation={[
            isMoving ? Math.sin(walkCycle) * 0.5 : Math.sin(walkCycle * 0.3) * 0.1,
            0,
            isMoving ? Math.sin(walkCycle * 0.5) * 0.1 : 0
          ]}
        >
          <mesh castShadow>
            <capsuleGeometry args={[0.1, 0.5, 8, 8]} />
            <meshStandardMaterial color={characterColors.primary} roughness={0.6} />
          </mesh>
        </group>
        
        <group
          position={[-0.4, 0.2, 0]}
          rotation={[
            isMoving ? -Math.sin(walkCycle) * 0.5 : Math.sin(walkCycle * 0.3 + 0.5) * 0.1,
            0,
            isMoving ? -Math.sin(walkCycle * 0.5) * 0.1 : 0
          ]}
        >
          <mesh castShadow>
            <capsuleGeometry args={[0.1, 0.5, 8, 8]} />
            <meshStandardMaterial color={characterColors.primary} roughness={0.6} />
          </mesh>
        </group>
        
        <group
          position={[0.15, -0.5, 0]}
          rotation={[
            isMoving ? Math.sin(walkCycle) * 0.7 : 0,
            0,
            isMoving ? Math.sin(walkCycle * 0.5) * 0.1 : 0
          ]}
        >
          <mesh castShadow>
            <capsuleGeometry args={[0.1, 0.4, 8, 8]} />
            <meshStandardMaterial color={characterColors.secondary} roughness={0.7} />
          </mesh>
        </group>
        
        <group
          position={[-0.15, -0.5, 0]}
          rotation={[
            isMoving ? -Math.sin(walkCycle) * 0.7 : 0,
            0,
            isMoving ? -Math.sin(walkCycle * 0.5) * 0.1 : 0
          ]}
        >
          <mesh castShadow>
            <capsuleGeometry args={[0.1, 0.4, 8, 8]} />
            <meshStandardMaterial color={characterColors.secondary} roughness={0.7} />
          </mesh>
        </group>
      </animated.group>
      
      <Html
        position={[0, 1.2, 0]}
        center
        distanceFactor={10}
        zIndexRange={[0, 0]}
        occlude={true}
      >
        <div className={`px-2 py-1 rounded-lg text-center text-sm text-black font-bold ${hovered ? 'bg-yellow-300' : 'bg-white/80'}`}>
          {character.name}
        </div>
      </Html>
    </group>
  )
}
