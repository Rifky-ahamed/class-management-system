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
    <header className="h-20 bg-gradient-to-r from-xb-primary to-xb-secondary dark:from-card dark:to-card fixed top-0 left-64 w-[calc(100%-16rem)] z-10 shadow-lg backdrop-blur-sm border-b border-white/10 dark:border-white/5">
      <div className="flex h-20 items-center justify-between px-6">
        {/* Left Section - You can add breadcrumbs or title here */}
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold text-white/90">Dashboard</h1>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center space-x-3">
          {/* Notifications Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative hover:bg-white/10 text-white/80 hover:text-white transition-all duration-200 rounded-lg h-10 w-10 group"
          >
            <Bell className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-red-500 text-white border-2 border-xb-primary dark:border-card animate-pulse shadow-lg">
              3
            </Badge>
          </Button>

          {/* Theme Toggle Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            className="hover:bg-white/10 text-white/80 hover:text-white transition-all duration-200 rounded-lg h-10 w-10 group relative overflow-hidden"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 group-hover:scale-110" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 group-hover:scale-110" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* User Menu Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="hover:bg-white/10 text-white/80 hover:text-white transition-all duration-200 rounded-lg h-10 w-10 group"
              >
                <User className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-background border-border w-48 shadow-xl rounded-lg"
            >
              <div className="px-3 py-2 border-b border-border">
                <p className="text-sm font-medium text-foreground">Admin User</p>
                <p className="text-xs text-muted-foreground">admin@example.com</p>
              </div>
              <DropdownMenuItem className="text-foreground cursor-pointer hover:bg-accent transition-colors">
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="text-foreground cursor-pointer hover:bg-accent transition-colors">
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-destructive cursor-pointer hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}