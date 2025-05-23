"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth, useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  PlusCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Settings,
  Plus,
  Book,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSignupDialog } from "@/hooks/use-signup-dialog";
import { CreateCharacterDialog } from "@/components/create-character-dialog";
import { ConversationList } from "./conversation-list";
import { MobileNavigation } from "./mobile-navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ThemeSwitch from "@/components/theme-switch";
import { LuBrainCircuit } from "react-icons/lu";
import { FaRegCompass } from "react-icons/fa";

interface SidebarProps {
  setIsOpen?: (open: boolean) => void;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({ setIsOpen, onCollapsedChange }: SidebarProps) {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const pathname = usePathname();
  const { setIsOpen: setSignupOpen } = useSignupDialog();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const userButtonRef = useRef<HTMLDivElement>(null);

  // Check if the sidebar should be rendered
  const shouldRenderSidebar = !pathname?.startsWith("/admin") && !pathname?.startsWith("/pricing");

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Clear search when navigating
  useEffect(() => {
    setSearchQuery("");
  }, [pathname]);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  useEffect(() => {
    const savedCollapsedState = localStorage.getItem("sidebarCollapsed");
    if (savedCollapsedState !== null && !isMobile) {
      const collapsed = JSON.parse(savedCollapsedState);
      setIsCollapsed(collapsed);
      onCollapsedChange?.(collapsed);
    }
  }, [isMobile, onCollapsedChange]);

  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem("sidebarCollapsed", JSON.stringify(isCollapsed));
    }
  }, [isCollapsed, isMobile]);

  const handleCreateClick = () => {
    if (!isSignedIn) {
      setSignupOpen?.(true);
      return;
    }
    setIsCreateDialogOpen(true);
  };

  const toggleCollapsed = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    onCollapsedChange?.(newCollapsedState);
    if (!isMobile) {
      localStorage.setItem("sidebarCollapsed", JSON.stringify(newCollapsedState));
    }
  };

  if (!shouldRenderSidebar) {
    return null;
  }

  if (isMobile) {
    return (
      <MobileNavigation
        setSignupOpen={setSignupOpen}
        setCreateDialogOpen={setIsCreateDialogOpen}
        isCreateDialogOpen={isCreateDialogOpen}
        isSignedIn={!!isSignedIn}
        displayName={user?.firstName || user?.username || "Guest"}
      />
    );
  }

  return (
    <>
      <aside className={cn("border-r flex flex-col transition-all duration-300 relative bg-sidebar shadow-sm", "h-screen", isCollapsed ? "w-[68px]" : "w-[240px]")}>
        <div className="py-5 px-4 flex items-center justify-between border-b border-border/30 relative">
          <Link href="/" className={cn(
            "flex items-center gap-2", 
            isCollapsed && "justify-center w-full"
          )}>
            <div className={cn("flex items-center justify-center", isCollapsed ? "w-8 h-8" : "w-8 h-8")}>
              <Image 
                src="/logo.png"
                alt="Chatstream Logo"
                width={35}
                height={35}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            {!isCollapsed && <span className="text-sm font-semibold">charstream.xyz</span>}
          </Link>

          <Button 
            variant="ghost" 
            size="icon" 
            className={cn("h-8 w-8 z-30 rounded-full text-muted-foreground hover:text-foreground", 
              isCollapsed && "absolute -right-4 bg-background shadow-sm border border-border/40"
            )}
            onClick={toggleCollapsed}
          >
            {isCollapsed ? 
              <ChevronRight className="h-3.5 w-3.5" /> : 
              <ChevronLeft className="h-3.5 w-3.5" />
            }
          </Button>
        </div>

        <div className="flex flex-col flex-grow overflow-hidden min-h-0">
          <div className="px-3 py-4">
            <TooltipProvider delayDuration={300}>
              <div className="space-y-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleCreateClick}
                      variant="default"
                      className={cn(
                        "justify-start w-fit gap-3 text-black font-extralight rounded-full bg-yellow-300 hover:bg-yellow-400 cursor-pointer",
                        isCollapsed ? "p-2 h-9 w-9 justify-center items-center" : "p-4 h-12"
                      )}
                    >
                      <Plus className={cn(
                        "transition-all",
                        isCollapsed ? "h-5 w-5" : "h-10 w-10"
                      )} />
                      {!isCollapsed && <span className="text-lg font-semibold">Create</span>}
                    </Button>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">Create</TooltipContent>
                  )}
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href="/discover">
                      <Button
                        variant="secondary"
                        className={cn(
                          "w-full justify-start gap-3 font-medium rounded-full mt-2 cursor-pointer",
                          isCollapsed ? "p-2 h-9 w-9 justify-center items-center" : "p-4 h-10"
                        )}
                      >
                        <FaRegCompass className="h-4 w-4" />
                        {!isCollapsed && <span>Discover</span>}
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">Discover</TooltipContent>
                  )}
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href="/wiki">
                      <Button
                        variant="secondary"
                        className={cn(
                          "w-full justify-start  gap-3 font-medium rounded-full hover:bg-neutral-300 hover:text-black mt-2 cursor-pointer",
                          isCollapsed ? "p-2 h-9 w-9 justify-center items-center" : "p-4 h-10"
                        )}
                      >
                        <Book className="h-4 w-4" />
                        {!isCollapsed && <span>Wiki</span>}
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">Wiki</TooltipContent>
                  )}
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>

          {!isCollapsed && (
            <div className="px-3 mb-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 transform text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search conversations"
                  className="pl-8 h-9 text-sm bg-background/50"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
          )}

          {!isCollapsed && (
            <div className="px-4 py-2">
              <h3 className="text-xs font-medium text-neutral-950 dark:text-muted-foreground/70 uppercase tracking-wider">
                {searchQuery ? "Search Results" : "Recent Chats"}
              </h3>
            </div>
          )}

          <div className="flex-grow overflow-y-auto scrollbar-thin">
            <ConversationList isCollapsed={isCollapsed} searchQuery={searchQuery} />
          </div>
        </div>

        <div className={cn("p-3 flex justify-center transition-opacity", isCollapsed && "opacity-0 pointer-events-none")}>
          <div className="w-[4rem] h-[1.5rem] mb-4">
            <ThemeSwitch />
          </div>
        </div>

        <div className={cn(
          "border-t border-border/30 mt-auto",
          isCollapsed ? "px-3 flex justify-center py-3" : "px-8"
        )}>
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={"/pricing"} className={cn(
                  isCollapsed ? "w-9 h-9 flex items-center justify-center" : "w-full"
                )}>
                  <Button 
                    className={cn(
                      "font-medium rounded-full cursor-pointer text-black bg-yellow-300 hover:bg-yellow-400",
                      isCollapsed ? 
                        "h-9 w-9 p-1 animate-pulse" :
                        "w-full justify-center gap-3 mt-2 h-10"
                    )}
                  >  
                    {isCollapsed ? (
                      <LuBrainCircuit className="h-4 w-4" />
                    ) : (
                      <>upgrade to <span className="font-bold -ml-2">charstream+</span></>
                    )}
                  </Button>
                </Link>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right">Upgrade to Charstream+</TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="p-3 border-t border-border/30 mt-auto">
          {isSignedIn ? (
            <div 
              className={cn(
                "flex items-center",
                isCollapsed ? "justify-center" : "justify-between p-3 bg-background/40 rounded-full cursor-pointer"
              )}
              onClick={() => userButtonRef.current?.querySelector('button')?.click()}
              role="button"
            >
              <div className={cn(
                "flex items-center gap-2 mt-0.5",
                isCollapsed && "justify-center"
              )}>
                <div ref={userButtonRef}>
                  <UserButton afterSignOutUrl="/" />
                </div>
                {!isCollapsed && <span className="text-sm font-medium">{user?.firstName || user?.username || "Guest"}</span>}
              </div>
              {!isCollapsed && (
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full cursor-pointer">
                  <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              )}
            </div>
          ) : (
            <div className={cn(
              "flex items-center",
              isCollapsed ? "justify-center" : "justify-between"
            )}>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary">
                ?
              </div>
              {!isCollapsed && (
                <Button
                  size="sm"
                  onClick={() => setIsOpen?.(true)}
                >
                  Sign In
                </Button>
              )}
            </div>
          )}
        </div>

        <div className={cn("mt-3 flex items-center justify-center gap-3 text-[10px] text-neutral-950 dark:text-muted-foreground/60 mb-4 transition-opacity", isCollapsed && "opacity-0 pointer-events-none")}>
          <Link href="#" className="hover:text-muted-foreground">
            Privacy
          </Link>
          <Link href="#" className="hover:text-muted-foreground">
            Terms
          </Link>
          <Link href="#" className="hover:text-muted-foreground">
            Help
          </Link>
        </div>
      </aside>
      
      <CreateCharacterDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </>
  );
}
