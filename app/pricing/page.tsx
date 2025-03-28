"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PricingPage() {

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8 sm:py-12 relative">
      {/* Close Button */}
      <Link href="/" passHref>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 sm:top-4 sm:right-4"
        >
          ✖
        </Button>
      </Link>

      <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-4 sm:mb-6 md:mb-8 text-center">
        Upgrade to <span className="dark:text-yellow-300 text-primary">charstream+</span>
      </h1>
      <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-6 sm:mb-8 md:mb-12 text-center max-w-xs sm:max-w-lg md:max-w-2xl">
        Unlock premium features to enhance your experience. Choose the plan that works best for you!
      </p>
      
      {/* Card grid - more responsive with smaller gaps on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 w-full max-w-[90%] sm:max-w-[85%] md:max-w-6xl">
        <Card className="p-4 sm:p-6">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg font-semibold">⚡ Turbo Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-sm sm:text-base">Unlimited faster messages</CardDescription>
          </CardContent>
        </Card>
        <Card className="p-4 sm:p-6">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg font-semibold">🧠 Better Memory</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-sm sm:text-base">Characters remember more</CardDescription>
          </CardContent>
        </Card>
        <Card className="p-4 sm:p-6">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg font-semibold">🎨 Customize Your Chats</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-sm sm:text-base">Colors, backgrounds, and more</CardDescription>
          </CardContent>
        </Card>
        <Card className="p-4 sm:p-6">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg font-semibold">✨ Special Perks</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-sm sm:text-base">Priority access to select new features</CardDescription>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8 sm:mt-10 md:mt-12 text-center">
        <Button className="bg-primary text-primary-foreground px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg font-medium w-full sm:w-auto">
          🚀 Subscribe for $9.99/mo
        </Button>
        <p className="text-xs sm:text-sm text-muted-foreground mt-2 sm:mt-4">
          Auto renews monthly until canceled
        </p>
      </div>
    </div>
  );
}
