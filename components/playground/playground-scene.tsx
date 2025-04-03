"use client"

import { Canvas } from "@react-three/fiber"
import { Environment, KeyboardControls } from "@react-three/drei"
import { Suspense, useState, useMemo } from "react"
import { PlaygroundEnvironment } from "./environment"
import { Physics } from "@react-three/rapier"
import { PlayerController } from "./player-controller"
import { usePlaygroundCharacters } from "@/hooks/use-playground-characters"
import { CharacterModel } from "./character-model"
import { Perf } from "r3f-perf"
import * as THREE from 'three'

const controls = [
  { name: "forward", keys: ["ArrowUp", "w", "W"] },
  { name: "backward", keys: ["ArrowDown", "s", "S"] },
  { name: "left", keys: ["ArrowLeft", "a", "A"] },
  { name: "right", keys: ["ArrowRight", "d", "D"] },
  { name: "jump", keys: ["Space"] },
]

function getRandomPosition(type: 'home' | 'user'): [number, number, number] {
  const angle = Math.random() * Math.PI * 2
  const distance = 10 + Math.random() * 40
  let x = Math.cos(angle) * distance
  let z = Math.sin(angle) * distance
  if (type === 'home') {
    x = Math.abs(x) * 0.8 + 15
    z = z * 0.8 + Math.random() * 20 - 10
  } else {
    x = -Math.abs(x) * 0.8 - 15
    z = z * 0.8 + Math.random() * 20 - 10
  }
  return [x, 0.5, z]
}

export function PlaygroundScene() {
  const [debug, setDebug] = useState(false)
  const { homeCharacters, userCharacters, loading, error } = usePlaygroundCharacters()
  const homeCharacterPositions = useMemo(() => {
    return Array.from({ length: 40 }).map(() => getRandomPosition('home'))
  }, [])
  const userCharacterPositions = useMemo(() => {
    return Array.from({ length: 40 }).map(() => getRandomPosition('user'))
  }, [])
  return (
    <>
      <div className="absolute top-4 left-4 z-10 bg-black/50 p-3 rounded text-white">
        <h1 className="text-xl font-bold">Character Playground</h1>
        <p className="text-sm">Use WASD or Arrow Keys to move</p>
        <p className="text-sm">Space to jump</p>
        <p className="text-sm">Right-click + mouse movement to look around</p>
        <p className="text-sm">Click on characters to chat with them</p>
        {loading && <p className="text-yellow-300">Loading characters...</p>}
      </div>
      <button 
        className="absolute top-4 right-4 z-10 px-3 py-1 bg-black/50 text-white rounded"
        onClick={() => setDebug(prev => !prev)}
      >
        {debug ? 'Hide Debug' : 'Show Debug'}
      </button>
      <KeyboardControls map={controls}>
        <Canvas
          shadows
          camera={{ position: [0, 5, 10], fov: 50 }}
          className="w-full h-full"
        >
          <Suspense fallback={null}>
            {debug && <Perf position="top-left" />}
            <directionalLight 
              position={[10, 10, 10]} 
              intensity={1.5} 
              castShadow 
              shadow-mapSize={[2048, 2048]} 
            />
            <ambientLight intensity={0.5} />
            <Physics debug={debug} gravity={[0, -9.81, 0]}>
              <PlaygroundEnvironment />
              <PlayerController />
              {!loading && homeCharacters.map((character, index) => {
                const position = homeCharacterPositions[index % homeCharacterPositions.length]
                return (
                  <CharacterModel
                    key={character.id}
                    character={character}
                    position={position}
                    moveRadius={5 + Math.random() * 5}
                    moveSpeed={0.3 + Math.random() * 0.5}
                  />
                )
              })}
              {!loading && userCharacters.map((character, index) => {
                const position = userCharacterPositions[index % userCharacterPositions.length]
                return (
                  <CharacterModel
                    key={character.id}
                    character={character}
                    position={position}
                    moveRadius={5 + Math.random() * 5}
                    moveSpeed={0.2 + Math.random() * 0.3}
                  />
                )
              })}
            </Physics>
            <Environment preset="park" />
          </Suspense>
        </Canvas>
      </KeyboardControls>
    </>
  )
}
