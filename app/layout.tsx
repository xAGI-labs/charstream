import type React from "react";
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import "../styles/clerk.css";
import { ThemeProvider } from "@/components/theme-provider";
import ThemeContextProvider from "@/context/theme-context";
import ThemeSwitch from "@/components/theme-switch";
import { PostHogProvider } from "@/components/providers/posthog-provider";

export const metadata: Metadata = {
  title: "charstream.xyz | Personalized AI Characters for every moment of your day",
  description: "Chat with AI characters and create your own",
};

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
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <PostHogProvider>
          <ClerkProvider>
            <ThemeContextProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="dark"
                enableSystem={false}
                storageKey="chatstream-theme"
              >
                {children}
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
                <ThemeSwitch />
              </ThemeProvider>
            </ThemeContextProvider>
          </ClerkProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
