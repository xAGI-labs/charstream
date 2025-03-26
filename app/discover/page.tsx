import { Metadata } from "next"
import DiscoverPageContent from "@/components/discover/discover-page-content"
import ThemeContextProvider from "@/context/theme-context"

export const metadata: Metadata = {
  title: "Discover Characters - Chatstream",
  description: "Discover AI characters to chat with on Chatstream",
}

export default function DiscoverPage() {
  return (
    <ThemeContextProvider>
    <div className="flex h-screen">
        <DiscoverPageContent />
    </div>
    </ThemeContextProvider>
  )
}
