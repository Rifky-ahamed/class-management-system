"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { Bell, LogOut, Moon, Sun, User } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";

export function AdminHeader() {
  const router = useRouter();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="
      h-20 fixed top-0 left-64 w-[calc(100%-16rem)] z-10
      bg-linear-to-r from-edu-900 to-edu-800
      dark:from-card dark:to-card
      shadow-lg border-b border-white/10 dark:border-white/5
      backdrop-blur-sm
    ">
      <div className="flex h-20 items-center justify-between px-6">

        {/* Left — page title / breadcrumb */}
        <div className="flex items-center space-x-4">
          <h1 className="text-base font-semibold text-white/90 tracking-wide">
            Dashboard
          </h1>
        </div>

        {/* Right — action buttons */}
        <div className="flex items-center space-x-2">

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative hover:bg-white/10 text-white/70 hover:text-white transition-all duration-200 rounded-lg h-10 w-10 group"
          >
            <Bell className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
            <Badge className="
              absolute -top-1 -right-1 h-5 w-5
              flex items-center justify-center p-0 text-[10px]
              bg-danger-500 text-white
              border-2 border-edu-900 dark:border-card
              animate-pulse shadow-md
            ">
              3
            </Badge>
          </Button>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="hover:bg-white/10 text-white/70 hover:text-white transition-all duration-200 rounded-lg h-10 w-10 group relative overflow-hidden"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 group-hover:scale-110" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 group-hover:scale-110" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-white/10 text-white/70 hover:text-white transition-all duration-200 rounded-lg h-10 w-10 group"
              >
                <User className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-52 bg-background border border-border shadow-xl rounded-lg overflow-hidden"
            >
              {/* User info header */}
              <div className="px-3 py-3 bg-edu-50 dark:bg-edu-100/10 border-b border-border">
                <p className="text-sm font-semibold text-(--text-heading)">
                  Admin User
                </p>
                <p className="text-xs text-(--text-secondary)">
                  admin@example.com
                </p>
              </div>

              <DropdownMenuItem className="text-foreground cursor-pointer hover:bg-edu-50 dark:hover:bg-edu-100/10 transition-colors gap-2">
                <User className="h-4 w-4 text-edu-500" />
                Profile
              </DropdownMenuItem>

              <DropdownMenuItem className="text-foreground cursor-pointer hover:bg-edu-50 dark:hover:bg-edu-100/10 transition-colors gap-2">
                <Bell className="h-4 w-4 text-edu-500" />
                Notifications
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-border" />

              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-danger-600 cursor-pointer hover:bg-danger-100/50 dark:hover:bg-danger-100/10 transition-colors gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </div>
    </header>
  );
}
