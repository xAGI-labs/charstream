"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PricingPage() {

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12 relative">
      {/* Close Button */}
      <Link href="/" passHref>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4"
        >
          ✖
        </Button>
      </Link>

      <h1 className="text-4xl font-extrabold mb-8 text-center">
        Upgrade to <span className="dark:text-yellow-300 text-primary">charstream+</span>
      </h1>
      <p className="text-lg text-muted-foreground mb-12 text-center max-w-2xl">
        Unlock premium features to enhance your experience. Choose the plan that works best for you!
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl">
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">⚡ Turbo Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>Unlimited faster messages</CardDescription>
          </CardContent>
        </Card>
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">🧠 Better Memory</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>Characters remember more</CardDescription>
          </CardContent>
        </Card>
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">🎨 Customize Your Chats</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>Colors, backgrounds, and more</CardDescription>
          </CardContent>
        </Card>
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">✨ Special Perks</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>Priority access to select new features</CardDescription>
          </CardContent>
        </Card>
      </div>
      <div className="mt-12 text-center">
        <Button className="bg-primary text-primary-foreground px-8 py-4 text-lg font-medium">
          🚀 Subscribe for $9.99/mo
        </Button>
        <p className="text-sm text-muted-foreground mt-4">
          Auto renews monthly until canceled
        </p>
      </div>
    </div>
  );
}
