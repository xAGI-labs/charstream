import { create } from 'zustand'

type SignupDialogState = {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

export const useSignupDialog = create<SignupDialogState>((set) => ({
  isOpen: false,
  setIsOpen: (isOpen) => set({ isOpen })
}))

