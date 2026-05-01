"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const supabase = createClient();

// ── Types ─────────────────────────────────────────────────────────────────────
type TodayClass = {
  id: string;
  batch_id: string;
  batch_name: string;
  class_name: string;
  subject_name: string | null;
  start_time: string;
  end_time: string;
  room: string | null;
  session_id: string | null;
  is_locked: boolean;
};

type PastSession = {
  id: string;
  session_date: string;
  batch_name: string;
  class_name: string;
  present: number;
  total: number;
  rate: number;
  is_locked: boolean;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(t: string) {
  if (!t) return "—";
  const [h, m] = t.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function rateColor(rate: number) {
  if (rate >= 80) return "text-emerald-600";
  if (rate >= 60) return "text-amber-600";
  return "text-red-500";
}

function rateBadge(rate: number) {
  if (rate >= 80) return "bg-emerald-100 text-emerald-700 border-emerald-500/20";
  if (rate >= 60) return "bg-amber-100 text-amber-700 border-amber-500/20";
  return "bg-red-100 text-red-700 border-red-500/20";
}

function getTodayDateStr() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// ── Page Component ────────────────────────────────────────────────────────────
export default function TeacherAttendancePage() {
  const router = useRouter();

  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [todayClasses, setTodayClasses] = useState<TodayClass[]>([]);
  const [pastSessions, setPastSessions] = useState<PastSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingId, setCreatingId] = useState<string | null>(null);

  const todayStr = getTodayDateStr();
  const todayDow = new Date().getDay();

  const fetchData = useCallback(async () => {
    setLoading(true);

    // 1. Get auth user -> teacher_id
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user?.email) {
      console.error("Auth error or no email:", authError);
      setLoading(false);
      return;
    }

    const { data: teacherData, error: teacherError } = await supabase
      .from("teachers")
      .select("id")
      .eq("email", user.email)
      .single();

    if (teacherError || !teacherData) {
      console.error("Teacher fetch error:", teacherError);
      setLoading(false);
      return;
    }

    const tid = teacherData.id;
    setTeacherId(tid);

    // 2. Fetch today's schedule
    const { data: scheduleData } = await supabase
      .from("class_schedule")
      .select(`
        id, start_time, end_time, room, batch_id,
        batch:batch_id (
          name,
          class:class_id ( class ),
          subject:subject_id ( name )
        )
      `)
      .eq("teacher_id", tid)
      .eq("day_of_week", todayDow)
      .eq("is_active", true)
      .order("start_time");

    // 3. Fetch today's sessions (to check if already taken)
    const { data: todaySessionsData } = await supabase
      .from("attendance_session")
      .select("id, batch_id, is_locked")
      .eq("teacher_id", tid)
      .eq("session_date", todayStr);

    const todaySessionsMap = new Map((todaySessionsData || []).map((s: any) => [s.batch_id, s]));

    // 4. Map schedules
    const classes: TodayClass[] = (scheduleData || []).map((s: any) => {
      const session = todaySessionsMap.get(s.batch_id);
      return {
        id: s.id,
        batch_id: s.batch_id,
        batch_name: s.batch?.name ?? "—",
        class_name: s.batch?.class?.class ?? "—",
        subject_name: s.batch?.subject?.name ?? null,
        start_time: s.start_time,
        end_time: s.end_time,
        room: s.room,
        session_id: session?.id ?? null,
        is_locked: session?.is_locked ?? false,
      };
    });
    setTodayClasses(classes);

    // 5. Fetch past sessions
    const { data: pastData } = await supabase
      .from("attendance_session")
      .select(`
        id, session_date, is_locked, batch_id,
        batch:batch_id ( name, class:class_id ( class ) ),
        attendance_record ( status )
      `)
      .eq("teacher_id", tid)
      .lt("session_date", todayStr)
      .order("session_date", { ascending: false })
      .limit(10);

    const past: PastSession[] = (pastData || []).map((s: any) => {
      const total = s.attendance_record?.length || 0;
      const present = (s.attendance_record || []).filter((r: any) => r.status === 'present' || r.status === 'late').length;
      return {
        id: s.id,
        session_date: s.session_date,
        batch_name: s.batch?.name ?? "—",
        class_name: s.batch?.class?.class ?? "—",
        present,
        total,
        rate: total === 0 ? 0 : Math.round((present / total) * 100),
        is_locked: s.is_locked,
      };
    });
    setPastSessions(past);

    setLoading(false);
  }, [todayDow, todayStr]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleTakeAttendance = async (cls: TodayClass) => {
    if (cls.session_id) {
      // Session already exists, just navigate to it
      router.push(`/attendance/${cls.session_id}`);
      return;
    }

    if (!teacherId) return;

    setCreatingId(cls.batch_id);

    // Create new session
    const { data, error } = await supabase
      .from("attendance_session")
      .insert({
        batch_id: cls.batch_id,
        teacher_id: teacherId,
        schedule_id: cls.id,
        session_date: todayStr,
        is_locked: false
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating session:", error);
      toast.error("Failed to create attendance session.");
      setCreatingId(null);
      return;
    }

    toast.success("Session created");
    router.push(`/attendance/${data.id}`);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Attendance</h1>
        <p className="text-sm text-neutral-500 mt-1">Manage today's sessions and review past attendance.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── TODAY'S CLASSES ── */}
        <Card>
          <CardHeader className="px-5 py-4 border-b border-neutral-100 flex-row items-center justify-between space-y-0">
            <div>
              <span className="text-[14px] font-bold text-neutral-900">Today's Classes</span>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
            <span className="text-[11px] font-mono bg-edu-50 text-edu-600 px-2.5 py-1 rounded-full font-bold">
              {todayClasses.length} Scheduled
            </span>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-5 space-y-4">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ) : todayClasses.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-3xl mb-2 opacity-30">🎉</p>
                <p className="text-[13px] font-semibold text-neutral-500">No classes scheduled for today.</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {todayClasses.map((cls) => (
                  <div key={cls.id} className="p-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between hover:bg-neutral-50/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <p className="text-[14px] font-bold text-neutral-900">{cls.batch_name}</p>
                        <span className="text-[10px] font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200 px-2 py-0.5 rounded-full">
                          {cls.class_name}
                        </span>
                        {cls.subject_name && (
                          <span className="text-[10px] font-semibold bg-edu-50 text-edu-700 border border-edu-200/70 px-2 py-0.5 rounded-full">
                            {cls.subject_name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-[12px] text-neutral-500 font-medium">
                        <span className="flex items-center gap-1">
                          🕒 {formatTime(cls.start_time)} - {formatTime(cls.end_time)}
                        </span>
                        {cls.room && (
                          <span className="flex items-center gap-1">
                            📍 Room {cls.room}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0">
                      {cls.is_locked ? (
                        <Button variant="outline" className="w-full sm:w-auto text-neutral-500 pointer-events-none" disabled>
                          <span className="mr-2">🔒</span> Locked
                        </Button>
                      ) : cls.session_id ? (
                        <Button
                          variant="secondary"
                          className="w-full sm:w-auto bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 border border-amber-200"
                          onClick={() => handleTakeAttendance(cls)}
                        >
                          ✏️ Edit Attendance
                        </Button>
                      ) : (
                        <Button
                          className="w-full sm:w-auto bg-edu-600 hover:bg-edu-700 text-white shadow-sm"
                          onClick={() => handleTakeAttendance(cls)}
                          disabled={creatingId === cls.batch_id}
                        >
                          {creatingId === cls.batch_id ? "Creating..." : "✅ Take Attendance"}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── PAST SESSIONS ── */}
        <Card>
          <CardHeader className="px-5 py-4 border-b border-neutral-100">
            <span className="text-[14px] font-bold text-neutral-900">Past Sessions</span>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-5 space-y-4">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            ) : pastSessions.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-3xl mb-2 opacity-30">📅</p>
                <p className="text-[13px] font-semibold text-neutral-500">No past sessions found.</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {pastSessions.map((s) => (
                  <div key={s.id} className="p-4 flex items-center justify-between hover:bg-neutral-50/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[13px] font-semibold text-neutral-900 truncate">
                          {s.batch_name}
                        </p>
                        {s.is_locked && <span className="text-[10px] text-neutral-400">🔒</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-neutral-500 font-mono">
                          {formatDate(s.session_date)}
                        </span>
                        <span className="text-[11px] text-neutral-400">·</span>
                        <span className="text-[11px] text-neutral-500">
                          {s.class_name}
                        </span>
                      </div>
                    </div>
                    
                    {s.total > 0 ? (
                      <div className="flex items-center gap-3 flex-shrink-0 text-right ml-4">
                        <div className="flex flex-col items-end">
                          <span className={`text-[13px] font-bold font-mono ${rateColor(s.rate)}`}>
                            {s.rate}%
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono mt-0.5">
                            {s.present}/{s.total} present
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[11px] text-neutral-400 font-mono flex-shrink-0">
                        No records
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
