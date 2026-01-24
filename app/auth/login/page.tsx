"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  HelpCircle,
  Shield,
} from "lucide-react";
import { SafeImage } from "@/components/shared/safe-image";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }
      router.push("/");
      
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex w-1/2 bg-linear-to-tr from-xb-primary to-xb-secondary items-center justify-center p-12 relative overflow-hidden">
        {/* Abstract background effect */}
        <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent pointer-events-none" />

        <div className="text-center z-10">
          <div className="mb-6 flex justify-center">
            {/* Logo Placeholder - Replace with client's logo */}
            <SafeImage
              src="/your-logo-2.png"
              alt="Logo"
              width={120}
              height={120}
              unoptimized
              className="h-96 w-96"
            />
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col items-center justify-center p-8 sm:p-12 relative">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
              Welcome Back
            </h2>
            <p className="text-gray-500 text-sm">
              Please login to your dashboard
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <Alert
                variant="destructive"
                className="animate-in fade-in slide-in-from-top-2"
              >
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="pl-10 h-12 border-gray-200 bg-white text-xb-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="pl-10 pr-10 h-12 border-gray-200 bg-white text-xb-primary"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowForgotPasswordModal(true)}
                className="text-sm font-medium text-xb-secondary hover:underline cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base bg-xb-primary text-white shadow-lg hover:shadow-xl hover:bg-xb-primary/90 transition-all duration-200"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <Dialog
            open={showForgotPasswordModal}
            onOpenChange={setShowForgotPasswordModal}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-xb-primary/10">
                    <HelpCircle className="h-6 w-6 text-xb-primary" />
                  </div>
                  <DialogTitle className="text-2xl">
                    Forgot Password?
                  </DialogTitle>
                </div>
                <DialogDescription className="text-base text-gray-600 pt-4 space-y-4">
                  <p>
                    For password assistance, please contact your admin or
                    reach out to NexusCore support.
                  </p>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-xb-secondary/10 shrink-0">
                      <Mail className="h-5 w-5 text-xb-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Contact Support
                      </p>
                      <a
                        href="mailto:support@NexusCore.com"
                        className="text-xb-secondary hover:text-xb-primary font-semibold text-sm transition-colors break-all"
                      >
                        support@NexusCore.com
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 pt-2">
                    <Shield className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-gray-500">
                      Your security is important to us. All password reset
                      requests are handled securely through our support team.
                    </p>
                  </div>
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>

          <div className="pt-8 text-center space-y-4">
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
    </div>
  );
};
export default LoginPage;
