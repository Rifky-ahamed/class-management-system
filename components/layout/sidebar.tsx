"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SafeImage } from "@/components/shared/safe-image";

import {
  BarChart3,
  Landmark,
  LayoutDashboard,
  LogOut,
  GraduationCap,
  Settings,
  CalendarCheck,
  CircleUser,  
  Calendar,
  CreditCard,
  Wrench,
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Manage Students",
    href: "/students",
    icon: CircleUser,  
  },
  {
    name: "Manage Teachers",
    href: "/teachers",
    icon: GraduationCap,
  },
  {
    name: "Manage Class Rooms",
    href: "/class-rooms",
    icon: Landmark,
  },
  {
    name: "Manage class Schedules",
    href: "/class-schedules",
    icon: Calendar,
  },
  {
    name: "Manage Attendance",
    href: "/attendance",
    icon: CalendarCheck,
  },
  {
    name: "Manage Payments",
    href: "/payments",
    icon: CreditCard,
  },
  {
    name: "requests",
    href: "/requests",
    icon: Wrench,
  },
  {
    name: "Reports",
    href: "/reports",
    icon: BarChart3,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export const AdminSidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <div className="w-64 bg-xb-primary dark:bg-card fixed top-0 left-0 h-screen">
      <div className="h-16 border-b border-white/20 dark:border-card">
        <Link href="/" className="flex items-center space-x-2 py-2 px-4">
          <div className="flex items-center">
            <SafeImage
              src="/your-logo.png"
              alt="Logo"
              width={100}
              height={100}
              className="h-12 w-12"
            />
            <div>
              <span className="font-bold text-lg text-white truncate">
                Your Business Name
              </span>
              <p className="text-xs text-white">Admin Core - v1.0.0</p>
            </div>
          </div>
        </Link>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-2">
          {navigation.map(item => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Button
                key={item.name}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start text-white",
                  isActive &&
                    "bg-secondary text-secondary-foreground dark:text-white dark:bg-background",
                )}
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Link>
              </Button>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="p-3 border-t border-white/20 dark:border-background">
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className="w-full justify-start text-white"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>

      <div className="fixed bg-white bottom-0 left-0 w-64 rounded-tr-2xl border-r-5 border-xb-primary dark:border-xb-secondary">
        <div>
          <p className="text-xs text-gray-700 flex items-center justify-center cursor-default">
            Powered by{" "}
            <SafeImage
              src="/nexuscore-text.png"
              onClick={() => window.open("https://www.NexusCore.com", "_blank")}
              alt="NexusCore"
              width={100}
              height={100}
              className="h-8 w-20 -ml-1.5 cursor-pointer"
            />
          </p>
        </div>
      </div>
    </div>
  );
};
