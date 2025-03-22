"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useCharacter } from "@/hooks/use-character"

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  createdAt: Date;
  conversationId: string;
}

// Updated Character interface to match useCharacter hook's interface
interface Character {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
}

interface Conversation {
  id: string;
  title?: string;
  character?: Character;
  characterId: string; 
  createdAt: Date;
}

export function useConversation(chatId: string) {
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [characterId, setCharacterId] = useState<string | null>(null)
  const { userId } = useAuth()
  const router = useRouter()
  
  // Use the character hook to fetch character data separately if needed
  const { character: fetchedCharacter, loading: characterLoading } = useCharacter(characterId)

  // First, fetch the conversation data
  useEffect(() => {
    const fetchConversation = async () => {
      if (!userId || !chatId) return
      
      try {
        setLoading(true)
        console.log("Fetching conversation:", chatId);
        
        const response = await fetch(`/api/conversations/${chatId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            toast.error("Conversation not found")
            router.push("/")
            return
          }
          throw new Error(`Failed to fetch conversation: ${response.status} ${response.statusText}`)
        }
        
        const data = await response.json()
        
        // Debug the response data
        console.log("Conversation API response:", {
          id: data.id,
          title: data.title,
          characterId: data.characterId,
          characterExists: !!data.character,
          messageCount: data.messages?.length
        });
        
        // Store the characterId for separate fetching if needed
        if (data.characterId && !data.character) {
          setCharacterId(data.characterId)
          console.log(`Character data missing, will fetch separately using ID: ${data.characterId}`)
        }
        
        setConversation(data)
        setMessages(data.messages || [])
      } catch (error) {
        console.error("Error fetching conversation:", error)
        toast.error("Failed to load conversation", {
          description: "Please try again later"
        })
      } finally {
        setLoading(false)
      }
    }
    
    if (chatId && userId) {
      fetchConversation()
    }
  }, [chatId, userId, router])
  
  // Update conversation with character data when it's loaded separately
  useEffect(() => {
    if (fetchedCharacter && conversation && !conversation.character) {
      console.log("Updating conversation with separately fetched character:", fetchedCharacter.name);
      setConversation(prev => prev ? { 
        ...prev, 
        character: {
          id: fetchedCharacter.id,
          name: fetchedCharacter.name,
          description: fetchedCharacter.description,
          imageUrl: fetchedCharacter.imageUrl
        } 
      } : null)
    }
  }, [fetchedCharacter, conversation])

  const sendMessage = async (content: string, isUserMessage: boolean = true, isUnhinged: boolean = false) => {
    if (!userId || !chatId || !content.trim()) return
    
    // Optimistically add the user message
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      content,
      role: isUserMessage ? "user" : "assistant",
      createdAt: new Date(),
      conversationId: chatId
    }
    
    setMessages(prev => [...prev, tempMessage])
    
    try {
      // Make sure we pass isUnhinged to the API
      console.log(`useConversation: Sending message with unhinged mode: ${isUnhinged}`)
      const response = await fetch(`/api/conversations/${chatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content, 
          conversationId: chatId,
          role: isUserMessage ? "user" : "assistant",
          isUnhinged // Add this explicitly 
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // Replace the optimistic message and add the AI response
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== tempMessage.id)
        return [...filtered, data.userMessage, data.aiMessage]
      })
      
      // Prevent the refetch that causes the page refresh
      return { userMessage: data.userMessage, aiMessage: data.aiMessage }
    } catch (error) {
      console.error("Error sending message:", error)
      
      // Remove the optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id))
      
      toast.error("Failed to send message", {
        description: "Please try again"
      })
      
      throw error; // Rethrow to allow caller to handle
    }
  }
  
  // Add a function to refresh messages without sending new ones
  const refetchMessages = async () => {
    if (!userId || !chatId) return
    
    try {
      setLoading(true)
      console.log("Manually refreshing messages for chat:", chatId)
      
      const response = await fetch(`/api/conversations/${chatId}?timestamp=${Date.now()}`, {
        cache: 'no-store', // Ensure we're not getting cached data
        headers: {
          'pragma': 'no-cache',
          'cache-control': 'no-cache'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to refresh messages: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log(`Refreshed messages: got ${data.messages?.length || 0} messages`)
      
      // Just update the messages array with the refreshed data
      if (data.messages && Array.isArray(data.messages)) {
        setMessages(data.messages)
      } else {
        console.warn("No messages array in refreshed data:", data)
      }
    } catch (error) {
      console.error("Error refreshing messages:", error)
      toast.error("Failed to refresh messages", {
        description: "Please try again or reload the page"
      })
    } finally {
      setLoading(false)
    }
  }
  
  // Include characterLoading in the overall loading state
  const isLoading = loading || (characterId && characterLoading);
  
  return { 
    conversation, 
    messages, 
    sendMessage, 
    loading: isLoading,
    refetchMessages // Add the new function to the return value
  }
}
