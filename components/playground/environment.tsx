"use client"

import { useRef } from "react"
import { RigidBody, CylinderCollider } from "@react-three/rapier"
import { ThreeElements, useFrame } from "@react-three/fiber"
import { Mesh } from "three"
import { Html } from "@react-three/drei"

export function PlaygroundEnvironment() {
  return (
    <group>
      {/* Ground - Park-like ground with increased size */}
      <RigidBody type="fixed" friction={1}>
        <Ground position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]} />
      </RigidBody>

      {/* Park decorative elements */}
      <ParkElements />
      
      {/* Boundaries to prevent falling - pushed further out */}
      <Boundaries />
    </group>
  )
}

function ParkElements() {
  return (
    <group>
      {/* Trees scattered around */}
      <Trees />
      
      {/* Rocks */}
      <Rocks />
      
      {/* Benches */}
      <Benches />
      
      {/* Central gazebo */}
      <Gazebo position={[0, 0, 0]} />
      
      {/* Pathways */}
      <Paths />
      
    </group>
  )
}

function InfoSign({ text }: { text: string }) {
  return (
    <group>
      <mesh castShadow position={[0, 1, 0]}>
        <boxGeometry args={[0.1, 2, 0.1]} />
        <meshStandardMaterial color="#5c4033" />
      </mesh>
      <mesh castShadow position={[0, 2, 0]} rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[1.5, 1, 0.05]} />
        <meshStandardMaterial color="#ddddbb" />
      </mesh>
      <Html position={[0, 2, 0]} center>
        <div style={{
          fontFamily: 'monospace',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#221100',
          whiteSpace: 'nowrap',
          transform: 'rotate(45deg)'
        }}>
          {text}
        </div>
      </Html>
    </group>
  )
}

function Paths() {
  return (
    <group>
      {/* Main cross paths - increased length */}
      <Path position={[0, -0.48, 0]} rotation={[Math.PI/2, 0, 0]} width={4} length={120} /> {/* Increased width and length */}
      <Path position={[0, -0.48, 0]} rotation={[Math.PI/2, 0, Math.PI/2]} width={4} length={120} /> {/* Increased width and length */}
      
      {/* Circular path - increased radius */}
      <CirclePath position={[0, -0.48, 0]} radius={25} segments={24} width={3} /> {/* Increased radius, segments and width */}
      
      {/* Diagonal paths - increased length */}
      <Path position={[20, -0.48, 20]} rotation={[Math.PI/2, 0, Math.PI/4]} width={3} length={30} /> {/* Repositioned and increased size */}
      <Path position={[-20, -0.48, 20]} rotation={[Math.PI/2, 0, -Math.PI/4]} width={3} length={30} /> {/* Repositioned and increased size */}
      <Path position={[20, -0.48, -20]} rotation={[Math.PI/2, 0, -Math.PI/4]} width={3} length={30} /> {/* Added new diagonal path */}
      <Path position={[-20, -0.48, -20]} rotation={[Math.PI/2, 0, Math.PI/4]} width={3} length={30} /> {/* Added new diagonal path */}
    </group>
  )
}

function Path({ position, rotation, width, length }: { position: [number, number, number], rotation: [number, number, number], width: number, length: number }) {
  return (
    <mesh position={position} rotation={rotation} receiveShadow>
      <planeGeometry args={[width, length]} />
      <meshStandardMaterial color="#d2b48c" />
    </mesh>
  )
}

