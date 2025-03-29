"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export function GhiblifyAdSection() {
  return (
    <div className="relative w-full min-h-[400px] text-white mt-10">
      {/* Background Image */}
      <div className="absolute inset-0 z-0 rounded-4xl overflow-hidden">
        <Image
          src="/ghiblify-bg.gif"
          alt="Studio Ghibli style artwork background"
          fill
          className="object-cover rounded-xl shadow-accent-foreground"
          priority
        />
      </div>

      {/* Content Container */}
      <div className="relative z-10 container mx-auto px-6 py-16 flex flex-col md:flex-row items-start justify-between gap-8">
        {/* Left Side - Heading */}
        <div className="md:w-1/3 pt-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-6">
            Transform Your Photos into Ghibli Magic
          </h1>
          <p className="text-neutral-50 mb-4">
            Experience the magic of Studio Ghibli with our AI-powered image generator. Create stunning Ghibli-style avatars and illustrations effortlessly.
          </p>
          <Link href="/ghiblify">
            <button className="px-6 py-3 bg-yellow-400 text-black font-semibold rounded-full hover:bg-yellow-500 transition">
              Try Ghiblify Now
            </button>
          </Link>
        </div>

        {/* Right Side - Feature Cards */}
        <div className="md:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-gray-100/50 dark:bg-neutral-800/80 border-0 text-neutral-900 dark:text-white overflow-hidden">
            <CardContent className="p-4">
              <h2 className="text-lg font-medium mb-2">AI-Powered Transformation</h2>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Upload your photo and let our AI work its magic to create a Studio Ghibli-inspired masterpiece.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-100/50 dark:bg-gray-800/80 border-0 text-neutral-900 dark:text-white overflow-hidden">
            <CardContent className="p-4">
              <h2 className="text-lg font-medium mb-2">Perfect for Avatars</h2>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Create unique and enchanting avatars that stand out, inspired by the magic of Studio Ghibli.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}