import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Default voice settings that can be customized per character
interface VoiceSettings {
  model: string;
  voice: string;
  speed?: number;
  temperature?: number;
}

// Generate a PipeCat flow configuration for a character
export async function generateFlowConfig(character: {
  id: string;
  name: string;
  description?: string | null;
  instructions: string;
}) {
  // Default voice settings - can be customized per character later
  const voiceSettings: VoiceSettings = {
    model: "openai/tts-1",
    voice: "alloy", // Default voice
    temperature: 0.7,
  }
  
  // Check if character has specific voice settings in metadata
  try {
    const characterWithMeta = await prisma.character.findUnique({
      where: { id: character.id },
      select: { metadata: true }
    })
    
    if (characterWithMeta?.metadata) {
      const metadata = JSON.parse(characterWithMeta.metadata as string)
      if (metadata.voice) {
        voiceSettings.voice = metadata.voice
      }
    }
  } catch (error) {
    console.error("Error loading character voice settings:", error)
    // Continue with default settings
  }

  // Build the PipeCat flow configuration
  return {
    nodes: [
      {
        id: "audio_input",
        type: "audio.input",
        config: { format: "wav" }
      },
      {
        id: "speech_to_text",
        type: "whisper.transcribe",
        config: { model: "openai/whisper-1" }
      },
      {
        id: "context_manager",
        type: "memory.buffer",
        config: { 
          max_entries: 10,
          entry_template: {
            role: "string",
            content: "string"
          }
        }
      },
      {
        id: "llm_response",
        type: "openai.chat",
        config: {
          model: "gpt-3.5-turbo",
          system_prompt: character.instructions,
          temperature: 0.7,
          max_tokens: 150
        }
      },
      {
        id: "text_to_speech",
        type: "tts.generate",
        config: {
          model: voiceSettings.model,
          voice: voiceSettings.voice,
          temperature: voiceSettings.temperature
        }
      }
    ],
    edges: [
      { from: "audio_input", to: "speech_to_text" },
      { from: "speech_to_text", to: "context_manager", metadata: { role: "user" } },
      { from: "context_manager", to: "llm_response" },
      { from: "llm_response", to: "context_manager", metadata: { role: "assistant" } },
      { from: "llm_response", to: "text_to_speech" }
    ],
    outputs: {
      text_output: "llm_response",
      audio_output: "text_to_speech"
    }
  }
}

// Function to save a custom flow config for a character
export async function saveCharacterFlowConfig(
  characterId: string, 
  flowConfig: Record<string, any>
) {
  try {
    const character = await prisma.character.findUnique({
      where: { id: characterId },
      select: { metadata: true }
    })
    
    // Parse existing metadata or create new object
    let metadata: Record<string, any> = {}
    if (character?.metadata) {
      metadata = JSON.parse(character.metadata as string)
    }
    
    // Add flow config to metadata
    metadata.flowConfig = flowConfig
    
    // Update character with new metadata
    await prisma.character.update({
      where: { id: characterId },
      data: { metadata: JSON.stringify(metadata) }
    })
    
    return true
  } catch (error) {
    console.error("Error saving character flow config:", error)
    return false
  }
}

// Function to get a character's custom flow config
export async function getCharacterFlowConfig(characterId: string) {
  try {
    const character = await prisma.character.findUnique({
      where: { id: characterId },
      select: { metadata: true }
    })
    
    if (character?.metadata) {
      const metadata = JSON.parse(character.metadata as string)
      if (metadata.flowConfig) {
        return metadata.flowConfig
      }
    }
    
    return null
  } catch (error) {
    console.error("Error getting character flow config:", error)
    return null
  }
}
