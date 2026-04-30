"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Badge }    from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";


const supabase = createClient();

// ── Types ─────────────────────────────────────────────────────────────────────
type BatchSummary = {
  batch_id:      string;
  batch_name:    string;
  class_name:    string;
  subject_name:  string | null;
  teacher_name:  string | null;
  total_sessions: number;
  total_records:  number;
  present:        number;
  absent:         number;
  late:           number;
  excused:        number;
  rate:           number;
};

type StudentSummary = {
  student_id:   string;
  student_name: string;
  email:        string;
  batch_name:   string;
  total:        number;
  present:      number;
  absent:       number;
  late:         number;
  excused:      number;
  rate:         number;
};

type RecentSession = {
  id:           string;
  session_date: string;
  is_locked:    boolean;
  batch_name:   string;
  class_name:   string;
  teacher_name: string | null;
  total:        number;
  present:      number;
  rate:         number;
};

type BatchOption = { id: string; name: string; class_name: string };

// ── Helpers ───────────────────────────────────────────────────────────────────
function pct(n: number, total: number) {
  if (total === 0) return 0;
  return Math.round((n / total) * 100);
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function rateColor(rate: number) {
  if (rate >= 80) return "text-success-600";
  if (rate >= 60) return "text-warning-600";
  return "text-danger-600";
}

function rateBg(rate: number) {
  if (rate >= 80) return "bg-success-500";
  if (rate >= 60) return "bg-warning-500";
  return "bg-danger-500";
}

function rateBadge(rate: number) {
  if (rate >= 80) return "bg-success-100 text-success-700 border-success-500/20";
  if (rate >= 60) return "bg-warning-100 text-warning-700 border-warning-500/20";
  return "bg-danger-100 text-danger-700 border-danger-500/20";
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, valueClass, sub, icon }: {
  label: string; value: string | number; valueClass?: string; sub?: string; icon?: string;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between mb-2">
          <p className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">{label}</p>
          {icon && <span className="text-xl opacity-40">{icon}</span>}
        </div>
        <p className={["text-[30px] font-black leading-none tracking-tight", valueClass ?? "text-neutral-900"].join(" ")}>
          {value}
        </p>
        {sub && <p className="text-[11px] text-neutral-400 mt-1.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ── Mini Progress Bar ─────────────────────────────────────────────────────────
function RateBar({ rate, showLabel = true }: { rate: number; showLabel?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-neutral-200 overflow-hidden min-w-[60px]">
        <div className={`h-full rounded-full transition-all ${rateBg(rate)}`}
          style={{ width: `${rate}%` }} />
      </div>
      {showLabel && (
        <span className={`font-mono text-[11px] font-bold w-9 text-right flex-shrink-0 ${rateColor(rate)}`}>
          {rate}%
        </span>
      )}
    </div>
  );
}

// ── Skeleton rows ─────────────────────────────────────────────────────────────
function TableSkeletons({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="flex flex-col gap-2.5 p-5">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-11 w-full rounded-lg" style={{ opacity: 1 - i * 0.15 }} />
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AttendancePage() {
  // ── Filters ──────────────────────────────────────────────────────────────
  const [batchFilter,  setBatchFilter]  = useState("all");
  const [dateFrom,     setDateFrom]     = useState("");
  const [dateTo,       setDateTo]       = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [rateFilter,   setRateFilter]   = useState("all");

  // ── Data ─────────────────────────────────────────────────────────────────
  const [batches,          setBatches]          = useState<BatchOption[]>([]);
  const [batchSummaries,   setBatchSummaries]   = useState<BatchSummary[]>([]);
  const [studentSummaries, setStudentSummaries] = useState<StudentSummary[]>([]);
  const [recentSessions,   setRecentSessions]   = useState<RecentSession[]>([]);

  // ── Loading ───────────────────────────────────────────────────────────────
  const [loadingBatch,   setLoadingBatch]   = useState(true);
  const [loadingStudent, setLoadingStudent] = useState(true);
  const [loadingRecent,  setLoadingRecent]  = useState(true);

  // ── Overview stats ────────────────────────────────────────────────────────
  const [overallRate,     setOverallRate]     = useState(0);
  const [totalSessions,   setTotalSessions]   = useState(0);
  const [totalStudents,   setTotalStudents]   = useState(0);
  const [lowAttendCount,  setLowAttendCount]  = useState(0);

  // ── Fetch lookup ──────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.from("batch")
      .select("id, name, class:class_id ( class )")
      .eq("is_active", true).order("name")
      .then(({ data }) => {
        if (data) setBatches((data as any[]).map((b) => ({
          id: b.id, name: b.name, class_name: b.class?.class ?? "—",
        })));
      });
  }, []);

  // ── Fetch batch summaries ─────────────────────────────────────────────────
  const fetchBatchSummaries = useCallback(async () => {
    setLoadingBatch(true);

    // Fetch sessions with filters
    let sessionQuery = supabase
      .from("attendance_session")
      .select(`
        id, batch_id,
        batch:batch_id (
          id, name,
          class:class_id    ( class ),
          subject:subject_id ( name ),
          teacher:teacher_id ( name )
        )
      `);

    if (batchFilter !== "all") sessionQuery = sessionQuery.eq("batch_id", batchFilter);
    if (dateFrom)              sessionQuery = sessionQuery.gte("session_date", dateFrom);
    if (dateTo)                sessionQuery = sessionQuery.lte("session_date", dateTo);

    const { data: sessions } = await sessionQuery;
    if (!sessions) { setLoadingBatch(false); return; }

    const sessionIds = sessions.map((s: any) => s.id);
    setTotalSessions(sessions.length);

    if (sessionIds.length === 0) {
      setBatchSummaries([]);
      setOverallRate(0);
      setLoadingBatch(false);
      return;
    }

    // Fetch all records for these sessions
    const { data: records } = await supabase
      .from("attendance_record")
      .select("session_id, student_id, status")
      .in("session_id", sessionIds);

    // Group by batch
    const batchMap: Record<string, BatchSummary> = {};

    sessions.forEach((s: any) => {
      const bid = s.batch_id;
      if (!batchMap[bid]) {
        batchMap[bid] = {
          batch_id:       bid,
          batch_name:     s.batch?.name         ?? "—",
          class_name:     s.batch?.class?.class  ?? "—",
          subject_name:   s.batch?.subject?.name ?? null,
          teacher_name:   s.batch?.teacher?.name ?? null,
          total_sessions: 0,
          total_records:  0,
          present:        0,
          absent:         0,
          late:           0,
          excused:        0,
          rate:           0,
        };
      }
      batchMap[bid].total_sessions++;
    });

    (records ?? []).forEach((r: any) => {
      const session = sessions.find((s: any) => s.id === r.session_id);
      if (!session) return;
      const bid = session.batch_id;
      if (!batchMap[bid]) return;
      batchMap[bid].total_records++;
      if (r.status === "present") batchMap[bid].present++;
      else if (r.status === "absent")  batchMap[bid].absent++;
      else if (r.status === "late")    batchMap[bid].late++;
      else if (r.status === "excused") batchMap[bid].excused++;
    });

    const summaries = Object.values(batchMap).map((b) => ({
      ...b,
      rate: pct(b.present + b.late, b.total_records),
    })).sort((a, b) => a.rate - b.rate); // worst first

    setBatchSummaries(summaries);

    // Overall rate
    const totalPresent = summaries.reduce((s, b) => s + b.present + b.late, 0);
    const totalRecords = summaries.reduce((s, b) => s + b.total_records, 0);
    setOverallRate(pct(totalPresent, totalRecords));

    setLoadingBatch(false);
  }, [batchFilter, dateFrom, dateTo]);

 // ── Fetch student summaries ───────────────────────────────────────────────
const fetchStudentSummaries = useCallback(async () => {
  setLoadingStudent(true);

  type SessionRow = {
    id:       string;
    batch_id: string;
    batch:    { name: string } | null;   // ← add this type
  };

  let sessionQuery = supabase
    .from("attendance_session")
    .select("id, batch_id, batch:batch_id ( name )");

  if (batchFilter !== "all") sessionQuery = sessionQuery.eq("batch_id", batchFilter);
  if (dateFrom)              sessionQuery = sessionQuery.gte("session_date", dateFrom);
  if (dateTo)                sessionQuery = sessionQuery.lte("session_date", dateTo);

  const { data: sessions } = await sessionQuery;
  if (!sessions) { setLoadingStudent(false); return; }

  // Cast to the typed array  ← this fixes the red underline
  const typedSessions = sessions as unknown as SessionRow[];

  const sessionIds = typedSessions.map((s) => s.id);

  if (sessionIds.length === 0) {
    setStudentSummaries([]);
    setTotalStudents(0);
    setLowAttendCount(0);
    setLoadingStudent(false);
    return;
  }

  const { data: records } = await supabase
    .from("attendance_record")
    .select(`
      session_id, student_id, status,
      student:student_id ( id, name, email )
    `)
    .in("session_id", sessionIds);

  const studentMap: Record<string, StudentSummary> = {};

  (records ?? []).forEach((r: any) => {
    const sid = r.student_id;
    // ← now use typedSessions instead of sessions
    const session = typedSessions.find((s) => s.id === r.session_id);
    if (!studentMap[sid]) {
      studentMap[sid] = {
        student_id:   sid,
        student_name: r.student?.name  ?? "—",
        email:        r.student?.email ?? "—",
        batch_name:   session?.batch?.name ?? "—",  // ← no more red line
        total:        0, present: 0, absent: 0, late: 0, excused: 0, rate: 0,
      };
    }
    studentMap[sid].total++;
    if (r.status === "present")      studentMap[sid].present++;
    else if (r.status === "absent")  studentMap[sid].absent++;
    else if (r.status === "late")    studentMap[sid].late++;
    else if (r.status === "excused") studentMap[sid].excused++;
  });

  const summaries = Object.values(studentMap).map((s) => ({
    ...s,
    rate: pct(s.present + s.late, s.total),
  })).sort((a, b) => a.rate - b.rate);

  setStudentSummaries(summaries);
  setTotalStudents(summaries.length);
  setLowAttendCount(summaries.filter((s) => s.rate < 75).length);
  setLoadingStudent(false);
}, [batchFilter, dateFrom, dateTo]);

  // ── Fetch recent sessions ─────────────────────────────────────────────────
  const fetchRecentSessions = useCallback(async () => {
    setLoadingRecent(true);

    let query = supabase
      .from("attendance_session")
      .select(`
        id, session_date, is_locked,
        batch:batch_id (
          name,
          class:class_id ( class )
        ),
        teacher:teacher_id ( name ),
        attendance_record ( id, status )
      `)
      .order("session_date", { ascending: false })
      .order("created_at",   { ascending: false })
      .limit(10);

    if (batchFilter !== "all") query = query.eq("batch_id", batchFilter);
    if (dateFrom)              query = query.gte("session_date", dateFrom);
    if (dateTo)                query = query.lte("session_date", dateTo);

    const { data, error } = await query;
    if (error) { toast.error("Failed to load sessions"); setLoadingRecent(false); return; }

    const recent: RecentSession[] = (data as any[]).map((s) => {
      const total   = s.attendance_record?.length ?? 0;
      const present = (s.attendance_record ?? []).filter((r: any) => r.status === "present" || r.status === "late").length;
      return {
        id:           s.id,
        session_date: s.session_date,
        is_locked:    s.is_locked,
        batch_name:   s.batch?.name         ?? "—",
        class_name:   s.batch?.class?.class  ?? "—",
        teacher_name: s.teacher?.name        ?? null,
        total,
        present,
        rate: pct(present, total),
      };
    });

    setRecentSessions(recent);
    setLoadingRecent(false);
  }, [batchFilter, dateFrom, dateTo]);

  // ── Load all ──────────────────────────────────────────────────────────────
  const fetchAll = useCallback(() => {
    fetchBatchSummaries();
    fetchStudentSummaries();
    fetchRecentSessions();
  }, [fetchBatchSummaries, fetchStudentSummaries, fetchRecentSessions]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Filtered student list ─────────────────────────────────────────────────
  const filteredStudents = studentSummaries.filter((s) => {
    const matchSearch = !studentSearch ||
      s.student_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(studentSearch.toLowerCase());
    const matchRate =
      rateFilter === "all"    ? true :
      rateFilter === "low"    ? s.rate < 75  :
      rateFilter === "medium" ? s.rate >= 75 && s.rate < 90 :
      rateFilter === "high"   ? s.rate >= 90 : true;
    return matchSearch && matchRate;
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── Overview Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Overall Attendance"
          value={`${overallRate}%`}
          valueClass={rateColor(overallRate)}
          sub="across all sessions"
          icon="📊"
        />
        <StatCard
          label="Total Sessions"
          value={totalSessions}
          sub="attendance sessions"
          icon="📅"
        />
        <StatCard
          label="Students Tracked"
          value={totalStudents}
          valueClass="text-edu-600"
          sub="with attendance records"
          icon="👥"
        />
        <StatCard
          label="Low Attendance"
          value={lowAttendCount}
          valueClass={lowAttendCount > 0 ? "text-danger-600" : "text-success-600"}
          sub="students below 75%"
          icon="⚠️"
        />
      </div>

      {/* ── Global Filters ── */}
      <Card>
        <CardContent className="px-5 py-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500 whitespace-nowrap">
              Filter by
            </span>

            <Select value={batchFilter} onValueChange={setBatchFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Batches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Batches</SelectItem>
                {batches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name} · {b.class_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500 whitespace-nowrap">
                From
              </Label>
              <Input type="date" className="w-[145px]" value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)} />
            </div>

            <div className="flex items-center gap-2">
              <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500 whitespace-nowrap">
                To
              </Label>
              <Input type="date" className="w-[145px]" value={dateTo}
                onChange={(e) => setDateTo(e.target.value)} />
            </div>

            {(batchFilter !== "all" || dateFrom || dateTo) && (
              <Button variant="outline" size="sm"
                onClick={() => { setBatchFilter("all"); setDateFrom(""); setDateTo(""); }}>
                ✕ Clear Filters
              </Button>
            )}

            <Button variant="outline" size="sm" className="ml-auto" onClick={fetchAll}>
              ↺ Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Tabs ── */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-neutral-100 p-1 rounded-lg h-auto">
          {[
            { value: "overview",  label: "Overview"         },
            { value: "batches",   label: "By Batch"         },
            { value: "students",  label: "By Student"       },
            { value: "sessions",  label: "Recent Sessions"  },
          ].map((t) => (
            <TabsTrigger key={t.value} value={t.value}
              className="font-mono text-[11px] tracking-[1.5px] uppercase px-5 py-2
                         data-[state=active]:bg-white data-[state=active]:shadow-sm
                         data-[state=active]:text-neutral-900 text-neutral-500">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── OVERVIEW TAB ── */}
        <TabsContent value="overview" className="space-y-4 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Top attending batches */}
            <Card>
              <CardHeader className="px-5 py-3.5 border-b border-neutral-100 space-y-0">
                <span className="text-[13px] font-bold text-neutral-900">Best Attended Batches</span>
              </CardHeader>
              <CardContent className="p-0">
                {loadingBatch ? <TableSkeletons rows={4} /> : (
                  <div className="divide-y divide-neutral-100">
                    {[...batchSummaries].sort((a, b) => b.rate - a.rate).slice(0, 5).map((b) => (
                      <div key={b.batch_id} className="flex items-center gap-3 px-5 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-neutral-900 truncate">{b.batch_name}</p>
                          <p className="text-[11px] text-neutral-400">{b.class_name}
                            {b.subject_name && ` · ${b.subject_name}`}
                          </p>
                        </div>
                        <div className="w-32 flex-shrink-0">
                          <RateBar rate={b.rate} />
                        </div>
                      </div>
                    ))}
                    {batchSummaries.length === 0 && (
                      <p className="text-[13px] text-neutral-400 text-center py-10">No data yet</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Most absent students */}
            <Card>
              <CardHeader className="px-5 py-3.5 border-b border-neutral-100 space-y-0">
                <span className="text-[13px] font-bold text-neutral-900">Students Needing Attention</span>
                <p className="text-[11px] text-neutral-400 mt-0.5">Below 75% attendance</p>
              </CardHeader>
              <CardContent className="p-0">
                {loadingStudent ? <TableSkeletons rows={4} /> : (
                  <div className="divide-y divide-neutral-100">
                    {studentSummaries.filter((s) => s.rate < 75).slice(0, 5).map((s) => (
                      <div key={s.student_id} className="flex items-center gap-3 px-5 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-neutral-900 truncate">{s.student_name}</p>
                          <p className="text-[11px] text-neutral-400 truncate">{s.batch_name}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-mono text-[11px] text-neutral-500">
                            {s.absent} absent
                          </span>
                          <Badge className={`font-mono text-[10px] border ${rateBadge(s.rate)}`}>
                            {s.rate}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {studentSummaries.filter((s) => s.rate < 75).length === 0 && (
                      <div className="py-10 text-center">
                        <p className="text-2xl mb-2">✅</p>
                        <p className="text-[13px] text-neutral-400">All students above 75%</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status breakdown */}
            <Card>
              <CardHeader className="px-5 py-3.5 border-b border-neutral-100 space-y-0">
                <span className="text-[13px] font-bold text-neutral-900">Status Breakdown</span>
              </CardHeader>
              <CardContent className="px-5 py-4">
                {loadingBatch ? <TableSkeletons rows={2} /> : (() => {
                  const total   = batchSummaries.reduce((s, b) => s + b.total_records, 0);
                  const present = batchSummaries.reduce((s, b) => s + b.present, 0);
                  const absent  = batchSummaries.reduce((s, b) => s + b.absent, 0);
                  const late    = batchSummaries.reduce((s, b) => s + b.late, 0);
                  const excused = batchSummaries.reduce((s, b) => s + b.excused, 0);

                  const items = [
                    { label: "Present", count: present, color: "bg-success-500", pct: pct(present, total) },
                    { label: "Absent",  count: absent,  color: "bg-danger-500",  pct: pct(absent,  total) },
                    { label: "Late",    count: late,    color: "bg-warning-500", pct: pct(late,    total) },
                    { label: "Excused", count: excused, color: "bg-blue-500",    pct: pct(excused, total) },
                  ];

                  return (
                    <div className="space-y-3">
                      {/* Stacked bar */}
                      <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
                        {items.map((item) => (
                          <div key={item.label}
                            className={`${item.color} transition-all`}
                            style={{ width: `${item.pct}%` }} />
                        ))}
                      </div>
                      {/* Legend */}
                      <div className="grid grid-cols-2 gap-2">
                        {items.map((item) => (
                          <div key={item.label} className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${item.color}`} />
                            <span className="text-[12px] text-neutral-600 flex-1">{item.label}</span>
                            <span className="font-mono text-[11px] font-bold text-neutral-700">{item.count}</span>
                            <span className="font-mono text-[10px] text-neutral-400">{item.pct}%</span>
                          </div>
                        ))}
                      </div>
                      <p className="font-mono text-[10px] text-neutral-400 text-right">
                        {total} total records
                      </p>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Recent activity */}
            <Card>
              <CardHeader className="px-5 py-3.5 border-b border-neutral-100 space-y-0">
                <span className="text-[13px] font-bold text-neutral-900">Recent Sessions</span>
              </CardHeader>
              <CardContent className="p-0">
                {loadingRecent ? <TableSkeletons rows={4} /> : (
                  <div className="divide-y divide-neutral-100">
                    {recentSessions.slice(0, 5).map((s) => (
                      <div key={s.id} className="flex items-center gap-3 px-5 py-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[13px] font-semibold text-neutral-900 truncate">{s.batch_name}</p>
                            {s.is_locked && (
                              <span className="text-[10px] text-neutral-400">🔒</span>
                            )}
                          </div>
                          <p className="font-mono text-[11px] text-neutral-400">{formatDate(s.session_date)}</p>
                        </div>
                        {s.total > 0 ? (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="font-mono text-[11px] text-neutral-500">{s.present}/{s.total}</span>
                            <Badge className={`font-mono text-[10px] border ${rateBadge(s.rate)}`}>
                              {s.rate}%
                            </Badge>
                          </div>
                        ) : (
                          <span className="font-mono text-[10px] text-neutral-300">Not taken</span>
                        )}
                      </div>
                    ))}
                    {recentSessions.length === 0 && (
                      <p className="text-[13px] text-neutral-400 text-center py-10">No sessions yet</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── BY BATCH TAB ── */}
        <TabsContent value="batches" className="space-y-4 mt-0">
          <Card>
            <CardHeader className="px-5 py-3.5 border-b border-neutral-100 flex-row items-center gap-3 space-y-0">
              <span className="text-[13px] font-bold text-neutral-900">Batch Attendance Summary</span>
              <span className="font-mono text-[11px] bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full">
                {batchSummaries.length} batches
              </span>
            </CardHeader>
            <CardContent className="p-0">
              {loadingBatch ? <TableSkeletons /> : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                        {["#","Batch","Class","Subject","Teacher","Sessions","Present","Absent","Late","Excused","Rate"].map((h) => (
                          <TableHead key={h} className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500 whitespace-nowrap">
                            {h}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {batchSummaries.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={11}>
                            <div className="py-14 text-center">
                              <p className="text-3xl opacity-30 mb-2">◈</p>
                              <p className="text-[13px] text-neutral-500">No attendance data found for the selected filters.</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        [...batchSummaries].sort((a, b) => a.rate - b.rate).map((b, i) => (
                          <TableRow key={b.batch_id}>
                            <TableCell className="font-mono text-[11px] text-neutral-400">
                              {String(i + 1).padStart(2, "0")}
                            </TableCell>
                            <TableCell className="font-semibold text-neutral-900 whitespace-nowrap">
                              {b.batch_name}
                            </TableCell>
                            <TableCell>
                              <span className="text-xs font-semibold bg-neutral-100 text-neutral-700 border border-neutral-200 px-2 py-0.5 rounded-full">
                                {b.class_name}
                              </span>
                            </TableCell>
                            <TableCell>
                              {b.subject_name ? (
                                <span className="text-xs font-semibold bg-edu-50 text-edu-700 border border-edu-200/70 px-2 py-0.5 rounded-full whitespace-nowrap">
                                  {b.subject_name}
                                </span>
                              ) : <span className="text-neutral-300">—</span>}
                            </TableCell>
                            <TableCell className="text-neutral-600 text-xs font-semibold whitespace-nowrap">
                              {b.teacher_name ?? <span className="text-neutral-300">—</span>}
                            </TableCell>
                            <TableCell className="font-mono text-[12px] text-neutral-600">{b.total_sessions}</TableCell>
                            <TableCell className="font-mono text-[12px] text-success-600 font-bold">{b.present}</TableCell>
                            <TableCell className="font-mono text-[12px] text-danger-600 font-bold">{b.absent}</TableCell>
                            <TableCell className="font-mono text-[12px] text-warning-600 font-bold">{b.late}</TableCell>
                            <TableCell className="font-mono text-[12px] text-blue-600 font-bold">{b.excused}</TableCell>
                            <TableCell className="min-w-[120px]">
                              <RateBar rate={b.rate} />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── BY STUDENT TAB ── */}
        <TabsContent value="students" className="space-y-4 mt-0">
          {/* Student filters */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative flex-1 min-w-[220px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm pointer-events-none">⌕</span>
              <Input className="pl-8" placeholder="Search by name or email…"
                value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} />
            </div>
            <Select value={rateFilter} onValueChange={setRateFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Rates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rates</SelectItem>
                <SelectItem value="low">Low — Below 75%</SelectItem>
                <SelectItem value="medium">Medium — 75–89%</SelectItem>
                <SelectItem value="high">High — 90%+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader className="px-5 py-3.5 border-b border-neutral-100 flex-row items-center gap-3 space-y-0">
              <span className="text-[13px] font-bold text-neutral-900">Student Attendance Report</span>
              <span className="font-mono text-[11px] bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full">
                {filteredStudents.length} students
              </span>
              {lowAttendCount > 0 && (
                <span className="font-mono text-[11px] bg-danger-100 text-danger-700 border border-danger-500/20 px-2 py-0.5 rounded-full ml-auto">
                  {lowAttendCount} below 75%
                </span>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {loadingStudent ? <TableSkeletons /> : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                        {["#","Student","Email","Batch","Total","Present","Absent","Late","Excused","Rate"].map((h) => (
                          <TableHead key={h} className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500 whitespace-nowrap">
                            {h}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10}>
                            <div className="py-14 text-center">
                              <p className="text-3xl opacity-30 mb-2">◈</p>
                              <p className="text-[13px] text-neutral-500">No student data found.</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredStudents.map((s, i) => (
                          <TableRow key={s.student_id}>
                            <TableCell className="font-mono text-[11px] text-neutral-400">
                              {String(i + 1).padStart(2, "0")}
                            </TableCell>
                            <TableCell className="font-semibold text-neutral-900 whitespace-nowrap">
                              {s.student_name}
                              {s.rate < 75 && (
                                <span className="ml-1.5 text-[9px] font-mono text-danger-500 bg-danger-50 border border-danger-200 px-1.5 py-0.5 rounded-full">
                                  LOW
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-neutral-400 text-xs">{s.email}</TableCell>
                            <TableCell>
                              <span className="text-xs font-semibold bg-neutral-100 text-neutral-700 border border-neutral-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                                {s.batch_name}
                              </span>
                            </TableCell>
                            <TableCell className="font-mono text-[12px] text-neutral-600 font-bold">{s.total}</TableCell>
                            <TableCell className="font-mono text-[12px] text-success-600 font-bold">{s.present}</TableCell>
                            <TableCell className="font-mono text-[12px] text-danger-600 font-bold">{s.absent}</TableCell>
                            <TableCell className="font-mono text-[12px] text-warning-600 font-bold">{s.late}</TableCell>
                            <TableCell className="font-mono text-[12px] text-blue-600 font-bold">{s.excused}</TableCell>
                            <TableCell className="min-w-[120px]">
                              <RateBar rate={s.rate} />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── RECENT SESSIONS TAB ── */}
        <TabsContent value="sessions" className="space-y-4 mt-0">
          <Card>
            <CardHeader className="px-5 py-3.5 border-b border-neutral-100 flex-row items-center gap-3 space-y-0">
              <span className="text-[13px] font-bold text-neutral-900">Recent Sessions</span>
              <span className="font-mono text-[11px] bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full">
                {recentSessions.length} sessions
              </span>
            </CardHeader>
            <CardContent className="p-0">
              {loadingRecent ? <TableSkeletons /> : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                        {["#","Date","Batch","Class","Teacher","Students","Present","Absent","Rate","Status"].map((h) => (
                          <TableHead key={h} className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500 whitespace-nowrap">
                            {h}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentSessions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10}>
                            <div className="py-14 text-center">
                              <p className="text-3xl opacity-30 mb-2">◈</p>
                              <p className="text-[13px] text-neutral-500">No sessions found.</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        recentSessions.map((s, i) => (
                          <TableRow key={s.id}>
                            <TableCell className="font-mono text-[11px] text-neutral-400">
                              {String(i + 1).padStart(2, "0")}
                            </TableCell>
                            <TableCell className="font-mono text-[12px] font-semibold text-neutral-800 whitespace-nowrap">
                              {formatDate(s.session_date)}
                            </TableCell>
                            <TableCell className="font-semibold text-neutral-900 whitespace-nowrap">
                              {s.batch_name}
                            </TableCell>
                            <TableCell>
                              <span className="text-xs font-semibold bg-neutral-100 text-neutral-700 border border-neutral-200 px-2 py-0.5 rounded-full">
                                {s.class_name}
                              </span>
                            </TableCell>
                            <TableCell className="text-neutral-600 text-xs font-semibold whitespace-nowrap">
                              {s.teacher_name ?? <span className="text-neutral-300">—</span>}
                            </TableCell>
                            <TableCell className="font-mono text-[12px] text-neutral-600">{s.total}</TableCell>
                            <TableCell className="font-mono text-[12px] text-success-600 font-bold">{s.present}</TableCell>
                            <TableCell className="font-mono text-[12px] text-danger-600 font-bold">
                              {s.total - s.present}
                            </TableCell>
                            <TableCell className="min-w-[110px]">
                              {s.total > 0
                                ? <RateBar rate={s.rate} />
                                : <span className="font-mono text-[10px] text-neutral-300">Not taken</span>
                              }
                            </TableCell>
                            <TableCell>
                              <Badge className={
                                s.is_locked
                                  ? "bg-neutral-100 text-neutral-600 border border-neutral-300 hover:bg-neutral-100 font-mono text-[10px]"
                                  : "bg-success-100 text-success-700 border border-success-500/20 hover:bg-success-100 font-mono text-[10px]"
                              }>
                                <span className="w-1.5 h-1.5 rounded-full bg-current mr-1 shrink-0" />
                                {s.is_locked ? "Locked" : "Open"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}