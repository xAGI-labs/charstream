"use client"

import { useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { PlusCircle, Info } from "lucide-react"
import { FaWaveSquare } from "react-icons/fa"
import { Button } from "@/components/ui/button"

export default function CharacterFooter() {
  useEffect(() => {
    // Check if user has a theme preference in localStorage or use system preference
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    document.documentElement.classList.toggle("dark", prefersDark)

    // Listen for changes in system preference
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle("dark", e.matches)
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  return (
    <footer className="relative w-full overflow-hidden py-16 px-4 transition-colors duration-300 dark:bg-[#000000] bg-gray-100">
      {/* Floating avatars */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/4 transform -translate-x-1/2 -translate-y-1/2">
          <Image
            src="/logo.png"
            width={40}
            height={40}
            alt="Avatar"
            className="rounded-xl opacity-70 mb-2"
          />
        </div>
        <div className="absolute left-1/4 top-1/3 transform -translate-x-1/2 -translate-y-1/2">
          <Image
            src="/1.jpg"
            width={40}
            height={40}
            alt="Avatar"
            className="rounded-full opacity-70"
          />
        </div>
        <div className="absolute right-1/4 top-1/3 transform -translate-x-1/2 -translate-y-1/2">
          <Image
            src="/4.jpg"
            width={40}
            height={40}
            alt="Avatar"
            className="rounded-full opacity-70"
          />
        </div>
      </div>

      {/* Audio wave icon */}
      <div className="absolute left-1/5 top-1/5">
        <FaWaveSquare className="text-gray-400 dark:text-gray-600 text-xl" />
      </div>
      <div className="absolute right-1/5 top-1/3">
        <FaWaveSquare className="text-gray-400 dark:text-gray-600 text-xl" />
      </div>

      {/* Character images */}
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex justify-center items-center gap-4 mt-20">
        <Image
          src="/6.jpg"
          width={80}
          height={80}
          alt="Character"
          className="rounded-xl"
        />
        <Image
          src="/3.jpg"
          width={100}
          height={100}
          alt="Character"
          className="rounded-xl"
        />
        <Image
          src="/4.jpg"
          width={80}
          height={80}
          alt="Character"
          className="rounded-xl"
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center mt-20 text-center">
        <h2 className="text-3xl font-bold mb-4 dark:text-white text-gray-900">Create a Character</h2>
        <p className="max-w-md mb-6 dark:text-gray-300 text-gray-600">
          Not vibing with any Characters? Create one of your own! Customize things like their voice, conversation
          starts, their tone, and more!
        </p>
        <Button className="rounded-full px-6 py-2 flex items-center gap-2 bg-white text-gray-900 hover:bg-gray-100 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100">
          <PlusCircle className="h-4 w-4" />
          <span>Create a Character</span>
        </Button>
      </div>

      {/* Footer links */}
      <div className="relative z-10 flex flex-wrap justify-center mt-24 space-x-4 md:space-x-6 text-sm">
        <Link href="#" className="dark:text-gray-400 text-gray-600 hover:underline">
          About
        </Link>
        <Link href="#" className="dark:text-gray-400 text-gray-600 hover:underline">
          Characters
        </Link>
        <Link href="#" className="dark:text-gray-400 text-gray-600 hover:underline">
          Careers
        </Link>
        <Link href="#" className="dark:text-gray-400 text-gray-600 hover:underline">
          Blog
        </Link>
        <Link href="#" className="dark:text-gray-400 text-gray-600 hover:underline">
          Research
        </Link>
      </div>

      {/* Info icon */}
      <div className="absolute bottom-4 right-4">
        <Button variant="ghost" size="icon" className="rounded-full dark:text-gray-400 text-gray-600">
          <Info className="h-5 w-5" />
          <span className="sr-only">Information</span>
        </Button>
      </div>
    </footer>
  )
}

