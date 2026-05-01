"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const supabase = createClient();

// ── Types ─────────────────────────────────────────────────────────────────────
type TeacherProfile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  dob: string | null;
  is_active: boolean;
  is_registered: boolean;
  last_login: string | null;
  created_at: string;
  teacher_subjects: { subject: { id: string; name: string; code: string | null } }[];
  teacher_classes: { class: { id: string; class: string } }[];
};

type TodaySchedule = {
  id: string;
  batch_name: string;
  class_name: string;
  subject_name: string | null;
  start_time: string;
  end_time: string;
  room: string | null;
  day_of_week: number;
};

type BatchStat = {
  id: string;
  name: string;
  class_name: string;
  subject_name: string | null;
  student_count: number;
  session_count: number;
  avg_attendance: number;
};

type RecentSession = {
  id: string;
  session_date: string;
  batch_name: string;
  is_locked: boolean;
  present: number;
  total: number;
  rate: number;
};

type PaymentSummary = {
  month: number;
  year: number;
  amount: number;
  paid_amount: number;
  status: string;
};

type SalaryRecord = {
  amount: number;
  currency: string;
  effective_from: string;
  notes: string | null;
};

// ── Constants ─────────────────────────────────────────────────────────────────
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const DAY_COLORS: Record<number, string> = {
  0: "bg-rose-50   text-rose-700   border-rose-200",
  1: "bg-blue-50   text-blue-700   border-blue-200",
  2: "bg-violet-50 text-violet-700 border-violet-200",
  3: "bg-amber-50  text-amber-700  border-amber-200",
  4: "bg-teal-50   text-teal-700   border-teal-200",
  5: "bg-green-50  text-green-700  border-green-200",
  6: "bg-orange-50 text-orange-700 border-orange-200",
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
    year: "numeric", month: "short", day: "numeric",
  });
}

