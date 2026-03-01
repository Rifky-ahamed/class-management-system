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
      const { error } = await supabase.auth.signInWithPassword({
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

      {/* ── Left Panel — Brand / Illustration ── */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center p-12
                      bg-linear-to-br from-edu-900 via-edu-800 to-edu-900">

        {/* decorative background blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-edu-700/30 rounded-full blur-3xl -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-edu-600/20 rounded-full blur-3xl -ml-36 -mb-36" />
        <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent pointer-events-none" />

        {/* geometric accent lines */}
        <div className="absolute top-1/4 left-8 w-px h-32 bg-linear-to-b from-transparent via-edu-400/40 to-transparent" />
        <div className="absolute bottom-1/4 right-8 w-px h-32 bg-linear-to-b from-transparent via-edu-400/40 to-transparent" />
        <div className="absolute top-8 left-1/4 h-px w-32 bg-linear-to-r from-transparent via-edu-400/40 to-transparent" />

        <div className="relative z-10 text-center">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <div className="w-24 h-24 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shadow-2xl border border-white/20">
              <SafeImage
                src="/your-logo-2.png"
                alt="Logo"
                width={80}
                height={80}
                unoptimized
                className="h-16 w-16 object-contain"
              />
            </div>
          </div>

          {/* brand text */}
          <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
            Class Management
          </h1>
          <p className="text-edu-300 text-sm max-w-xs mx-auto leading-relaxed">
            A centralized platform for managing students, teachers, classes and payments.
          </p>

          {/* decorative stat pills */}
          <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
            {[
              { label: "Students",   value: "Track" },
              { label: "Teachers",   value: "Manage" },
              { label: "Classes",    value: "Schedule" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-4 py-2"
              >
                <span className="text-edu-300 text-xs font-medium">{item.value}</span>
                <span className="w-1 h-1 rounded-full bg-edu-400" />
                <span className="text-white text-xs font-semibold">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel — Login Form ── */}
      <div className="w-full lg:w-1/2 bg-surface-app flex flex-col items-center justify-center p-8 sm:p-12 relative">

        {/* subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, var(--edu-500) 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative w-full max-w-md space-y-8">

          {/* heading */}
          <div className="space-y-2">
            {/* mobile logo */}
            <div className="flex lg:hidden items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-edu-900 flex items-center justify-center">
                <SafeImage
                  src="/your-logo-2.png"
                  alt="Logo"
                  width={28}
                  height={28}
                  unoptimized
                  className="h-7 w-7 object-contain"
                />
              </div>
              <span className="font-bold text-(--text-heading) text-base">
                Class Management
              </span>
            </div>

            <h2 className="text-3xl font-bold text-(--text-heading) tracking-tight">
              Welcome Back
            </h2>
            <p className="text-(--text-secondary) text-sm">
              Sign in to access your admin dashboard
            </p>
          </div>

          {/* form */}
          <form onSubmit={handleLogin} className="space-y-5">

            {error && (
              <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-(--text-body) text-sm font-medium"
              >
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-(--text-secondary)" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="pl-10 h-11 border-(--border-input) bg-surface-card text-(--text-body)
                             focus:border-(--border-input-focus) focus:ring-0
                             placeholder:text-(--text-disabled)"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-(--text-body) text-sm font-medium"
              >
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-(--text-secondary)" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="pl-10 pr-10 h-11 border-(--border-input) bg-surface-card text-(--text-body)
                             focus:border-(--border-input-focus) focus:ring-0
                             placeholder:text-(--text-disabled)"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent
                             text-(--text-secondary) hover:text-(--text-body)"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword
                    ? <EyeOff className="h-4 w-4" />
                    : <Eye className="h-4 w-4" />
                  }
                </Button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowForgotPasswordModal(true)}
                className="text-sm font-medium text-edu-500 hover:text-edu-700 hover:underline transition-colors cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full h-11 text-sm font-semibold
                         bg-edu-500 hover:bg-edu-600 active:bg-edu-700
                         text-white shadow-md hover:shadow-lg
                         transition-all duration-200"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Sign In"
              )}
            </Button>

          </form>

          {/* footer note */}
          <p className="text-center text-xs text-(--text-disabled)">
            Having trouble? Contact{" "}
            <a
              href="mailto:support@nexuscore.com"
              className="text-edu-500 hover:text-edu-700 hover:underline transition-colors"
            >
              support@nexuscore.com
            </a>
          </p>
        </div>
      </div>

      {/* ── Forgot Password Modal ── */}
      <Dialog open={showForgotPasswordModal} onOpenChange={setShowForgotPasswordModal}>
        <DialogContent className="sm:max-w-md bg-surface-card border-(--border-card)">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-edu-100">
                <HelpCircle className="h-5 w-5 text-edu-600" />
              </div>
              <DialogTitle className="text-xl text-(--text-heading)">
                Forgot Password?
              </DialogTitle>
            </div>
            <DialogDescription asChild>
              <div className="space-y-4 pt-2">
                <p className="text-sm text-(--text-secondary)">
                  For password assistance, please contact your admin or reach out to NexusCore support.
                </p>

                {/* contact card */}
                <div className="flex items-center gap-3 p-4 bg-surface-app rounded-lg border border-(--border-default)">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-edu-100 shrink-0">
                    <Mail className="h-4 w-4 text-edu-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-(--text-body) mb-0.5">
                      Contact Support
                    </p>
                    <a
                      href="mailto:support@nexuscore.com"
                      className="text-edu-500 hover:text-edu-700 font-semibold text-sm transition-colors break-all"
                    >
                      support@nexuscore.com
                    </a>
                  </div>
                </div>

                {/* security note */}
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-(--text-disabled) mt-0.5 shrink-0" />
                  <p className="text-xs text-(--text-disabled) leading-relaxed">
                    Your security is important to us. All password reset requests are handled securely through our support team.
                  </p>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default LoginPage;
