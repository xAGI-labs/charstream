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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem('theme');
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const theme = savedTheme || (prefersDark ? 'dark' : 'light');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {
                  console.error('Failed to initialize theme:', e);
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
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
      </body>
    </html>
  );
}
