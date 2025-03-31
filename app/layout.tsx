import type React from "react";
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import "../styles/clerk.css";
import ThemeSwitch from "@/components/theme-switch";
import { PostHogProvider } from "@/components/providers/posthog-provider";
import { RootLayoutContent } from "@/components/layout/root-layout-content";
import ThemeContextProvider from "@/context/theme-context";

export const metadata: Metadata = {
  title: "Chatstream.xyz - Create AI Characters and Chat With Them",
  description: "Create custom AI characters, chat with popular fictional personalities, and bring your imagination to life with Chatstream.xyz - The ultimate AI character platform.",
  keywords: "ai characters, chatbots, character creation, ai chat, roleplay characters, virtual companions, chatstream, AI Chat, chatgpt, character.ai, ai chat, virtual characters, interactive storytelling, AI companions, character creation platform, chat with characters, AI personalities, fictional characters, roleplay chatbots, AI character platform, chat, AI interaction, AI character design, AI roleplay, virtual characters, interactive chatbots, AI storytelling, character interaction, AI personality creation, chat with AI characters, create your own character, charstream, charstream.xyz, chatstream.xyz, character creation, realcharacters, chat with characters, AI characters, chatbots, roleplay characters, virtual companions, interactive storytelling, AI companions, character creation platform, chat with characters, AI personalities, fictional characters, roleplay chatbots",
  openGraph: {
    title: "Chatstream.xyz - AI Character Creation Platform",
    description: "Create and chat with AI characters that feel real. Bring your favorite fictional characters to life or create entirely new ones.",
    url: "https://chatstream.xyz",
    siteName: "Chatstream.xyz",
    images: [
      {
        url: "https://chatstream.xyz/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Chatstream.xyz - AI Character Creation Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chatstream.xyz - Create AI Characters and Chat With Them",
    description: "Create custom AI characters, chat with popular fictional personalities, and bring your imagination to life with Chatstream.xyz",
    images: ["https://chatstream.xyz/twitter-image.jpg"],
  },
  robots: "index, follow",
  themeColor: "#ffffff",
  alternates: {
    canonical: "https://chatstream.xyz",
  },
}


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ThemeContextProvider>
          <PostHogProvider>
            <ClerkProvider>
              <RootLayoutContent>
                {children}
              </RootLayoutContent>
              <ThemeSwitch />
              <Toaster
                position="top-center"
                toastOptions={{
                  style: {
                    background: "#030303",
                    color: "#fff",
                    border: "1px solid #444",
                  },
                }}
              />
            </ClerkProvider>
          </PostHogProvider>
        </ThemeContextProvider>
      </body>
    </html>
  );
}
