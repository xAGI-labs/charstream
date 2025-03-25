import Image from "next/image";
import { Search, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth, useUser } from "@clerk/nextjs";

export function Header() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  // Get user's first name or username for display
  const displayName = user?.firstName || user?.username || "Guest";

  // Get user's initials for avatar if no image available
  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return displayName[0].toUpperCase();
  };

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-neutral-200 dark:border-[#222222]">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 mr-2 text-gray-500"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="flex items-center">
            <span className="text-sm font-medium text-neutral-950 dark:text-white">
              {isSignedIn ? `Welcome back,` : `Welcome to Chatstream,`}
            </span>
          </div>
          <div className="flex items-center">
            {isSignedIn ? (
              <>
                {user?.imageUrl ? (
                  <div className="w-5 h-5 rounded-full overflow-hidden mr-2">
                    <Image
                      src={user.imageUrl}
                      alt={displayName}
                      width={20}
                      height={20}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full bg-[#333333] mr-2 flex items-center justify-center text-xs text-white">
                    {getInitials()}
                  </div>
                )}
                <span className="text-sm text-black dark:text-gray-300">
                  {displayName}
                </span>
              </>
            ) : (
              <span className="text-sm text-dark dark:text-gray-300">
                Guest
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="relative w-[300px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-black dark:text-gray-500" />
        <Input
          type="search"
          placeholder="Search for Characters"
          className="pl-9 h-9 bg-neutral-200 dark:bg-[#1a1a1a] border-neutral-500 dark:border-[#222222] focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>
    </header>
  );
}
