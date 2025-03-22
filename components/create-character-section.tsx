import Image from "next/image"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

// Helper function to generate avatar URLs
const getAvatarUrl = (name: string, size = 100) => {
  return `https://robohash.org/${encodeURIComponent(name)}?size=${size}x${size}&set=set4`
}

export function CreateCharacterSection() {
  return (
    <section>
      <div className="bg-gradient-to-r from-[#1a1a1a] to-[#222222] rounded-lg p-6 border border-[#333333]">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-4 md:mb-0 md:mr-6">
            <h2 className="text-lg font-medium text-white mb-2 flex items-center">
              Create Your Own Video Character <Sparkles className="ml-2 h-4 w-4 text-yellow-400" />
            </h2>
            <p className="text-sm text-gray-400 max-w-md">
              Turn any photo and voice into an interactive AI friend. Perfect for kids to chat with their own
              creations!
            </p>
            <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">Get Started</Button>
          </div>
          <div className="flex space-x-2">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#333333]">
              <Image
                src={getAvatarUrl("Custom character boy", 64)}
                alt="Custom character"
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#333333]">
              <Image
                src={getAvatarUrl("Custom character girl", 64)}
                alt="Custom character"
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#333333]">
              <Image
                src={getAvatarUrl("Custom character robot", 64)}
                alt="Custom character"
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
