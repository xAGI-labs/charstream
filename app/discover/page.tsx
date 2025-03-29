import { Metadata } from "next"
import DiscoverPageContent from "@/components/discover/discover-page-content"
import ThemeContextProvider from "@/context/theme-context"
import { GhiblifyAdSection } from "@/components/ghiblify-ad-section"

export const metadata: Metadata = {
  title: "Discover Characters - Chatstream",
  description: "Discover AI characters to chat with on Chatstream",
}

export default function DiscoverPage() {
  return (
    <ThemeContextProvider>
    <section className="mx-4 md:mx-10">
      <GhiblifyAdSection />
    </section>
    <div className="flex h-screen">
        <DiscoverPageContent />
    </div>
    </ThemeContextProvider>
  )
}
