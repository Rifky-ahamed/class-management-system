"use client";
import { Card, CardContent } from "@/components/ui/card";

export default function NoticesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Notices</h1>
        <p className="text-sm text-neutral-500 mt-1">View announcements published by the admin.</p>
      </div>
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-3xl mb-2 opacity-30">📢</p>
          <p className="text-[13px] font-semibold text-neutral-500">Notices feature coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
