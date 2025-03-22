import Image from "next/image"

export function HeroSection() {
  return (
    <div className="flex justify-center items-center py-8">
      <div className="relative w-full max-w-7xl mx-auto rounded-xl shadow-lg overflow-hidden bg-gradient-to-r from-purple-600 via-neutral-500 to-blue-500">
        <div className="px-10 py-16">
          <div className="max-w-xl">
            <div className="text-sm text-gray-200 mb-1">What do you want to do today?</div>
            <h1 className="text-2xl font-medium text-white mb-3">Chat with your favorite characters</h1>
            <p className="text-sm text-gray-200">
              Talk to Harry Potter, Chota Bheem, or create your own video character!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
