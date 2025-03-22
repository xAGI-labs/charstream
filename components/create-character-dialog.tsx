"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import Image from "next/image"
import { toast } from "sonner"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

interface CreateCharacterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCharacterDialog({ open, onOpenChange }: CreateCharacterDialogProps) {
  const { userId } = useAuth()
  const router = useRouter()
  
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [instructions, setInstructions] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState<string>("")
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!userId || !name) {
      toast.error("Missing information", {
        description: "Please provide at least a character name"
      })
      return
    }
    
    try {
      setIsLoading(true)
      setCurrentStep("Creating character...")
      
      const response = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          instructions,
          isPublic
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create character: ${errorText || response.statusText}`);
      }
      
      const data = await response.json()
      
      toast.success("Character created!", {
        description: `${name} is ready to chat`
      })
      
      onOpenChange(false)
      
      // Create a new conversation with this character
      setCurrentStep("Starting conversation...")
      const convResponse = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId: data.id })
      })
      
      if (!convResponse.ok) {
        throw new Error("Failed to create conversation")
      }
      
      const convData = await convResponse.json()
      
      // Redirect to the chat page
      router.push(`/chat/${convData.id}`)
    } catch (error: any) {
      console.error("Error creating character:", error)
      toast.error("Error creating character", {
        description: error.message || "Please try again later"
      })
    } finally {
      setIsLoading(false)
      setCurrentStep("")
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (isLoading) return; // Prevent closing while loading
      onOpenChange(newOpen);
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create a new character</DialogTitle>
          <DialogDescription>
            Create your own AI character to chat with. We'll enhance your description to make the character accurate and engaging.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name*</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Character name"
                disabled={isLoading}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your character (we'll enhance this automatically)"
                disabled={isLoading}
                className="h-20"
              />
              <p className="text-xs text-muted-foreground">
                Provide basic details, and we'll enhance it with AI to create an accurate character.
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="instructions">
                Custom Instructions <span className="text-xs text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Leave blank for automatic generation, or provide your own detailed instructions"
                className="h-24"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                We'll automatically generate instructions if you leave this blank.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                id="isPublic"
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                disabled={isLoading}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isPublic">Make this character public</Label>
            </div>
          </div>
          
          <DialogFooter>
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{currentStep}</span>
              </div>
            ) : null}
            <Button 
              type="submit" 
              disabled={!name || isLoading}
            >
              {isLoading ? "Creating..." : "Create Character"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
