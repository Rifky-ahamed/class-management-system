import type React from "react";
import { StudentSidebar } from "@/components/layout/sidebar";
import { StudentHeader } from "@/components/layout/header";
import { checkStudentAccess } from "@/features/auth/auth.service";

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  await checkStudentAccess();

  return (
    <div className="flex h-screen bg-background">
      <StudentSidebar />
      <div className="flex-1 flex flex-col ml-64 overflow-y-auto h-screen">
        <StudentHeader />
        <main className="p-6 mt-20">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;