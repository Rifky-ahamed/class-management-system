"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Settings,
  Bell,
  Shield,
  UserCircle,
  Building2,
  Mail,
  Key,
  Globe,
  Save,
  Smartphone
} from "lucide-react";

type Tab = "general" | "notifications" | "security";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Settings updated successfully");
    }, 1000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] gap-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-neutral-900">System Settings</h1>
        <p className="text-sm text-neutral-500">Manage global configurations and administrative preferences.</p>
      </div>

      <div className="flex flex-1 overflow-hidden border border-neutral-200 rounded-xl bg-white shadow-sm">
        
        {/* Left Settings Sidebar */}
        <div className="w-64 border-r border-neutral-100 bg-neutral-50/50 p-4 space-y-1 shrink-0">
          <button
            onClick={() => setActiveTab("general")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "general" 
                ? "bg-edu-100 text-edu-900" 
                : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
            }`}
          >
            <Settings className="w-4 h-4" />
            General
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "notifications" 
                ? "bg-edu-100 text-edu-900" 
                : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
            }`}
          >
            <Bell className="w-4 h-4" />
            Notifications
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "security" 
                ? "bg-edu-100 text-edu-900" 
                : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
            }`}
          >
            <Shield className="w-4 h-4" />
            Security
          </button>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-white">
          <div className="max-w-2xl">
            
            {activeTab === "general" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div>
                  <h2 className="text-lg font-bold text-neutral-900">General Information</h2>
                  <p className="text-sm text-neutral-500">Update your institution's core details.</p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-neutral-400" />
                      Institution Name
                    </Label>
                    <Input defaultValue="Global Excel Academy" className="max-w-md" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-neutral-400" />
                      Contact Email
                    </Label>
                    <Input defaultValue="admin@globalexcel.edu" type="email" className="max-w-md" />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-neutral-400" />
                      Timezone
                    </Label>
                    <Input defaultValue="Asia/Kolkata (GMT+5:30)" className="max-w-md bg-neutral-50" readOnly />
                    <p className="text-[11px] text-neutral-500">Timezone is locked to the database server timezone.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div>
                  <h2 className="text-lg font-bold text-neutral-900">Notification Preferences</h2>
                  <p className="text-sm text-neutral-500">Control how the system sends automated alerts.</p>
                </div>
                
                <div className="space-y-4">
                  <Card className="p-4 flex items-start gap-4">
                    <div className="mt-1">
                      <Checkbox id="notif-email" defaultChecked />
                    </div>
                    <div>
                      <Label htmlFor="notif-email" className="text-base font-semibold block cursor-pointer">Email Summaries</Label>
                      <p className="text-sm text-neutral-500 mt-1">Receive daily summary reports of attendance and fee collections.</p>
                    </div>
                  </Card>
                  
                  <Card className="p-4 flex items-start gap-4">
                    <div className="mt-1">
                      <Checkbox id="notif-sms" defaultChecked />
                    </div>
                    <div>
                      <Label htmlFor="notif-sms" className="text-base font-semibold block cursor-pointer">Fee Reminders (SMS)</Label>
                      <p className="text-sm text-neutral-500 mt-1">Automatically send SMS reminders to students 3 days before fee deadlines.</p>
                    </div>
                  </Card>
                  
                  <Card className="p-4 flex items-start gap-4">
                    <div className="mt-1">
                      <Checkbox id="notif-app" defaultChecked />
                    </div>
                    <div>
                      <Label htmlFor="notif-app" className="text-base font-semibold block cursor-pointer">In-App Alerts</Label>
                      <p className="text-sm text-neutral-500 mt-1">Show push notifications for new teacher requests and assignment submissions.</p>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div>
                  <h2 className="text-lg font-bold text-neutral-900">Security & Authentication</h2>
                  <p className="text-sm text-neutral-500">Manage security policies and administrator access.</p>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-neutral-900 border-b pb-2">Change Password</h3>
                    <div className="space-y-2">
                      <Label>Current Password</Label>
                      <Input type="password" placeholder="••••••••" className="max-w-md" />
                    </div>
                    <div className="space-y-2">
                      <Label>New Password</Label>
                      <Input type="password" placeholder="••••••••" className="max-w-md" />
                    </div>
                    <Button variant="outline">Update Password</Button>
                  </div>

                  <div className="space-y-4 pt-6 border-t">
                    <h3 className="text-sm font-semibold text-neutral-900">Advanced Security</h3>
                    
                    <Card className="p-4 flex items-start gap-4 bg-orange-50/50 border-orange-100">
                      <div className="mt-1">
                        <Checkbox id="sec-2fa" />
                      </div>
                      <div>
                        <Label htmlFor="sec-2fa" className="text-base font-semibold text-orange-900 block cursor-pointer">Require 2FA for Teachers</Label>
                        <p className="text-sm text-orange-700/80 mt-1">Force all teachers to configure Two-Factor Authentication via Authenticator app before logging in.</p>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            )}

            {/* Sticky Save Button */}
            <div className="mt-8 pt-6 border-t border-neutral-100 flex justify-end">
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="bg-edu-600 hover:bg-edu-700 text-white min-w-[120px]"
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Save Changes
                  </span>
                )}
              </Button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
