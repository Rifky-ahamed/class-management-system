"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, Mail, Phone, Calendar as CalendarIcon, MapPin, Loader2, Save } from "lucide-react";

const supabase = createClient();

type TeacherProfile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  dob: string | null;
  address: string | null;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("teachers")
      .select("id, name, email, phone, address")
      .eq("email", user.email)
      .single();

    if (data) {
      setProfile(data as TeacherProfile);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!profile) return;
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setSaving(true);
    setMessage(null);

    const { error } = await supabase
      .from("teachers")
      .update({
        name: profile.name,
        phone: profile.phone,
        address: profile.address,
      })
      .eq("id", profile.id);

    if (error) {
      setMessage({ text: "Failed to update profile. Please try again.", type: "error" });
      console.error(error);
    } else {
      setMessage({ text: "Profile updated successfully!", type: "success" });
    }
    setSaving(false);

    // Clear success message after 3 seconds
    setTimeout(() => setMessage(null), 3000);
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">My Profile</h1>
          <p className="text-sm text-neutral-500 mt-1">View and update your personal information.</p>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/4 mb-2" />
            <Skeleton className="h-4 w-1/3" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <User className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-neutral-900">Profile Not Found</h3>
          <p className="text-sm text-neutral-500">We couldn't load your profile information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-black text-neutral-900 tracking-tight">My Profile</h1>
        <p className="text-sm text-neutral-500 mt-1">View and update your personal information.</p>
      </div>

      <form onSubmit={handleSave}>
        <Card className="shadow-sm">
          <CardHeader className="border-b border-neutral-100 bg-neutral-50/50 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-edu-100 flex items-center justify-center text-edu-600 text-xl font-bold shadow-inner">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <CardTitle className="text-xl">{profile.name}</CardTitle>
                <CardDescription className="flex items-center gap-1.5 mt-1">
                  <Mail className="w-3.5 h-3.5" />
                  {profile.email}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="w-4 h-4 text-neutral-400" />
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  required
                  value={profile.name}
                  onChange={handleChange}
                  className="bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-neutral-400" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  disabled
                  value={profile.email}
                  className="bg-neutral-50 text-neutral-500 cursor-not-allowed"
                />
                <p className="text-[11px] text-neutral-400">Contact administrator to change your email.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-neutral-400" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  value={profile.phone || ""}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  className="bg-white"
                />
              </div>

            </div>

            <div className="space-y-2 pt-2 border-t border-neutral-100">
              <Label htmlFor="address" className="flex items-center gap-2 mt-4">
                <MapPin className="w-4 h-4 text-neutral-400" />
                Address
              </Label>
              <Textarea
                id="address"
                name="address"
                value={profile.address || ""}
                onChange={handleChange}
                placeholder="Full residential address..."
                className="resize-none h-24 bg-white"
              />
            </div>
          </CardContent>
          <CardFooter className="border-t border-neutral-100 bg-neutral-50/50 flex items-center justify-between py-4">
            <div className="flex-1">
              {message && (
                <p className={`text-sm font-medium ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  {message.text}
                </p>
              )}
            </div>
            <Button 
              type="submit" 
              disabled={saving}
              className="bg-edu-600 hover:bg-edu-700 min-w-[120px] gap-2"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
