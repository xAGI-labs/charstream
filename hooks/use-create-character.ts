"use client"

import { create } from "zustand"

interface CreateCharacterStore {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export const useCreateCharacter = create<CreateCharacterStore>((set) => ({
  isOpen: false,
  setIsOpen: (open: boolean) => set({ isOpen: open }),
}))
