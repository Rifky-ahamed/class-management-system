
import type React from "react";
import { Toaster } from "@/components/ui/sonner";


const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-surface-app">
      {children}
      <Toaster richColors closeButton position="top-right" />
    </div>
  );
};

export default AuthLayout;
