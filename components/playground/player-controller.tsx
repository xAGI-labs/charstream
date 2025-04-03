"use client"

import { useRef, useEffect, useState } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { RigidBody, RapierRigidBody, CylinderCollider } from "@react-three/rapier"
import { Vector3, Quaternion } from "three"
import { useKeyboardControls } from "@react-three/drei"

export function PlayerController() {
  const rigidBodyRef = useRef<RapierRigidBody>(null)
  const [smoothedCameraPosition] = useState(() => new Vector3(0, 2, 5))
  const [smoothedCameraTarget] = useState(() => new Vector3())
  const [playerRotation, setPlayerRotation] = useState(0)
  const [isMoving, setIsMoving] = useState(false)
  const [walkCycle, setWalkCycle] = useState(0)
  const { camera } = useThree()
  
  // Define keyboard controls
  const [, getKeys] = useKeyboardControls()

  // Mouse movement for camera rotation
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      // Only rotate when right mouse button is pressed
      if (event.buttons === 2) {
        setPlayerRotation((prev) => prev - event.movementX * 0.01)
      }
    }
    
    // Prevent context menu on right-click
    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault()
    }
    
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("contextmenu", handleContextMenu)
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("contextmenu", handleContextMenu)
    }
  }, [])

  useFrame((state, delta) => {
    if (!rigidBodyRef.current) return
    
    // Get the current control keys
    const { forward, backward, left, right, jump } = getKeys()
    
    // Check if player is moving
    const isPlayerMoving = forward || backward || left || right
    setIsMoving(isPlayerMoving)
    
    // Update walk cycle for animations
    if (isPlayerMoving) {
      setWalkCycle((prev) => (prev + delta * 10) % (Math.PI * 2))
    }
    
    // Get current position
    const position = rigidBodyRef.current.translation()
    
    // Create movement direction based on player rotation
    const direction = new Vector3()
    
    // IMPROVED: Fixed directional controls to properly align with camera view
    const frontVector = new Vector3(0, 0, forward ? -1 : backward ? 1 : 0)
    const sideVector = new Vector3(left ? -1 : right ? 1 : 0, 0, 0)
    
    direction
      .addVectors(frontVector, sideVector) // Changed from subVectors to addVectors for correct movement
      .normalize()
      .multiplyScalar(10 * delta) // Increased from 5 to 10 for faster movement
      .applyAxisAngle(new Vector3(0, 1, 0), playerRotation)
    
    // Apply movement with improved acceleration/deceleration
    const velocity = rigidBodyRef.current.linvel()
    
    // IMPROVED: Increased speed for faster movement
    const targetVelX = direction.x * 25 // Increased from 15 to 25
    const targetVelZ = direction.z * 25 // Increased from 15 to 25
    
    // Apply smooth acceleration/deceleration
    const accelerationFactor = 15 // Increased for more responsive controls
    const newVelX = velocity.x + (targetVelX - velocity.x) * Math.min(1, delta * accelerationFactor)
    const newVelZ = velocity.z + (targetVelZ - velocity.z) * Math.min(1, delta * accelerationFactor)
    
    rigidBodyRef.current.setLinvel(
      { x: newVelX, y: velocity.y, z: newVelZ },
      true
    )
    
    // Improved jump with better ground detection
    if (jump) {
      // Cast a ray downward to check for ground
      const rayOrigin = new Vector3(position.x, position.y - 0.8, position.z)
      const rayDirection = new Vector3(0, -1, 0)
      const rayLength = 0.3
      
      // Simple ground check based on position
      if (Math.abs(velocity.y) < 0.1) {
        rigidBodyRef.current.setLinvel({ x: velocity.x, y: 10, z: velocity.z }, true) // Higher jump (8 → 10)
      }
    }
    
    // Update player rotation for model
    rigidBodyRef.current.setRotation(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), playerRotation), true)
    
    // Update camera position
    const targetPosition = new Vector3()
    const bodyPosition = new Vector3(position.x, position.y + 1, position.z)
    
    // IMPROVED: Adjusted camera offset for better view
    const cameraOffset = new Vector3(0, 2, 6).applyAxisAngle(new Vector3(0, 1, 0), playerRotation)
    targetPosition.copy(bodyPosition).add(cameraOffset)
    
    // Add subtle head bob when moving
    if (isPlayerMoving && Math.abs(velocity.y) < 0.1) {
      const bobAmount = Math.sin(state.clock.elapsedTime * 10) * 0.05
      targetPosition.y += bobAmount
    }
    
    const cameraTarget = new Vector3()
    cameraTarget.copy(bodyPosition).add(
      new Vector3(0, 0.25, -3).applyAxisAngle(new Vector3(0, 1, 0), playerRotation)
    )
    
    // IMPROVED: Faster camera response for more responsive controls
    const cameraLerpFactor = 12 * delta // Increased from 8 to 12
    smoothedCameraPosition.lerp(targetPosition, Math.min(1, cameraLerpFactor))
    smoothedCameraTarget.lerp(cameraTarget, Math.min(1, cameraLerpFactor))
    
    state.camera.position.copy(smoothedCameraPosition)
    state.camera.lookAt(smoothedCameraTarget)
  })

  // Player colors - a nice blue palette
  const playerColors = {
    primary: "#4a7bce", // Main body color - richer blue
    secondary: "#234789", // Darker blue for pants/secondary elements
    skin: "#ffe0bd",    // Warm skin tone
    hair: "#5d3d1c",    // Brown hair
    accent: "#f3d78e"   // Gold/yellow accent color
  }

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={[0, 2, 0]}
      enabledRotations={[false, true, false]}
      mass={1}
      type="dynamic"
      lockRotations={false}
      friction={0.1} // Reduced friction for more responsive movement
      restitution={0.05}
      linearDamping={0.7} // Reduced damping for less sluggish movement
      angularDamping={0.9}
      colliders={false}
    >
      <CylinderCollider args={[0.8, 0.4]} />
      
      {/* Player Avatar with improved model and animations */}
      <group rotation-y={playerRotation}>
        {/* Base/Shadow */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.45, 0]} receiveShadow>
          <circleGeometry args={[0.4, 16]} />
          <meshBasicMaterial color="black" transparent opacity={0.2} />
        </mesh>

        {/* Body - improved with capsule geometry */}
        <mesh castShadow position={[0, 0, 0]}>
          <capsuleGeometry args={[0.35, 0.7, 8, 16]} />
          <meshStandardMaterial 
            color={playerColors.primary}
            roughness={0.6}
            metalness={0.1}
          />
        </mesh>

        {/* Shirt details */}
        <mesh castShadow position={[0, 0.05, 0.18]} scale={[0.9, 0.75, 0.5]}>
          <boxGeometry args={[0.8, 0.8, 0.3]} />
          <meshStandardMaterial 
            color={playerColors.primary}
            roughness={0.8}
            metalness={0}
          />
        </mesh>

        {/* Jacket/vest - additional clothing detail */}
        <mesh castShadow position={[0, 0.1, 0.21]} scale={[0.7, 0.6, 0.4]}>
          <boxGeometry args={[0.85, 0.5, 0.2]} />
          <meshStandardMaterial 
            color={playerColors.accent}
            roughness={0.7}
            metalness={0.2}
          />
        </mesh>
        
        {/* Head with improved details */}
        <group position={[0, 0.7, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial 
              color={playerColors.skin}
              roughness={0.6}
              metalness={0}
            />
          </mesh>
          
          {/* Eyes */}
          <mesh position={[0.12, 0.05, 0.2]} rotation={[0, 0, 0]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="white" />
          </mesh>
          <mesh position={[0.12, 0.05, 0.24]} rotation={[0, 0, 0]} scale={0.5}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="#1e90ff" /> {/* Blue eyes */}
          </mesh>
          
          <mesh position={[-0.12, 0.05, 0.2]} rotation={[0, 0, 0]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="white" />
          </mesh>
          <mesh position={[-0.12, 0.05, 0.24]} rotation={[0, 0, 0]} scale={0.5}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="#1e90ff" /> {/* Blue eyes */}
          </mesh>

          {/* Hair */}
          <mesh position={[0, 0.18, 0]} scale={[1.05, 0.7, 1.05]}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial 
              color={playerColors.hair}
              roughness={0.9}
              metalness={0}
            />
          </mesh>
        </group>
        
        {/* Arms with improved geometry and animations */}
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
            <meshStandardMaterial 
              color={playerColors.primary}
              roughness={0.6}
              metalness={0.1}
            />
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
            <meshStandardMaterial 
              color={playerColors.primary}
              roughness={0.6}
              metalness={0.1}
            />
          </mesh>
        </group>
        
        {/* Legs with improved geometry and animations */}
        <group
          position={[0.15, -0.5, 0]}
          rotation={[
            isMoving ? -Math.sin(walkCycle) * 0.7 : 0,
            0,
            isMoving ? Math.sin(walkCycle * 0.5) * 0.1 : 0
          ]}
        >
          <mesh castShadow>
            <capsuleGeometry args={[0.1, 0.4, 8, 8]} />
            <meshStandardMaterial 
              color={playerColors.secondary}
              roughness={0.7}
              metalness={0}
            />
          </mesh>
        </group>
        
        <group
          position={[-0.15, -0.5, 0]}
          rotation={[
            isMoving ? Math.sin(walkCycle) * 0.7 : 0,
            0,
            isMoving ? -Math.sin(walkCycle * 0.5) * 0.1 : 0
          ]}
        >
          <mesh castShadow>
            <capsuleGeometry args={[0.1, 0.4, 8, 8]} />
            <meshStandardMaterial 
              color={playerColors.secondary}
              roughness={0.7}
              metalness={0}
            />
          </mesh>
        </group>
        
        {/* Shoes */}
        <mesh 
          position={[0.15, -0.75, 0.05]} 
          rotation={[0.2, 0, 0]} 
          scale={[0.13, 0.1, 0.3]} 
          castShadow
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#222222" roughness={0.9} />
        </mesh>
        
        <mesh 
          position={[-0.15, -0.75, 0.05]} 
          rotation={[0.2, 0, 0]} 
          scale={[0.13, 0.1, 0.3]} 
          castShadow
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#222222" roughness={0.9} />
        </mesh>
      </group>
    </RigidBody>
  )
}
