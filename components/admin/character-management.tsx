"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Plus, Search, RefreshCcw } from "lucide-react"
import { HomeCharacterTable } from "@/components/admin/home-character-table"
import { CharacterTable } from "@/components/admin/character-table"
import { useRouter } from "next/navigation"

export function CharacterManagement() {
  const [activeTab, setActiveTab] = useState("home-characters")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const handleRefresh = () => {
    setIsRefreshing(true)
    // Refresh the data
    setTimeout(() => {
      setIsRefreshing(false)
      router.refresh()
    }, 500)
  }

  return (
    <div className="container p-6 mx-auto">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Character Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage AI characters in the Chatstream platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
          </Button>
          <Button variant="outline" onClick={() => router.push('/admin/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </header>

      <div className="flex items-center justify-between mb-4">
        <Tabs defaultValue="home-characters" className="w-full" onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="home-characters">Home Characters</TabsTrigger>
            <TabsTrigger value="user-characters">User Characters</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-4 mt-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search characters..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {activeTab === "home-characters" && (
              <AddHomeCharacterDialog />
            )}
          </div>

          <TabsContent value="home-characters" className="mt-4">
            <HomeCharacterTable searchQuery={searchQuery} />
          </TabsContent>
          
          <TabsContent value="user-characters" className="mt-4">
            <CharacterTable searchQuery={searchQuery} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function AddHomeCharacterDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("popular")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name) {
      toast.error("Name is required")
      return
    }
    
    try {
      setIsLoading(true)
      
      const response = await fetch("/api/admin/home-characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          category
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to create character: ${errorText || response.statusText}`)
      }
      
      toast.success("Character created successfully")
      setOpen(false)
      resetForm()
      router.refresh()
      
    } catch (error: any) {
      toast.error(error.message || "Failed to create character")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setName("")
    setDescription("")
    setCategory("popular")
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" /> Add Character
      </Button>
      
      <Dialog open={open} onOpenChange={(newOpen) => {
        if (isLoading) return
        setOpen(newOpen)
        if (!newOpen) resetForm()
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Home Character</DialogTitle>
            <DialogDescription>
              Create a new character that will appear on the home page
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
                  placeholder="Describe your character"
                  disabled={isLoading}
                  className="h-20"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="category">Category*</Label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={isLoading}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="popular">Popular</option>
                  <option value="educational">Educational</option>
                </select>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!name || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Character"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