function CirclePath({ position, radius, segments, width }: { position: [number, number, number], radius: number, segments: number, width: number }) {
  const points: [number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    points.push([Math.cos(angle) * radius, Math.sin(angle) * radius]);
  }
  
  return (
    <group position={position}>
      {points.slice(0, -1).map((point, i) => {
        const nextPoint = points[i + 1];
        const x = (point[0] + nextPoint[0]) / 2;
        const z = (point[1] + nextPoint[1]) / 2;
        const angle = Math.atan2(nextPoint[1] - point[1], nextPoint[0] - point[0]);
        const distance = Math.sqrt(Math.pow(nextPoint[0] - point[0], 2) + Math.pow(nextPoint[1] - point[1], 2));
        
        return (
          <mesh 
            key={i}
            position={[x, 0, z]}
            rotation={[Math.PI/2, 0, angle + Math.PI/2]}
            receiveShadow
          >
            <planeGeometry args={[width, distance]} />
            <meshStandardMaterial color="#d2b48c" />
          </mesh>
        );
      })}
    </group>
  );
}

function Gazebo({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.25, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[3, 3, 0.5, 8]} />
        <meshStandardMaterial color="#aaaaaa" />
      </mesh>
      
      {/* Pillars */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const angle = (i / 8) * Math.PI * 2;
        const x = Math.cos(angle) * 2.5;
        const z = Math.sin(angle) * 2.5;
        return (
          <mesh key={i} position={[x, 2, z]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 3.5, 8]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        );
      })}
      
      {/* Roof */}
      <mesh position={[0, 4.5, 0]} castShadow>
        <coneGeometry args={[3.5, 1.5, 8]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
    </group>
  )
}

function Benches() {
  return (
    <group>
      {/* Repositioned benches more spread out */}
      <Bench position={[10, 0, 10]} rotation={[0, Math.PI/4, 0]} />
      <Bench position={[-10, 0, 10]} rotation={[0, -Math.PI/4, 0]} />
      <Bench position={[10, 0, -10]} rotation={[0, -Math.PI/4, 0]} />
      <Bench position={[-10, 0, -10]} rotation={[0, Math.PI/4, 0]} />
      
      {/* Additional benches further out */}
      <Bench position={[30, 0, 0]} rotation={[0, Math.PI/2, 0]} />
      <Bench position={[-30, 0, 0]} rotation={[0, Math.PI/2, 0]} />
      <Bench position={[0, 0, 30]} rotation={[0, 0, 0]} />
      <Bench position={[0, 0, -30]} rotation={[0, 0, 0]} />
      
      {/* Even more benches in between */}
      <Bench position={[20, 0, 20]} rotation={[0, Math.PI/3, 0]} />
      <Bench position={[-20, 0, 20]} rotation={[0, -Math.PI/3, 0]} />
      <Bench position={[20, 0, -20]} rotation={[0, -Math.PI/3, 0]} />
      <Bench position={[-20, 0, -20]} rotation={[0, Math.PI/3, 0]} />
    </group>
  )
}

