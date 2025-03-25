export interface Character {
  id: string
  name: string
  description?: string | null
  imageUrl?: string | null
  category?: string
  isPublic?: boolean
  createdAt?: string | Date
  updatedAt?: string | Date
  creatorId?: string
}
