"use client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
    <div className="w-64 bg-gradient-to-b from-xb-primary to-xb-secondary dark:from-card dark:to-card fixed top-0 left-0 h-screen flex flex-col shadow-2xl">
      {/* Header Section */}
      <div className="h-20 border-b border-white/10 dark:border-white/5 backdrop-blur-sm">
        <Link href="/" className="flex items-center h-full px-4 group">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center group-hover:bg-white/20 transition-all duration-300 shadow-lg">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-bold text-base text-white block leading-tight">
                Your Business Name
              </span>
              <p className="text-[10px] text-white/70 font-medium">Admin Core v1.0.0</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation Section */}
      <ScrollArea className="flex-1 px-3 py-6">
        <nav className="space-y-1">
          {navigation.map(item => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Button
                key={item.name}
                variant="ghost"
                className={cn(
                  "w-full justify-start text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 h-11 rounded-lg font-medium text-sm group relative overflow-hidden",
                  isActive &&
                    "bg-white/15 text-white shadow-lg backdrop-blur-sm hover:bg-white/20 border border-white/20"
                )}
                asChild
              >
                <Link href={item.href}>
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full" />
                  )}
                  <item.icon className={cn(
                    "mr-3 h-4 w-4 transition-transform duration-200",
                    isActive ? "scale-110" : "group-hover:scale-110"
                  )} />
                  <span className="truncate">{item.name}</span>
                </Link>
              </Button>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Sign Out Section */}
      <div className="p-3 border-t border-white/10 dark:border-white/5 backdrop-blur-sm">
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className="w-full justify-start text-white/80 hover:text-white hover:bg-red-500/20 transition-all duration-200 h-11 rounded-lg font-medium text-sm group"
        >
          <LogOut className="mr-3 h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};