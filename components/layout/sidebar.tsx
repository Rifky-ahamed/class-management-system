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
  { name: "Dashboard",             href: "/",               icon: LayoutDashboard },
  { name: "Manage Students",       href: "/manage-students", icon: CircleUser      },
  { name: "Manage Teachers",       href: "/manage-teachers", icon: GraduationCap   },
  { name: "Class and Batch Management",    href: "/class-batch-management",     icon: Landmark        },
  { name: "Manage Class Schedules",href: "/class-schedules", icon: Calendar        },
  { name: "Manage Attendance",     href: "/attendance",      icon: CalendarCheck   },
  { name: "Manage Payments",       href: "/payments",        icon: CreditCard      },
  { name: "Requests",              href: "/requests",        icon: Wrench          },
  { name: "Reports",               href: "/reports",         icon: BarChart3       },
  { name: "Settings",              href: "/settings",        icon: Settings        },
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
    <div className="
      w-64 fixed top-0 left-0 h-screen flex flex-col
      bg-linear-to-b from-edu-900 to-edu-800
      dark:from-card dark:to-card
      shadow-2xl
    ">

      {/* ── Logo / Brand ── */}
      <div className="h-20 border-b border-white/10 dark:border-white/5 shrink-0">
        <Link href="/" className="flex items-center h-full px-4 group">
          <div className="flex items-center space-x-3">
            {/* icon bubble */}
            <div className="
              w-10 h-10 rounded-xl
              bg-white/10 backdrop-blur-md
              flex items-center justify-center
              group-hover:bg-white/20
              transition-all duration-300 shadow-lg
            ">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            {/* text */}
            <div>
              <span className="font-bold text-sm text-white block leading-tight">
                Your Business Name
              </span>
              <p className="text-[10px] text-edu-300 font-medium mt-0.5">
                Admin Core v1.0.0
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* ── Navigation ── */}
      <ScrollArea className="flex-1 px-3 py-5">
        {/* section label */}
        <p className="text-[10px] font-semibold tracking-widest uppercase text-edu-400 px-3 mb-3">
          Main Menu
        </p>

        <nav className="space-y-0.5">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Button
                key={item.name}
                variant="ghost"
                className={cn(
                  // base
                  "w-full justify-start h-10 rounded-lg font-medium text-sm",
                  "transition-all duration-200 group relative overflow-hidden",
                  // inactive
                  "text-edu-300 hover:text-white hover:bg-white/10",
                  // active
                  isActive && [
                    "bg-edu-500 text-white",
                    "hover:bg-edu-500 hover:text-white",
                    "shadow-md shadow-edu-900/50",
                  ]
                )}
                asChild
              >
                <Link href={item.href}>
                  {/* active left accent bar */}
                  {isActive && (
                    <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-white rounded-r-full" />
                  )}

                  <item.icon
                    className={cn(
                      "mr-3 h-4 w-4 shrink-0 transition-transform duration-200",
                      isActive
                        ? "text-white"
                        : "text-edu-400 group-hover:text-white group-hover:scale-110"
                    )}
                  />
                  <span className="truncate">{item.name}</span>
                </Link>
              </Button>
            );
          })}
        </nav>
      </ScrollArea>

      {/* ── Sign Out ── */}
      <div className="p-3 border-t border-white/10 dark:border-white/5 shrink-0">
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className="
            w-full justify-start h-10 rounded-lg
            font-medium text-sm
            text-edu-300 hover:text-white
            hover:bg-danger-500/20
            transition-all duration-200 group
          "
        >
          <LogOut className="mr-3 h-4 w-4 text-edu-400 group-hover:text-danger-400 group-hover:scale-110 transition-all duration-200" />
          Sign Out
        </Button>
      </div>

    </div>
  );
};
