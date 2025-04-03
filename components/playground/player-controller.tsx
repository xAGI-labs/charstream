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
  
  const [, getKeys] = useKeyboardControls()

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (event.buttons === 2) {
        setPlayerRotation((prev) => prev - event.movementX * 0.01)
      }
    }
    
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
    
    const { forward, backward, left, right, jump } = getKeys()
    
    const isPlayerMoving = forward || backward || left || right
    setIsMoving(isPlayerMoving)
    
    if (isPlayerMoving) {
      setWalkCycle((prev) => (prev + delta * 10) % (Math.PI * 2))
    }
    
    const position = rigidBodyRef.current.translation()
    
    const direction = new Vector3()
    
    const frontVector = new Vector3(0, 0, forward ? -1 : backward ? 1 : 0)
    const sideVector = new Vector3(left ? -1 : right ? 1 : 0, 0, 0)
    
    direction
      .addVectors(frontVector, sideVector)
      .normalize()
      .multiplyScalar(10 * delta)
      .applyAxisAngle(new Vector3(0, 1, 0), playerRotation)
    
    const velocity = rigidBodyRef.current.linvel()
    
    const targetVelX = direction.x * 25
    const targetVelZ = direction.z * 25
    
    const accelerationFactor = 15
    const newVelX = velocity.x + (targetVelX - velocity.x) * Math.min(1, delta * accelerationFactor)
    const newVelZ = velocity.z + (targetVelZ - velocity.z) * Math.min(1, delta * accelerationFactor)
    
    rigidBodyRef.current.setLinvel(
      { x: newVelX, y: velocity.y, z: newVelZ },
      true
    )
    
    if (jump) {
      const rayOrigin = new Vector3(position.x, position.y - 0.8, position.z)
      const rayDirection = new Vector3(0, -1, 0)
      const rayLength = 0.3
      
      if (Math.abs(velocity.y) < 0.1) {
        rigidBodyRef.current.setLinvel({ x: velocity.x, y: 10, z: velocity.z }, true)
      }
    }
    
    rigidBodyRef.current.setRotation(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), playerRotation), true)
    
    const targetPosition = new Vector3()
    const bodyPosition = new Vector3(position.x, position.y + 1, position.z)
    
    const cameraOffset = new Vector3(0, 2, 6).applyAxisAngle(new Vector3(0, 1, 0), playerRotation)
    targetPosition.copy(bodyPosition).add(cameraOffset)
    
    if (isPlayerMoving && Math.abs(velocity.y) < 0.1) {
      const bobAmount = Math.sin(state.clock.elapsedTime * 10) * 0.05
      targetPosition.y += bobAmount
    }
    
    const cameraTarget = new Vector3()
    cameraTarget.copy(bodyPosition).add(
      new Vector3(0, 0.25, -3).applyAxisAngle(new Vector3(0, 1, 0), playerRotation)
    )
    
    const cameraLerpFactor = 12 * delta
    smoothedCameraPosition.lerp(targetPosition, Math.min(1, cameraLerpFactor))
    smoothedCameraTarget.lerp(cameraTarget, Math.min(1, cameraLerpFactor))
    
    state.camera.position.copy(smoothedCameraPosition)
    state.camera.lookAt(smoothedCameraTarget)
  })

  const playerColors = {
    primary: "#4a7bce",
    secondary: "#234789",
    skin: "#ffe0bd",
    hair: "#5d3d1c",
    accent: "#f3d78e"
  }

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={[0, 2, 0]}
      enabledRotations={[false, true, false]}
      mass={1}
      type="dynamic"
      lockRotations={false}
      friction={0.1}
      restitution={0.05}
      linearDamping={0.7}
      angularDamping={0.9}
      colliders={false}
    >
      <CylinderCollider args={[0.8, 0.4]} />
      
      <group rotation-y={playerRotation}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.45, 0]} receiveShadow>
          <circleGeometry args={[0.4, 16]} />
          <meshBasicMaterial color="black" transparent opacity={0.2} />
        </mesh>

        <mesh castShadow position={[0, 0, 0]}>
          <capsuleGeometry args={[0.35, 0.7, 8, 16]} />
          <meshStandardMaterial 
            color={playerColors.primary}
            roughness={0.6}
            metalness={0.1}
          />
        </mesh>

        <mesh castShadow position={[0, 0.05, 0.18]} scale={[0.9, 0.75, 0.5]}>
          <boxGeometry args={[0.8, 0.8, 0.3]} />
          <meshStandardMaterial 
            color={playerColors.primary}
            roughness={0.8}
            metalness={0}
          />
        </mesh>

        <mesh castShadow position={[0, 0.1, 0.21]} scale={[0.7, 0.6, 0.4]}>
          <boxGeometry args={[0.85, 0.5, 0.2]} />
          <meshStandardMaterial 
            color={playerColors.accent}
            roughness={0.7}
            metalness={0.2}
          />
        </mesh>
        
        <group position={[0, 0.7, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial 
              color={playerColors.skin}
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
            <meshStandardMaterial color="#1e90ff" />
          </mesh>
          
          <mesh position={[-0.12, 0.05, 0.2]} rotation={[0, 0, 0]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="white" />
          </mesh>
          <mesh position={[-0.12, 0.05, 0.24]} rotation={[0, 0, 0]} scale={0.5}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="#1e90ff" />
          </mesh>

          <mesh position={[0, 0.18, 0]} scale={[1.05, 0.7, 1.05]}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial 
              color={playerColors.hair}
              roughness={0.9}
              metalness={0}
            />
          </mesh>
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
