"use client"

import { useState, useEffect } from "react"
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from "@/components/ui/dialog"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { 
  MoreVertical, 
  Trash2, 
  Loader2, 
  Image as ImageIcon, 
  RefreshCw,
  AlertCircle,
  Pencil 
} from "lucide-react"
import { toast } from "sonner"
import NextImage from "next/image"
import { useRouter } from "next/navigation"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { Input } from "../ui/input"

interface Character {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  creatorId: string
  isPublic: boolean
  createdAt: string
}

interface CharacterTableProps {
  searchQuery: string
}

export function CharacterTable({ searchQuery }: CharacterTableProps) {
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [regeneratingImageId, setRegeneratingImageId] = useState<string | null>(null)
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null)
  const pageSize = 10
  const router = useRouter()

  useEffect(() => {
    fetchCharacters()
  }, [currentPage, searchQuery])

  const fetchCharacters = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/admin/characters?page=${currentPage}&limit=${pageSize}&search=${encodeURIComponent(searchQuery)}`
      )
      
      if (!response.ok) {
        throw new Error("Failed to fetch characters")
      }
      
      const data = await response.json()
      setCharacters(data.characters)
      setTotalPages(Math.ceil(data.total / pageSize))
    } catch (error) {
      console.error("Error fetching characters:", error)
      toast.error("Failed to load characters")
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleDeleteClick = (id: string) => {
    setDeletingId(id)
    setConfirmDeleteOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingId) return
    
    try {
      const response = await fetch(`/api/admin/characters/${deletingId}`, {
        method: "DELETE"
      })
      
      if (!response.ok) {
        throw new Error("Failed to delete character")
      }
      
      toast.success("Character deleted successfully")
      fetchCharacters()
    } catch (error) {
      console.error("Error deleting character:", error)
      toast.error("Failed to delete character")
    } finally {
      setDeletingId(null)
      setConfirmDeleteOpen(false)
    }
  }

  const handleRegenerateImage = async (id: string) => {
    try {
      setRegeneratingImageId(id)
      
      const response = await fetch(`/api/admin/characters/${id}/regenerate-image`, {
        method: "POST"
      })
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to regenerate image: ${errorData}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast.success("Image successfully regenerated");
      } else {
        toast.warning("Image regeneration completed with issues");
      }
      
      // Refresh the character list to show the updated image
      await fetchCharacters();
    } catch (error) {
      console.error("Error regenerating image:", error);
      toast.error(error instanceof Error ? error.message : "Failed to regenerate image");
    } finally {
      setRegeneratingImageId(null);
    }
  }

  const handleEditClick = (character: Character) => {
    setEditingCharacter(character)
  }

  if (loading && characters.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div>
      <Table>
        <TableCaption>A list of user characters in the system</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Creator</TableHead>
            <TableHead>Public</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {characters.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center h-24">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mb-2" />
                  <p>No characters found</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            characters.map((character) => (
              <TableRow key={character.id}>
                <TableCell>
                  <div className="h-12 w-12 relative rounded-md overflow-hidden bg-muted">
                    {character.imageUrl ? (
                      <NextImage
                        src={character.imageUrl}
                        alt={character.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-muted text-muted-foreground">
                        <ImageIcon className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{character.name}</TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {character.description || "—"}
                </TableCell>
                <TableCell>{character.creatorId.substring(0, 8)}...</TableCell>
                <TableCell>{character.isPublic ? "Yes" : "No"}</TableCell>
                <TableCell>{new Date(character.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleEditClick(character)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleRegenerateImage(character.id)}
                        disabled={regeneratingImageId === character.id}
                      >
                        {regeneratingImageId === character.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Regenerating...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Regenerate Image
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => handleDeleteClick(character.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            
            {Array.from({ length: totalPages }).map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  isActive={currentPage === i + 1}
                  onClick={() => handlePageChange(i + 1)}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the character
              and all associated conversations from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {deletingId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Character Dialog */}
      {editingCharacter && (
        <EditCharacterDialog 
          character={editingCharacter} 
          onClose={() => setEditingCharacter(null)} 
          onSuccess={() => {
            setEditingCharacter(null)
            fetchCharacters()
          }}
        />
      )}
    </div>
  )
}

interface EditCharacterDialogProps {
  character: Character
  onClose: () => void
  onSuccess: () => void
}

function EditCharacterDialog({ character, onClose, onSuccess }: EditCharacterDialogProps) {
  const [name, setName] = useState(character.name)
  const [description, setDescription] = useState(character.description || "")
  const [isPublic, setIsPublic] = useState(character.isPublic)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name) {
      toast.error("Name is required")
      return
    }
    
    try {
      setIsLoading(true)
      
      const response = await fetch(`/api/admin/characters/${character.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          isPublic
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to update character: ${errorText || response.statusText}`)
      }
      
      toast.success("Character updated successfully")
      onSuccess()
      
    } catch (error: any) {
      toast.error(error.message || "Failed to update character")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Character</DialogTitle>
          <DialogDescription>
            Update details for this character
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
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                disabled={isLoading}
                className="h-4 w-4"
              />
              <Label htmlFor="isPublic">Public character</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
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
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
