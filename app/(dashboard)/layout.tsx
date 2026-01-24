import type React from "react";
import { AdminSidebar } from "@/components/layout/sidebar";
import { AdminHeader } from "@/components/layout/header";
import { checkAdminAccess } from "@/features/auth/auth.service";

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  await checkAdminAccess();

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col ml-64">
        <AdminHeader />
        <main className="p-6 mt-16">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