function formatDateShort(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function pct(n: number, total: number) {
  if (total === 0) return 0;
  return Math.round((n / total) * 100);
}

function rateColor(rate: number) {
  if (rate >= 80) return "text-emerald-600";
  if (rate >= 60) return "text-amber-600";
  return "text-red-500";
}

function rateBg(rate: number) {
  if (rate >= 80) return "bg-emerald-500";
  if (rate >= 60) return "bg-amber-500";
  return "bg-red-500";
}

function greetingByTime() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label, value, valueClass, sub, icon, loading,
}: {
  label: string;
  value: string | number;
  valueClass?: string;
  sub?: string;
  icon: string;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-5">
          <Skeleton className="h-3 w-20 rounded mb-4" />
          <Skeleton className="h-8 w-24 rounded mb-2" />
          <Skeleton className="h-3 w-28 rounded" />
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="overflow-hidden hover:shadow-md transition-all duration-200 group">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <p className="text-[10px] tracking-widest uppercase font-semibold text-neutral-400">
            {label}
          </p>
          <span className="text-lg opacity-30 group-hover:opacity-60 transition-opacity">{icon}</span>
        </div>
        <p className={["text-[28px] font-black leading-none tracking-tight", valueClass ?? "text-neutral-900"].join(" ")}>
          {value}
        </p>
        {sub && <p className="text-[11px] text-neutral-400 mt-2 leading-relaxed">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function RateBar({ rate }: { rate: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${rateBg(rate)}`}
          style={{ width: `${rate}%` }}
        />
      </div>
      <span className={`font-mono text-[11px] font-bold w-8 text-right ${rateColor(rate)}`}>
        {rate}%
      </span>
    </div>
  );
}

function SectionHeader({ title, badge }: { title: string; badge?: string }) {
  return (
    <CardHeader className="px-5 py-3.5 border-b border-neutral-100 flex-row items-center gap-2.5 space-y-0">
      <span className="text-[13px] font-bold text-neutral-900">{title}</span>
      {badge !== undefined && (
        <span className="text-[11px] font-mono bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </CardHeader>
  );
}

function EmptyState({ emoji, title, sub }: { emoji: string; title: string; sub?: string }) {
  return (
    <div className="py-12 text-center">
      <p className="text-3xl mb-2 opacity-25">{emoji}</p>
      <p className="text-[13px] font-semibold text-neutral-500">{title}</p>
      {sub && <p className="text-[11px] text-neutral-400 mt-1">{sub}</p>}
    </div>
  );
}

function SkeletonRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="divide-y divide-neutral-100">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-5 py-4" style={{ opacity: 1 - i * 0.2 }}>
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-32 rounded" />
            <Skeleton className="h-2.5 w-20 rounded" />
          </div>
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function TeacherDashboard() {
  const [teacherId,      setTeacherId]      = useState<string | null>(null);
  const [profile,        setProfile]        = useState<TeacherProfile | null>(null);
  const [todaySchedules, setTodaySchedules] = useState<TodaySchedule[]>([]);
  const [batchStats,     setBatchStats]     = useState<BatchStat[]>([]);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [payment,        setPayment]        = useState<PaymentSummary | null>(null);
  const [salary,         setSalary]         = useState<SalaryRecord | null>(null);

  const [loadingProfile,  setLoadingProfile]  = useState(true);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [loadingBatches,  setLoadingBatches]  = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingPayment,  setLoadingPayment]  = useState(true);

  const today        = new Date();
  const todayDow     = today.getDay();
  const currentMonth = today.getMonth() + 1;
  const currentYear  = today.getFullYear();

  // ── STEP 1: email → teacher UUID + profile ────────────────────────────────
  // We get the logged-in user's email from Supabase Auth, then look up the
  // teachers table to find the matching row. This gives us profile.id (UUID)
  // which is the foreign key used in every other table.
  useEffect(() => {
    const fetchProfile = async () => {
      setLoadingProfile(true);

      // Get logged-in user from Supabase Auth
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user?.email) {
        console.error("Auth error or no email:", authError);
        setLoadingProfile(false);
        return;
      }

      // Use auth email to find the teacher row → get the teacher UUID (id)
      const { data, error } = await supabase
        .from("teachers")
        .select(`
          id,
          name,
          email,
          phone,
          dob,
          is_active,
          is_registered,
          last_login,
          created_at,
          teacher_subjects (
            subject ( id, name, code )
          ),
          teacher_classes (
            class ( id, class )
          )
        `)
        .eq("email", user.email)   // match by auth email
        .single();

      if (error || !data) {
        console.error("Teacher profile fetch error:", error);
        setLoadingProfile(false);
        return;
      }

      setProfile(data as unknown as TeacherProfile);
      setTeacherId(data.id);   // store UUID for all downstream queries
      setLoadingProfile(false);
    };

    fetchProfile();
  }, []);

  // ── STEP 2: Today's schedule — filtered by teacher UUID + today's day ─────
  const fetchSchedule = useCallback(async (tid: string) => {
    setLoadingSchedule(true);

    const { data, error } = await supabase
      .from("class_schedule")
      .select(`
        id,
        start_time,
        end_time,
        room,
        day_of_week,
        batch:batch_id (
          id,
          name,
          class:class_id   ( class ),
          subject:subject_id ( name )
        )
      `)
      .eq("teacher_id", tid)          // filter by teacher UUID
      .eq("day_of_week", todayDow)    // only today's day
      .eq("is_active", true)
      .order("start_time");

    if (error) console.error("Schedule fetch error:", error);

    const schedules: TodaySchedule[] = ((data as any[]) ?? []).map((s) => ({
      id:           s.id,
      batch_name:   s.batch?.name          ?? "—",
      class_name:   s.batch?.class?.class  ?? "—",
      subject_name: s.batch?.subject?.name ?? null,
      start_time:   s.start_time,
      end_time:     s.end_time,
      room:         s.room,
      day_of_week:  s.day_of_week,
    }));

    setTodaySchedules(schedules);
    setLoadingSchedule(false);
  }, [todayDow]);

  // ── STEP 3: Batch stats — all batches owned by this teacher UUID ──────────
  // batch.teacher_id = teacher UUID
  // Then student_batch.batch_id, attendance_session.batch_id,
  // attendance_record.session_id for counts/averages
  const fetchBatchStats = useCallback(async (tid: string) => {
    setLoadingBatches(true);

    // All active batches assigned to this teacher
    const { data: batchRows, error: batchErr } = await supabase
      .from("batch")
      .select(`
        id,
        name,
        class:class_id   ( class ),
        subject:subject_id ( name )
      `)
      .eq("teacher_id", tid)    // filter by teacher UUID
      .eq("is_active", true);

    if (batchErr) console.error("Batch fetch error:", batchErr);

    if (!batchRows || batchRows.length === 0) {
      setBatchStats([]);
      setLoadingBatches(false);
      return;
    }

    const batchIds = batchRows.map((b: any) => b.id);

    // Student enrollment counts per batch
    const { data: sbRows } = await supabase
      .from("student_batch")
      .select("batch_id, student_id")
      .in("batch_id", batchIds);

    // All attendance sessions for these batches
    const { data: sessionRows } = await supabase
      .from("attendance_session")
      .select("id, batch_id")
      .in("batch_id", batchIds);

    const sessionIds = (sessionRows ?? []).map((s: any) => s.id);

    // Attendance records for those sessions
    const { data: recordRows } = sessionIds.length > 0
      ? await supabase
          .from("attendance_record")
          .select("session_id, status")
          .in("session_id", sessionIds)
      : { data: [] };

    // Compute per-batch stats
    const stats: BatchStat[] = (batchRows as any[]).map((b) => {
      const studentCount    = (sbRows ?? []).filter((s: any) => s.batch_id === b.id).length;
      const batchSessions   = (sessionRows ?? []).filter((s: any) => s.batch_id === b.id);
      const batchSessionIds = batchSessions.map((s: any) => s.id);
      const batchRecords    = (recordRows ?? []).filter((r: any) => batchSessionIds.includes(r.session_id));
      const presentCount    = batchRecords.filter((r: any) =>
        r.status === "present" || r.status === "late"
      ).length;

      return {
        id:             b.id,
        name:           b.name,
        class_name:     (b.class as any)?.class   ?? "—",
        subject_name:   (b.subject as any)?.name  ?? null,
        student_count:  studentCount,
        session_count:  batchSessions.length,
        avg_attendance: pct(presentCount, batchRecords.length),
      };
    });

    setBatchStats(stats);
    setLoadingBatches(false);
  }, []);

  // ── STEP 4: Recent attendance sessions by teacher UUID ────────────────────
  // attendance_session.teacher_id = teacher UUID (direct filter — no joins needed)
  const fetchRecentSessions = useCallback(async (tid: string) => {
    setLoadingSessions(true);

    const { data, error } = await supabase
      .from("attendance_session")
      .select(`
        id,
        session_date,
        is_locked,
        batch:batch_id ( name ),
        attendance_record ( id, status )
      `)
      .eq("teacher_id", tid)                         // filter by teacher UUID
      .order("session_date", { ascending: false })
      .limit(5);

    if (error) console.error("Sessions fetch error:", error);

    const sessions: RecentSession[] = ((data as any[]) ?? []).map((s) => {
      const total   = s.attendance_record?.length ?? 0;
      const present = (s.attendance_record ?? []).filter(
        (r: any) => r.status === "present" || r.status === "late"
      ).length;
      return {
        id:           s.id,
        session_date: s.session_date,
        batch_name:   s.batch?.name ?? "—",
        is_locked:    s.is_locked,
        present,
        total,
        rate: pct(present, total),
      };
    });

    setRecentSessions(sessions);
    setLoadingSessions(false);
  }, []);

  // ── STEP 5: Current month payment by teacher UUID ─────────────────────────
  // teacher_payment.teacher_id = teacher UUID
  const fetchPayment = useCallback(async (tid: string) => {
    setLoadingPayment(true);

    const { data: payData } = await supabase
      .from("teacher_payment")
      .select("month, year, amount, paid_amount, status")
      .eq("teacher_id", tid)          // filter by teacher UUID
      .eq("month", currentMonth)
      .eq("year", currentYear)
      .single();

    if (payData) setPayment(payData as PaymentSummary);

    // Also fetch the latest salary record for this teacher
    const { data: salaryData } = await supabase
      .from("teacher_salary")
      .select("amount, currency, effective_from, notes")
      .eq("teacher_id", tid)          // filter by teacher UUID
      .order("effective_from", { ascending: false })
      .limit(1)
      .single();

    if (salaryData) setSalary(salaryData as SalaryRecord);

    setLoadingPayment(false);
  }, [currentMonth, currentYear]);

  // ── Trigger all downstream queries once we have the teacher UUID ──────────
  useEffect(() => {
    if (!teacherId) return;
    fetchSchedule(teacherId);
    fetchBatchStats(teacherId);
    fetchRecentSessions(teacherId);
    fetchPayment(teacherId);
  }, [teacherId, fetchSchedule, fetchBatchStats, fetchRecentSessions, fetchPayment]);

  // ── Computed aggregates ───────────────────────────────────────────────────
  const totalStudents     = batchStats.reduce((s, b) => s + b.student_count, 0);
  const totalBatches      = batchStats.length;
  const totalSessions     = batchStats.reduce((s, b) => s + b.session_count, 0);
  const overallAttendance = batchStats.length > 0
    ? Math.round(batchStats.reduce((s, b) => s + b.avg_attendance, 0) / batchStats.length)
    : 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-edu-400 to-edu-600 flex items-center justify-center text-white font-black text-[15px] shadow-md flex-shrink-0">
            {loadingProfile ? (
              <Skeleton className="w-12 h-12 rounded-2xl" />
            ) : (
              getInitials(profile?.name ?? "T")
            )}
          </div>

          <div>
            {loadingProfile ? (
              <div className="space-y-2">
                <Skeleton className="h-7 w-52 rounded-lg" />
                <Skeleton className="h-3.5 w-36 rounded-lg" />
              </div>
            ) : (
              <>
                <h1 className="text-[22px] font-black text-neutral-900 leading-tight">
                  {greetingByTime()}, {profile?.name?.split(" ")[0]} 👋
                </h1>
                <p className="text-[12px] text-neutral-400 mt-0.5">
                  {DAYS[todayDow]}, {today.toLocaleDateString("en-US", {
                    month: "long", day: "numeric", year: "numeric",
                  })}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Subject + class chips */}
        {!loadingProfile && profile && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {profile.teacher_subjects?.slice(0, 3).map(({ subject: s }) => (
              <span key={s.id}
                className="text-[10px] font-semibold tracking-wide bg-edu-50 text-edu-700 border border-edu-200/70 px-2.5 py-1 rounded-full">
                {s.code ? `${s.code} · ${s.name}` : s.name}
              </span>
            ))}
            {profile.teacher_classes?.slice(0, 3).map(({ class: c }) => (
              <span key={c.id}
                className="text-[10px] font-semibold bg-neutral-100 text-neutral-500 border border-neutral-200 px-2.5 py-1 rounded-full">
                {c.class}
              </span>
            ))}
            {profile.is_active ? (
              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70 px-2.5 py-1 rounded-full">
                ● Active
              </span>
            ) : (
              <span className="text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200/70 px-2.5 py-1 rounded-full">
                ● Inactive
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="My Batches"
          value={totalBatches}
          icon="📚"
          sub="active batches"
          loading={loadingBatches}
        />
        <StatCard
          label="Total Students"
          value={totalStudents}
          valueClass="text-edu-600"
          icon="👥"
          sub="across all batches"
          loading={loadingBatches}
        />
        <StatCard
          label="Avg Attendance"
          value={`${overallAttendance}%`}
          valueClass={rateColor(overallAttendance)}
          icon="📊"
          sub={`${totalSessions} sessions total`}
          loading={loadingBatches}
        />
        <StatCard
          label="This Month"
          value={
            payment
              ? `LKR ${payment.amount.toLocaleString()}`
              : salary
              ? `LKR ${salary.amount.toLocaleString()}`
              : "Not set"
          }
          valueClass={
            payment?.status === "paid"    ? "text-emerald-600" :
            payment?.status === "partial" ? "text-amber-600"   :
            payment?.status === "pending" ? "text-red-500"     :
            "text-neutral-400"
          }
          icon="💰"
          sub={
            payment
              ? `${payment.status.charAt(0).toUpperCase() + payment.status.slice(1)} · ${MONTHS[payment.month - 1]} ${payment.year}`
              : "No record yet"
          }
          loading={loadingPayment}
        />
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Left / Center (2 cols) ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* ── Today's Schedule ── */}
          <Card>
            <SectionHeader
              title="Today's Schedule"
              badge={`${todaySchedules.length} ${todaySchedules.length === 1 ? "class" : "classes"}`}
            />
            {/* Day pill */}
            <div className="px-5 pt-3">
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold border px-3 py-1 rounded-full ${DAY_COLORS[todayDow]}`}>
                {DAYS[todayDow]}
              </span>
            </div>
            <CardContent className="p-0 mt-2">
              {loadingSchedule ? (
                <SkeletonRows rows={2} />
              ) : todaySchedules.length === 0 ? (
                <EmptyState emoji="🎉" title="No classes today" sub="Enjoy your free day!" />
              ) : (
                <div className="divide-y divide-neutral-100">
                  {todaySchedules.map((s) => {
                    const now      = new Date();
                    const [sh, sm] = s.start_time.split(":").map(Number);
                    const [eh, em] = s.end_time.split(":").map(Number);
                    const startM   = sh * 60 + sm;
                    const endM     = eh * 60 + em;
                    const nowM     = now.getHours() * 60 + now.getMinutes();
                    const isOngoing  = nowM >= startM && nowM <= endM;
                    const isUpcoming = nowM < startM;
                    const isDone     = nowM > endM;

                    return (
                      <div key={s.id}
                        className={`flex items-center gap-4 px-5 py-4 transition-colors ${isOngoing ? "bg-edu-50/50" : ""}`}>
                        {/* Time */}
                        <div className="text-right flex-shrink-0 w-[68px]">
                          <p className="font-mono text-[12px] font-bold text-neutral-800">
                            {formatTime(s.start_time)}
                          </p>
                          <p className="font-mono text-[10px] text-neutral-400">
                            {formatTime(s.end_time)}
                          </p>
                        </div>

                        {/* Vertical bar */}
                        <div className={`w-0.5 h-10 rounded-full flex-shrink-0 ${
                          isOngoing ? "bg-edu-500" : isDone ? "bg-neutral-200" : "bg-neutral-300"
                        }`} />

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-[13px] font-bold text-neutral-900">{s.batch_name}</p>
                            <span className="text-[10px] font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200 px-2 py-0.5 rounded-full">
                              {s.class_name}
                            </span>
                            {s.subject_name && (
                              <span className="text-[10px] font-semibold bg-edu-50 text-edu-700 border border-edu-200/70 px-2 py-0.5 rounded-full">
                                {s.subject_name}
                              </span>
                            )}
                          </div>
                          {s.room && (
                            <p className="text-[11px] text-neutral-400 mt-0.5">📍 Room {s.room}</p>
                          )}
                        </div>

                        {/* Status */}
                        <div className="flex-shrink-0">
                          {isOngoing ? (
                            <span className="text-[10px] font-bold bg-edu-500 text-white px-2.5 py-1 rounded-full animate-pulse">
                              LIVE
                            </span>
                          ) : isUpcoming ? (
                            <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full">
                              UPCOMING
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold bg-neutral-100 text-neutral-400 border border-neutral-200 px-2.5 py-1 rounded-full">
                              DONE
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── My Batches ── */}
          <Card>
            <SectionHeader title="My Batches" badge={`${batchStats.length} active`} />
            <CardContent className="p-0">
              {loadingBatches ? (
                <SkeletonRows rows={3} />
              ) : batchStats.length === 0 ? (
                <EmptyState emoji="◈" title="No batches assigned yet" />
              ) : (
                <div className="divide-y divide-neutral-100">
                  {batchStats.map((b) => (
                    <div key={b.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-neutral-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-[13px] font-semibold text-neutral-900">{b.name}</p>
                          <span className="text-[10px] font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200 px-2 py-0.5 rounded-full">
                            {b.class_name}
                          </span>
                          {b.subject_name && (
                            <span className="text-[10px] font-semibold bg-edu-50 text-edu-700 border border-edu-200/70 px-2 py-0.5 rounded-full">
                              {b.subject_name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[11px] text-neutral-400">👥 {b.student_count} students</span>
                          <span className="text-[11px] text-neutral-400">📅 {b.session_count} sessions</span>
                        </div>
                      </div>
                      <div className="w-28 flex-shrink-0">
                        <p className="text-[9px] uppercase tracking-widest text-neutral-400 mb-1.5">Attendance</p>
                        <RateBar rate={b.avg_attendance} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Right Column ── */}
        <div className="space-y-5">

          {/* ── Recent Sessions ── */}
          <Card>
            <SectionHeader title="Recent Sessions" />
            <CardContent className="p-0">
              {loadingSessions ? (
                <SkeletonRows rows={4} />
              ) : recentSessions.length === 0 ? (
                <EmptyState emoji="◈" title="No sessions yet" />
              ) : (
                <div className="divide-y divide-neutral-100">
                  {recentSessions.map((s) => (
                    <div key={s.id} className="flex items-center gap-3 px-5 py-3 hover:bg-neutral-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-[12px] font-semibold text-neutral-900 truncate">{s.batch_name}</p>
                          {s.is_locked && <span className="text-[10px] text-neutral-400">🔒</span>}
                        </div>
                        <p className="font-mono text-[10px] text-neutral-400 mt-0.5">
                          {formatDateShort(s.session_date)}
                        </p>
                      </div>
                      {s.total > 0 ? (
                        <div className="flex-shrink-0 text-right">
                          <p className={`font-mono text-[13px] font-black ${rateColor(s.rate)}`}>
                            {s.rate}%
                          </p>
                          <p className="font-mono text-[10px] text-neutral-400">{s.present}/{s.total}</p>
                        </div>
                      ) : (
                        <span className="text-[10px] text-neutral-300 font-mono flex-shrink-0">
                          Empty
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Salary / Payment Card ── */}
          <Card>
            <SectionHeader title={`Salary — ${MONTHS[currentMonth - 1]} ${currentYear}`} />
            <CardContent className="px-5 py-4">
              {loadingPayment ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-2 w-full rounded-full mt-4" />
                </div>
              ) : !payment ? (
                <div>
                  {salary ? (
                    <div className="space-y-3">
                      <div className="py-3 px-3.5 bg-amber-50 border border-amber-200/70 rounded-xl">
                        <p className="text-[11px] font-semibold text-amber-700">No payment record this month</p>
                        <p className="text-[10px] text-amber-600 mt-0.5">
                          Base salary: LKR {salary.amount.toLocaleString()}
                        </p>
                      </div>
                      {salary.notes && (
                        <p className="text-[11px] text-neutral-400 italic">{salary.notes}</p>
                      )}
                    </div>
                  ) : (
                    <EmptyState emoji="💰" title="No salary record" sub="Contact admin to set up" />
                  )}
                </div>
              ) : (
                <div className="space-y-3.5">
                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-neutral-500">Status</span>
                    <Badge className={
                      payment.status === "paid"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-[10px] font-mono"
                        : payment.status === "partial"
                        ? "bg-blue-50 text-blue-700 border border-blue-200/70 text-[10px] font-mono"
                        : "bg-amber-50 text-amber-700 border border-amber-200/70 text-[10px] font-mono"
                    }>
                      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1 shrink-0" />
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </Badge>
                  </div>

                  {/* Amount breakdown */}
                  <div className="space-y-2 pt-0.5">
                    <div className="flex justify-between">
                      <span className="text-[12px] text-neutral-500">Total</span>
                      <span className="font-mono text-[12px] font-bold text-neutral-800">
                        LKR {payment.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[12px] text-neutral-500">Paid</span>
                      <span className="font-mono text-[12px] font-bold text-emerald-600">
                        LKR {payment.paid_amount.toLocaleString()}
                      </span>
                    </div>
                    {payment.amount - payment.paid_amount > 0 && (
                      <div className="flex justify-between pt-2 border-t border-neutral-100">
                        <span className="text-[12px] text-neutral-500">Balance</span>
                        <span className="font-mono text-[12px] font-bold text-red-500">
                          LKR {(payment.amount - payment.paid_amount).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Progress */}
                  <div className="pt-1">
                    <div className="flex justify-between mb-1.5">
                      <span className="text-[10px] text-neutral-400">Payment progress</span>
                      <span className="font-mono text-[10px] text-neutral-500">
                        {pct(payment.paid_amount, payment.amount)}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          payment.status === "paid"    ? "bg-emerald-500" :
                          payment.status === "partial" ? "bg-blue-500"    :
                          "bg-amber-500"
                        }`}
                        style={{ width: `${pct(payment.paid_amount, payment.amount)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Profile Card ── */}
          <Card>
            <SectionHeader title="My Profile" />
            <CardContent className="px-5 py-4">
              {loadingProfile ? (
                <div className="space-y-3">
                  <Skeleton className="h-3.5 w-full rounded" />
                  <Skeleton className="h-3.5 w-3/4 rounded" />
                  <Skeleton className="h-3.5 w-2/3 rounded" />
                </div>
              ) : profile ? (
                <div className="space-y-3">
                  {[
                    { label: "Email", value: profile.email },
                    ...(profile.phone ? [{ label: "Phone", value: profile.phone }] : []),
                    ...(profile.dob   ? [{ label: "Date of Birth", value: formatDate(profile.dob) }] : []),
                    { label: "Last Login", value: formatDate(profile.last_login) },
                    { label: "Member Since", value: formatDate(profile.created_at) },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between gap-3">
                      <span className="text-[12px] text-neutral-400 flex-shrink-0">{label}</span>
                      <span className="text-[12px] font-semibold text-neutral-700 text-right truncate max-w-[170px]">
                        {value}
                      </span>
                    </div>
                  ))}

                  {/* Subjects */}
                  {profile.teacher_subjects?.length > 0 && (
                    <div className="pt-2.5 border-t border-neutral-100">
                      <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-2">Subjects</p>
                      <div className="flex flex-wrap gap-1.5">
                        {profile.teacher_subjects.map(({ subject: s }) => (
                          <span key={s.id}
                            className="text-[10px] font-semibold bg-edu-50 text-edu-700 border border-edu-200/70 px-2 py-0.5 rounded-full">
                            {s.code ? `${s.code} · ${s.name}` : s.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Classes */}
                  {profile.teacher_classes?.length > 0 && (
                    <div className="pt-2.5 border-t border-neutral-100">
                      <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-2">Classes</p>
                      <div className="flex flex-wrap gap-1.5">
                        {profile.teacher_classes.map(({ class: c }) => (
                          <span key={c.id}
                            className="text-[10px] font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200 px-2 py-0.5 rounded-full">
                            {c.class}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState emoji="👤" title="Profile not found" />
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
