import Image from "next/image";
import Link from "next/link";
import { Search, ChevronLeft, BookOpen, Home, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth, useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

export function Header() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const pathname = usePathname();

  // Get user's first name or username for display
  const displayName = user?.firstName || user?.username || "Guest";

  // Get user's initials for avatar if no image available
  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return displayName[0].toUpperCase();
  };

  // Navigation items
  const navItems = [
    { path: "/discover", label: "Characters", icon: Users },
    { path: "/wiki", label: "Wiki", icon: BookOpen },
  ];

  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-neutral-200 dark:border-[#222222] bg-background backdrop-blur-sm backdrop-filter">
      <div className="flex items-center gap-6">
        <div className="flex items-center">
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`px-3 py-2 rounded-md text-sm flex items-center transition-colors ${
                    isActive 
                      ? "bg-primary/10 text-primary font-medium" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      
      {/* Center section - search */}
      <div className="hidden sm:block relative w-[300px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search for Characters"
          className="pl-9 h-9 bg-muted/50 border-input focus-visible:ring-1 focus-visible:ring-primary"
        />
      </div>
      
      {/* Right section - user info */}
      <div className="flex items-center gap-4">
        {/* Mobile navigation */}
        <div className="md:hidden flex space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`p-2 rounded-md flex items-center justify-center transition-colors ${
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
              </Link>
            );
          })}
        </div>

        <div className="flex items-center">
          <div className="mr-3 text-right hidden sm:block">
            <p className="text-xs text-muted-foreground">
              {isSignedIn ? `Welcome back,` : `Welcome to Chatstream,`}
            </p>
            <p className="text-sm font-medium">
              {displayName}
            </p>
          </div>
          
          {isSignedIn ? (
            user?.imageUrl ? (
              <div className="w-8 h-8 rounded-full overflow-hidden border border-border">
                <Image
                  src={user.imageUrl}
                  alt={displayName}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary">
                {getInitials()}
              </div>
            )
          ) : (
            <Button variant="secondary" size="sm" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
