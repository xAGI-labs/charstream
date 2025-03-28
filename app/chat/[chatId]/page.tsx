"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { ChatHeader } from "@/components/chat/chat-header"
import { ChatMessages } from "@/components/chat/chat-messages"
import { ChatInput } from "@/components/chat/chat-input"
import { ChatModeSwitcher, ChatMode } from "@/components/chat/chat-mode-switcher"
import { CharacterInfo } from "@/components/chat/character-info" 
import { VoiceChat } from "@/components/chat/voice-chat"
import { VideoChat } from "@/components/chat/video-chat"
import { useConversation } from "@/hooks/use-conversation"
import { useSignupDialog } from "@/hooks/use-signup-dialog"
import { toast } from "sonner"
import { useIsMobile } from "@/hooks/use-mobile"

export default function ChatPage() {
  const { chatId } = useParams()
  const { userId } = useAuth()
  const { conversation, messages, sendMessage: originalSendMessage, loading, refetchMessages } = useConversation(chatId as string)
  const [isWaiting, setIsWaiting] = useState(false)
  const [chatMode, setChatMode] = useState<ChatMode>("text")
  const { setIsOpen } = useSignupDialog()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isUnhinged, setIsUnhinged] = useState(false)
  const isMobile = useIsMobile()
  
  // Check localStorage for sidebar collapsed state on component mount
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed')
    if (savedState !== null) {
      setSidebarCollapsed(JSON.parse(savedState))
    }
  }, [])
  
  // Listen for changes to sidebar collapsed state
  useEffect(() => {
    const handleStorageChange = () => {
      const savedState = localStorage.getItem('sidebarCollapsed')
      if (savedState !== null) {
        setSidebarCollapsed(JSON.parse(savedState))
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])
  
  // Add a mode change handler that fetches latest messages when changing modes
  const handleModeChange = async (newMode: ChatMode) => {
    console.log(`Switching mode from ${chatMode} to ${newMode}`)
    
    // If switching from voice to text, refresh messages to ensure we have the latest
    if (chatMode === "voice" && newMode === "text") {
      await refetchMessages()
    }
    
    setChatMode(newMode)
  }
  
  // Debug conversation data
  useEffect(() => {
    if (conversation) {
      console.log("Chat Page - Conversation data:", {
        id: conversation.id,
        title: conversation.title,
        hasCharacter: !!conversation.character,
        characterId: conversation.characterId,
        characterName: conversation.character?.name,
        messagesCount: messages.length
      });
      
      // Log warning if character data is missing
      if (!conversation.character) {
        console.warn("Chat Page - Character data missing in conversation", { 
          conversationId: conversation.id,
          characterId: conversation.characterId 
        });
      }
    }
  }, [conversation, messages]);

  // Update isUnhinged state to be more directly connected
  useEffect(() => {
    console.log(`Unhinged mode changed to: ${isUnhinged}`);
  }, [isUnhinged]);

  // Update sendMessage to include unhinged state without depending on setMessages
  const sendMessage = async (content: string, isUserMessage: boolean = true) => {
    try {
      setIsWaiting(true)
      
      // API request - explicitly log the unhinged state
      console.log(`Sending message with unhinged mode: ${isUnhinged}`)
      
      // For user messages, we need to use the useConversation hook's sendMessage
      // to ensure proper UI updates, but we need to modify it to include unhinged mode
      if (isUserMessage) {
        // Add user message through hook to update local UI immediately
        await originalSendMessage(content, isUserMessage, isUnhinged);
      } else {
        // Direct API call for non-user messages
        const response = await fetch(`/api/conversations/${chatId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            content,
            isUnhinged  // Pass the current state directly
          })
        })
        
        if (!response.ok) {
          throw new Error("Failed to send message")
        }
      }
      
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message")
    } finally {
      setIsWaiting(false)
    }
  }

  const deleteChat = async () => {
    if (!chatId) return;
    try {
      const response = await fetch(`/api/conversations/${chatId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete chat");
      }

      toast.success("Chat deleted successfully");
      window.location.href = "/"; // Redirect to home after deletion
    } catch (error) {
      console.error("Error deleting chat:", error);
      toast.error("Failed to delete chat");
    }
  };

  // Authentication check
  if (!userId) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="bg-card p-8 rounded-xl shadow-lg text-center max-w-md">
          <h2 className="text-2xl font-semibold mb-4">Sign In Required</h2>
          <p className="text-muted-foreground mb-6">Please sign in to access your conversations.</p>
          <a href="/" className="bg-primary text-primary-foreground px-6 py-3 rounded-lg inline-block hover:bg-primary/90 transition-colors">
            Return to Home
          </a>
        </div>
      </div>
    )
  }
  
  // Prepare character data for components with proper type handling
  const characterData = conversation?.character 
    ? {
        name: conversation.character.name,
        description: conversation.character.description || "No description available.", // Add description fallback
        imageUrl: conversation.character.imageUrl || undefined
      }
    : (conversation?.characterId 
        ? {
            id: conversation.characterId,
            name: "AI Assistant", 
            description: "No description available.",
            imageUrl: undefined
          } 
        : undefined);
  
  return (
    <div className="flex h-screen overflow-hidden bg-muted/10">
      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 overflow-hidden relative">
        {/* Chat Header - pass loading as boolean */}
        <ChatHeader 
          character={characterData}
          title={conversation?.title}
          loading={!!loading} // Ensure it's boolean
          isUnhinged={isUnhinged}
          onUnhingedChange={setIsUnhinged}
          onDeleteChat={deleteChat} // Pass deleteChat function
        />
        
        {/* Mode Switcher - with updated handler - pass character name */}
        <div className="bg-background/70 backdrop-blur-sm border-b border-border/40 py-1.5 shadow-sm">
          <div className="container max-w-4xl mx-auto px-4">
            <ChatModeSwitcher 
              mode={chatMode} 
              setMode={handleModeChange}
              characterName={characterData?.name} 
            />
          </div>
        </div>
        
        {/* Messages Area with gradient background - hide when in voice or video mode */}
        <div className={`flex-1 overflow-hidden relative bg-gradient-to-b from-background to-background/95 ${chatMode === 'voice' || chatMode === 'video' ? 'hidden' : ''}`}>
          <div className="absolute inset-0 overflow-y-auto">
            <ChatMessages 
              messages={messages} 
              loading={loading === true} // Ensure boolean type
              isWaiting={!!isWaiting} // Ensure boolean type
              character={characterData}
              mode={chatMode} // Pass the chat mode to messages component
            />
          </div>
        </div>
        
        {/* Voice mode area - takes up full space when in voice mode */}
        {chatMode === 'voice' && (
          <div className="flex-1 overflow-hidden relative">
            <VoiceChat 
              characterId={conversation?.characterId || ""}
              onMessageSent={async (content, isUserMessage) => {
                // Special case for refreshing messages after voice chat
                if (content === "__REFRESH_MESSAGES__") {
                  console.log("Refreshing messages from voice chat")
                  await refetchMessages()
                  return
                }
                
                // Regular message handling
                if (isUserMessage === true || isUserMessage === undefined) {
                  await sendMessage(content, true)
                } else {
                  await sendMessage(content, false)
                }
              }}
              disabled={loading === true}
              isWaiting={!!isWaiting}
              isUnhinged={isUnhinged}
              characterName={characterData?.name || "AI Assistant"}
              characterAvatarUrl={characterData?.imageUrl}
            />
          </div>
        )}
        
        {/* Video mode area */}
        {chatMode === 'video' && (
          <div className="flex-1 overflow-hidden relative">
            <VideoChat 
              characterId={conversation?.characterId || ""}
              characterName={characterData?.name || "AI Assistant"}
              disabled={loading === true}
              onModeChange={(newMode: ChatMode) => setChatMode(newMode)}
            />
          </div>
        )}
        
        {/* Chat Input - only show in text mode */}
        {chatMode === 'text' && (
          <ChatInput 
            onSend={async (content, isUserMessage) => {
              // Special case for refreshing messages after voice chat
              if (content === "__REFRESH_MESSAGES__") {
                console.log("Received refresh message request from voice chat")
                await refetchMessages()
                setIsWaiting(false)
                return
              }
              
              // Set waiting state manually
              setIsWaiting(true)
              
              // Regular message handling
              if (isUserMessage === true || isUserMessage === undefined) {
                // For user messages, pass the unhinged state through our modified sendMessage
                await sendMessage(content, true)
              } else {
                // For AI messages
                await sendMessage(content, false)
              }
            }}
            disabled={loading === true} // Ensure boolean type
            isWaiting={!!isWaiting} // Ensure boolean type
            setIsWaiting={setIsWaiting}
            mode={chatMode}
            characterId={conversation?.characterId} // Make sure this is passed correctly
            isUnhinged={isUnhinged} // Pass the unhinged state to ChatInput
            characterName={characterData?.name}
            characterAvatarUrl={characterData?.imageUrl}
          />
        )}
      </div>
    </div>
  )
}
