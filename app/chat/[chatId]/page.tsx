"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { Sidebar } from "@/components/sidebar/sidebar"
import { ChatHeader } from "@/components/chat/chat-header"
import { ChatMessages } from "@/components/chat/chat-messages"
import { ChatInput } from "@/components/chat/chat-input"
import { ChatModeSwitcher, ChatMode } from "@/components/chat/chat-mode-switcher"
import { useConversation } from "@/hooks/use-conversation"
import { useSignupDialog } from "@/hooks/use-signup-dialog"
import { toast } from "sonner"
import { useIsMobile } from "@/hooks/use-mobile"
import { MobileNavigation } from "@/components/sidebar/mobile-navigation"

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
        // Convert null to undefined for imageUrl to satisfy ChatHeader props
        imageUrl: conversation.character.imageUrl || undefined
      }
    : (conversation?.characterId 
        ? {
            id: conversation.characterId,
            name: "AI Assistant", // Placeholder name while character loads
            imageUrl: undefined
          } 
        : undefined);
  
  return (
    <div className="flex h-screen overflow-hidden bg-muted/10">
      {/* Sidebar - Completely hide on mobile */}
      {!isMobile && (
        <div
          className="h-full min-h-screen flex-shrink-0 transition-all duration-300"
          style={{ width: sidebarCollapsed ? '68px' : '240px' }}
        >
          <Sidebar setIsOpen={setIsOpen} onCollapsedChange={setSidebarCollapsed} />
        </div>
      )}

      {/* Mobile Navigation - explicitly render on mobile */}
      {isMobile && (
        <MobileNavigation
          isSignedIn={!!userId}
          setSignupOpen={setIsOpen}
          setCreateDialogOpen={() => {}}
          isCreateDialogOpen={false}
          displayName=""
        />
      )}

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 overflow-hidden relative">
        {/* Chat Header - pass loading as boolean */}
        <ChatHeader 
          character={characterData}
          title={conversation?.title}
          loading={!!loading} // Ensure it's boolean
          isUnhinged={isUnhinged}
          onUnhingedChange={setIsUnhinged}
        />
        
        {/* Mode Switcher - with updated handler */}
        <div className="bg-background/70 backdrop-blur-sm border-b border-border/40 py-1.5 shadow-sm">
          <div className="container max-w-4xl mx-auto px-4">
            <ChatModeSwitcher mode={chatMode} setMode={handleModeChange} />
          </div>
        </div>
        
        {/* Messages Area with gradient background for visual interest */}
        <div className="flex-1 overflow-hidden relative bg-gradient-to-b from-background to-background/95">
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
        
        {/* Chat Input */}
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
        />
      </div>
    </div>
  )
}
