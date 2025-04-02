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
    const frontVector = new Vector3(0, 0, forward ? -1 : backward ? 1 : 0)
    const sideVector = new Vector3(left ? -1 : right ? 1 : 0, 0, 0)
    
    direction
      .subVectors(frontVector, sideVector)
      .normalize()
      .multiplyScalar(5 * delta) // Increased from 2.5 to 5 for faster movement
      .applyAxisAngle(new Vector3(0, 1, 0), playerRotation)
    
    // Apply movement with improved acceleration/deceleration
    const velocity = rigidBodyRef.current.linvel()
    
    // Target velocity based on input
    const targetVelX = direction.x * 15 // Increased from 5 to 15
    const targetVelZ = direction.z * 15 // Increased from 5 to 15
    
    // Apply smooth acceleration/deceleration
    const newVelX = velocity.x + (targetVelX - velocity.x) * Math.min(1, delta * 10)
    const newVelZ = velocity.z + (targetVelZ - velocity.z) * Math.min(1, delta * 10)
    
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
        rigidBodyRef.current.setLinvel({ x: velocity.x, y: 8, z: velocity.z }, true) // Higher jump
      }
    }
    
    // Update player rotation for model
    rigidBodyRef.current.setRotation(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), playerRotation), true)
    
    // Update camera position
    const targetPosition = new Vector3()
    const bodyPosition = new Vector3(position.x, position.y + 1, position.z)
    
    // Position camera based on player rotation
    const cameraOffset = new Vector3(0, 1.5, 5).applyAxisAngle(new Vector3(0, 1, 0), playerRotation)
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
    
    // Apply smooth camera movement with faster response
    smoothedCameraPosition.lerp(targetPosition, Math.min(1, 8 * delta))
    smoothedCameraTarget.lerp(cameraTarget, Math.min(1, 8 * delta))
    
    state.camera.position.copy(smoothedCameraPosition)
    state.camera.lookAt(smoothedCameraTarget)
  })

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={[0, 2, 0]}
      enabledRotations={[false, true, false]}
      mass={1}
      type="dynamic"
      lockRotations={false}
      friction={0.2} // Reduced friction for more responsive movement
      restitution={0.05}
      linearDamping={0.9} // Increased damping for less sliding
      angularDamping={0.9}
      colliders={false}
    >
      <CylinderCollider args={[0.8, 0.4]} />
      
      {/* Player Avatar with walking animation */}
      <group rotation-y={playerRotation}>
        {/* Body */}
        <mesh castShadow>
          <boxGeometry args={[0.6, 0.8, 0.3]} />
          <meshStandardMaterial color="#5588ff" />
        </mesh>
        
        {/* Head */}
        <mesh castShadow position={[0, 0.65, 0]}>
          <boxGeometry args={[0.4, 0.4, 0.4]} />
          <meshStandardMaterial color="#ffcc88" />
        </mesh>
        
        {/* Arms with walking animation */}
        <mesh castShadow 
          position={[0.35, 0, 0]} 
          rotation={[isMoving ? Math.sin(walkCycle) * 0.5 : 0, 0, 0]}
        >
          <boxGeometry args={[0.1, 0.6, 0.1]} />
          <meshStandardMaterial color="#5588ff" />
        </mesh>
        <mesh castShadow 
          position={[-0.35, 0, 0]}
          rotation={[isMoving ? -Math.sin(walkCycle) * 0.5 : 0, 0, 0]}
        >
          <boxGeometry args={[0.1, 0.6, 0.1]} />
          <meshStandardMaterial color="#5588ff" />
        </mesh>
        
        {/* Legs with walking animation */}
        <mesh castShadow 
          position={[0.15, -0.6, 0]}
          rotation={[isMoving ? -Math.sin(walkCycle) * 0.5 : 0, 0, 0]}
        >
          <boxGeometry args={[0.1, 0.4, 0.1]} />
          <meshStandardMaterial color="#3366cc" />
        </mesh>
        <mesh castShadow 
          position={[-0.15, -0.6, 0]}
          rotation={[isMoving ? Math.sin(walkCycle) * 0.5 : 0, 0, 0]}
        >
          <boxGeometry args={[0.1, 0.4, 0.1]} />
          <meshStandardMaterial color="#3366cc" />
        </mesh>
      </group>
    </RigidBody>
  )
}
