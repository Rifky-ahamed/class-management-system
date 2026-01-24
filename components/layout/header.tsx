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
    <header className="h-16 bg-linear-to-r from-xb-primary to-xb-secondary dark:bg-linear-to-r dark:from-card dark:to-xb-primary fixed top-0 left-64 w-[calc(100%-16rem)] z-10">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center space-x-4" />

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" className="relative">
            <Bell className="h-5 w-5 " />
            <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive text-white">
              3
            </Badge>
          </Button>

          <Button variant="outline" size="icon" onClick={toggleTheme}>
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 " />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-white" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-background border-border"
            >
              <DropdownMenuItem className="text-foreground">
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="text-foreground">
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-foreground"
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
