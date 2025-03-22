"use client"

import { usePathname } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminAuthProvider } from "@/lib/admin-auth"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  // Don't show the sidebar on the login page
  const isLoginPage = pathname === "/admin"
  
  if (isLoginPage) {
    return <>{children}</>
  }
  
  return (
    <AdminAuthProvider>
      <div className="flex min-h-screen">
        <AdminSidebar />
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </AdminAuthProvider>
  )
}
