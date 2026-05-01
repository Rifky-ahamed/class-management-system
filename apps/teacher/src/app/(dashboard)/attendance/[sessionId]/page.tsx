"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";

const supabase = createClient();

// ── Types ─────────────────────────────────────────────────────────────────────
type SessionData = {
  id: string;
  session_date: string;
  is_locked: boolean;
  batch_id: string;
  batch_name: string;
  class_name: string;
};

type StudentRecord = {
  student_id: string;
  name: string;
  email: string;
  status: "present" | "absent" | "late" | "excused" | null;
  note: string | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

function StatusButton({
  current,
  status,
  label,
  colorClass,
  onClick,
  disabled
}: {
  current: string | null;
  status: string;
  label: string;
  colorClass: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  const isActive = current === status;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-all ${
        isActive ? colorClass : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {label}
    </button>
  );
}

// ── Page Component ────────────────────────────────────────────────────────────
export default function RollCallPage({ params }: { params: any }) {
  const router = useRouter();
  const unwrappedParams = use(params) as any;
  const sessionId = unwrappedParams.sessionId;

  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);

    // 1. Fetch Session Details
    const { data: sess, error: sessErr } = await supabase
      .from("attendance_session")
      .select(`
        id, session_date, is_locked, batch_id,
        batch:batch_id ( name, class:class_id ( class ) )
      `)
      .eq("id", sessionId)
      .single();

    if (sessErr || !sess) {
      toast.error("Session not found");
      router.push("/attendance");
      return;
    }

    setSessionData({
      id: sess.id,
      session_date: sess.session_date,
      is_locked: sess.is_locked,
      batch_id: sess.batch_id,
      batch_name: (sess.batch as any)?.name ?? "—",
      class_name: (sess.batch as any)?.class?.class ?? "—",
    });

    // 2. Fetch Enrolled Students
    const { data: studentsData, error: studErr } = await supabase
      .from("student_batch")
      .select(`
        student_id,
        student:student_id ( id, name, email )
      `)
      .eq("batch_id", sess.batch_id);

    if (studErr) {
      console.error("Error fetching students:", studErr);
      toast.error("Failed to load students.");
    }

    // 3. Fetch Existing Records
    const { data: recordsData } = await supabase
      .from("attendance_record")
      .select("student_id, status, note")
      .eq("session_id", sessionId);

    const existingMap = new Map((recordsData || []).map((r: any) => [r.student_id, r]));

    // 4. Map & Sort
    const list: StudentRecord[] = (studentsData || []).map((s: any) => {
      const ex = existingMap.get(s.student_id);
      return {
        student_id: s.student_id,
        name: s.student?.name ?? "Unknown",
        email: s.student?.email ?? "",
        status: ex?.status ?? null,
        note: ex?.note ?? null,
      };
    });

    list.sort((a, b) => a.name.localeCompare(b.name));
    setRecords(list);
    setLoading(false);
  }, [sessionId, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const updateStatus = (studentId: string, status: StudentRecord["status"]) => {
    if (sessionData?.is_locked) return;
    setRecords(prev => prev.map(r => r.student_id === studentId ? { ...r, status } : r));
  };

  const markAll = (status: "present" | "absent") => {
    if (sessionData?.is_locked) return;
    setRecords(prev => prev.map(r => ({ ...r, status })));
  };

  const handleSave = async (lock: boolean) => {
    if (!sessionData || sessionData.is_locked) return;

    const unmarked = records.filter(r => !r.status);
    if (lock && unmarked.length > 0) {
      if (!window.confirm(`${unmarked.length} students are unmarked. Are you sure you want to lock the session?`)) {
        return;
      }
    }

    setSaving(true);

    // Fetch current existing IDs for this session to upsert correctly
    const { data: currentRecords } = await supabase
      .from("attendance_record")
      .select("id, student_id")
      .eq("session_id", sessionId);

    const currentMap = new Map((currentRecords || []).map((r: any) => [r.student_id, r.id]));

    const upserts = records.filter(r => r.status).map(r => {
      const existingId = currentMap.get(r.student_id);
      return {
        ...(existingId ? { id: existingId } : {}),
        session_id: sessionId,
        student_id: r.student_id,
        status: r.status,
        note: r.note,
      };
    });

    if (upserts.length > 0) {
      const { error: upsertErr } = await supabase
        .from("attendance_record")
        .upsert(upserts);

      if (upsertErr) {
        console.error("Upsert error:", upsertErr);
        toast.error("Failed to save records.");
        setSaving(false);
        return;
      }
    }

    if (lock) {
      const { error: lockErr } = await supabase
        .from("attendance_session")
        .update({ is_locked: true })
        .eq("id", sessionId);

      if (lockErr) {
        console.error("Lock error:", lockErr);
        toast.error("Failed to lock session.");
        setSaving(false);
        return;
      }

      toast.success("Session saved and locked successfully");
      router.push("/attendance");
    } else {
      toast.success("Attendance saved successfully");
    }

    setSaving(false);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Card>
          <CardContent className="p-5 space-y-4">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!sessionData) return null;

  const total = records.length;
  const presentCount = records.filter(r => r.status === "present" || r.status === "late").length;
  const absentCount = records.filter(r => r.status === "absent").length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/attendance")}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors"
            >
              ←
            </button>
            <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Roll Call</h1>
            {sessionData.is_locked && (
              <span className="bg-neutral-100 text-neutral-500 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                🔒 LOCKED
              </span>
            )}
          </div>
          <div className="mt-2 pl-11">
            <p className="text-[14px] font-bold text-neutral-900">
              {sessionData.batch_name} <span className="text-neutral-400 font-normal ml-1">({sessionData.class_name})</span>
            </p>
            <p className="text-[12px] text-neutral-500 mt-0.5">
              {formatDate(sessionData.session_date)}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-3xl font-black text-neutral-900 tracking-tighter">
            {presentCount}<span className="text-xl text-neutral-300">/{total}</span>
          </div>
          <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Present</p>
        </div>
      </div>

      {/* ── Toolbar ── */}
      {!sessionData.is_locked && (
        <Card className="bg-neutral-50/50 border-dashed">
          <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-semibold text-neutral-600">Quick Mark:</span>
              <Button variant="outline" size="sm" onClick={() => markAll("present")} className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200">
                Mark All Present
              </Button>
              <Button variant="outline" size="sm" onClick={() => markAll("absent")} className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                Mark All Absent
              </Button>
            </div>
            <div className="text-[12px] text-neutral-500 font-medium">
              {records.filter(r => !r.status).length} unmarked students remaining
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Student List ── */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-neutral-100">
            {records.map((student, idx) => (
              <div key={student.student_id} className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${!student.status ? "bg-amber-50/30" : "hover:bg-neutral-50"}`}>
                
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-[11px] font-bold text-neutral-400 flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-neutral-900">{student.name}</p>
                    {student.email && <p className="text-[11px] text-neutral-400">{student.email}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:ml-auto">
                  <StatusButton
                    current={student.status}
                    status="present"
                    label="Present"
                    colorClass="bg-emerald-500 text-white shadow-sm ring-2 ring-emerald-500 ring-offset-1"
                    onClick={() => updateStatus(student.student_id, "present")}
                    disabled={sessionData.is_locked}
                  />
                  <StatusButton
                    current={student.status}
                    status="absent"
                    label="Absent"
                    colorClass="bg-red-500 text-white shadow-sm ring-2 ring-red-500 ring-offset-1"
                    onClick={() => updateStatus(student.student_id, "absent")}
                    disabled={sessionData.is_locked}
                  />
                  <StatusButton
                    current={student.status}
                    status="late"
                    label="Late"
                    colorClass="bg-amber-500 text-white shadow-sm ring-2 ring-amber-500 ring-offset-1"
                    onClick={() => updateStatus(student.student_id, "late")}
                    disabled={sessionData.is_locked}
                  />
                  <StatusButton
                    current={student.status}
                    status="excused"
                    label="Excused"
                    colorClass="bg-blue-500 text-white shadow-sm ring-2 ring-blue-500 ring-offset-1"
                    onClick={() => updateStatus(student.student_id, "excused")}
                    disabled={sessionData.is_locked}
                  />
                </div>
              </div>
            ))}
            
            {records.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-3xl mb-2 opacity-30">👥</p>
                <p className="text-[13px] font-semibold text-neutral-500">No students found in this batch.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Sticky Action Bar ── */}
      {!sessionData.is_locked && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-neutral-200 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-50 lg:ml-64">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="text-[12px] font-medium text-neutral-500">
              {records.filter(r => r.status).length} / {total} marked
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => handleSave(false)} disabled={saving || records.length === 0}>
                {saving ? "Saving..." : "Save Draft"}
              </Button>
              <Button onClick={() => handleSave(true)} disabled={saving || records.length === 0} className="bg-edu-600 hover:bg-edu-700 text-white font-bold px-6 shadow-md">
                {saving ? "Saving..." : "💾 Save & Lock Session"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
