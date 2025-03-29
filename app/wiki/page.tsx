import { Metadata } from "next"
import WikiPageContent from "@/components/wiki/wiki-page-content"
import ThemeContextProvider from "@/context/theme-context"

export const metadata: Metadata = {
  title: "Character Wiki - chatstream.xyz",
  description: "Browse character wikis on Chatstream",
}

export default function WikiPage() {
  return (
    <ThemeContextProvider>
      <div className="flex h-screen">
        <WikiPageContent />
      </div>
    </ThemeContextProvider>
  )
}
