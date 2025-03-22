import type React from "react"
import type { Metadata } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css"
import "../styles/clerk.css"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: "Charstream | AI Characters",
  description: "Chat with AI characters and create your own",
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
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <ClerkProvider>
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
                }
              }}
            />
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}