function Bench({ position, rotation }: { position: [number, number, number], rotation: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Seat */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[2, 0.1, 0.6]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
      
      {/* Backrest */}
      <mesh position={[0, 0.9, -0.25]} rotation={[Math.PI/12, 0, 0]} castShadow>
        <boxGeometry args={[2, 0.6, 0.1]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
      
      {/* Legs */}
      <mesh position={[-0.8, 0.2, 0]} castShadow>
        <boxGeometry args={[0.1, 0.4, 0.5]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      <mesh position={[0.8, 0.2, 0]} castShadow>
        <boxGeometry args={[0.1, 0.4, 0.5]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
    </group>
  )
}

function Trees() {
  return (
    <group>
      {/* Main decorative trees - more spread out */}
      <Tree position={[15, 0, 15]} scale={[1.2, 1.2, 1.2]} />
      <Tree position={[-15, 0, -15]} scale={[0.8, 1.5, 0.8]} />
      <Tree position={[20, 0, -10]} scale={[1, 1, 1]} />
      <Tree position={[-20, 0, 10]} scale={[1.4, 1.1, 1.4]} />
      
      {/* Random trees around the perimeter - pushed further out */}
      {Array.from({ length: 60 }).map((_, i) => { // Increased number of trees
        const angle = (i / 60) * Math.PI * 2;
        const distance = 60 + Math.random() * 20; // Increased distance from center
        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;
        const scale = 0.7 + Math.random() * 0.8;
        return (
          <Tree 
            key={`perimeter-tree-${i}`}
            position={[x, 0, z]} 
            scale={[scale, scale * (0.9 + Math.random() * 0.4), scale]} 
          />
        );
      })}
      
      {/* Random tree clusters in specific areas - more spread out and more clusters */}
      {Array.from({ length: 10 }).map((_, i) => { // Increased from 5 to 10 clusters
        const baseX = (Math.random() - 0.5) * 120; // Increased spread
        const baseZ = (Math.random() - 0.5) * 120; // Increased spread
        return Array.from({ length: 3 + Math.floor(Math.random() * 3) }).map((_, j) => {
          const x = baseX + (Math.random() - 0.5) * 8;
          const z = baseZ + (Math.random() - 0.5) * 8;
          const scale = 0.6 + Math.random() * 0.6;
          return (
            <Tree
              key={`cluster-${i}-tree-${j}`}
              position={[x, 0, z]}
              scale={[scale, scale * (1 + Math.random() * 0.3), scale]}
            />
          );
        });
      }).flat()}
    </group>
  )
}

function Ground(props: ThreeElements['mesh']) {
  const ref = useRef<Mesh>(null)
  
  return (
    <mesh ref={ref} receiveShadow {...props}>
      <planeGeometry args={[200, 200]} /> {/* Updated from 100x100 to 200x200 to match boundaries */}
      <meshStandardMaterial color="#448844" />
    </mesh>
  )
}

function Box({ color = "#a3c468", ...props }: ThreeElements['mesh'] & { color?: string }) {
  const ref = useRef<Mesh>(null)
  
  return (
    <mesh ref={ref} castShadow receiveShadow {...props}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}


function Tree(props: ThreeElements['group']) {
  return (
    <group {...props}>
      <mesh position={[0, 2, 0]} castShadow>
        <coneGeometry args={[1.5, 3, 8]} />
        <meshStandardMaterial color="#005500" />
      </mesh>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 2, 8]} />
        <meshStandardMaterial color="#663300" />
      </mesh>
    </group>
  )
}

function Rocks() {
  return (
    <group>
      <Rock position={[4, 0, -3]} scale={[1, 0.6, 1]} />
      <Rock position={[-5, 0, 4]} scale={[0.7, 0.4, 0.7]} />
      <Rock position={[7, 0, 2]} scale={[0.5, 0.3, 0.5]} />
    </group>
  )
}

function Rock(props: ThreeElements['mesh']) {
  return (
    <mesh castShadow receiveShadow {...props}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#777777" />
    </mesh>
  )
}

function Boundaries() {
  return (
    <group>
      {/* North wall - pushed further out */}
      <RigidBody type="fixed" position={[0, 2, -100]}>
        <mesh receiveShadow>
          <boxGeometry args={[200, 10, 1]} /> {/* Increased width to match ground */}
          <meshStandardMaterial color="#448844" opacity={0.3} transparent />
        </mesh>
      </RigidBody>
      
      {/* South wall - pushed further out */}
      <RigidBody type="fixed" position={[0, 2, 100]}>
        <mesh receiveShadow>
          <boxGeometry args={[200, 10, 1]} /> {/* Increased width to match ground */}
          <meshStandardMaterial color="#448844" opacity={0.3} transparent />
        </mesh>
      </RigidBody>
      
      {/* East wall - pushed further out */}
      <RigidBody type="fixed" position={[100, 2, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[1, 10, 200]} /> {/* Increased length to match ground */}
          <meshStandardMaterial color="#448844" opacity={0.3} transparent />
        </mesh>
      </RigidBody>
      
      {/* West wall - pushed further out */}
      <RigidBody type="fixed" position={[-100, 2, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[1, 10, 200]} /> {/* Increased length to match ground */}
          <meshStandardMaterial color="#448844" opacity={0.3} transparent />
        </mesh>
      </RigidBody>
    </group>
  )
}