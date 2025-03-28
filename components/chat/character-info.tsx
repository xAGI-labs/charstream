"use client"

import Image from "next/image"

interface CharacterInfoProps {
  name: string
  description: string
  avatarUrl?: string
  author?: string
}

export function CharacterInfo({ name, description, avatarUrl, author }: CharacterInfoProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-transparent dark:text-white text-black rounded-lg w-full">
      <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-[#232323] dark:border-[#e0e0e0]">
        {avatarUrl ? (
          <Image src={avatarUrl || "/placeholder.svg"} alt={name} fill sizes="64px" className="object-cover" />
        ) : (
          <div className="bg-primary/20 h-full w-full flex items-center justify-center">
            <span className="text-primary font-bold text-xl">{name[0]}</span>
          </div>
        )}
      </div>
      <div className="mt-2 text-center">
        <h3 className="text-lg font-medium text-black dark:text-white">{name}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 md:px-56">{description}</p>
        {author && <p className="text-xs text-gray-700 dark:text-gray-500 mt-1">By {author}</p>}
      </div>
    </div>
  )
}

