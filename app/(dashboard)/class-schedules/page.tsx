"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// ── Constants ─────────────────────────────────────────────────────────────────
const DAYS = [
  { value: 0, label: "Sunday"    },
  { value: 1, label: "Monday"    },
  { value: 2, label: "Tuesday"   },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday"  },
  { value: 5, label: "Friday"    },
  { value: 6, label: "Saturday"  },
];

const DAY_COLORS: Record<number, string> = {
  0: "bg-rose-50   text-rose-700   border-rose-200",
  1: "bg-blue-50   text-blue-700   border-blue-200",
  2: "bg-violet-50 text-violet-700 border-violet-200",
  3: "bg-amber-50  text-amber-700  border-amber-200",
  4: "bg-teal-50   text-teal-700   border-teal-200",
  5: "bg-green-50  text-green-700  border-green-200",
  6: "bg-orange-50 text-orange-700 border-orange-200",
};

// ── Types ─────────────────────────────────────────────────────────────────────
type ScheduleRecord = {
  id:          string;
  batch_id:    string;
  teacher_id:  string | null;
  day_of_week: number;
  start_time:  string;
  end_time:    string;
  room:        string | null;
  notes:       string | null;
  is_active:   boolean;
  created_at:  string;
  batch:    { id: string; name: string; class: { id: string; class: string } | null; subject: { id: string; name: string; code: string | null } | null } | null;
  teacher:  { id: string; name: string } | null;
};

type BatchOption  = { id: string; name: string; class_name: string; subject_name: string | null; teacher_id: string | null; teacher_name: string | null };
type TeacherOption = { id: string; name: string };

type ScheduleForm = {
  batch_id:    string;
  teacher_id:  string;
  day_of_week: string;
  start_time:  string;
  end_time:    string;
  room:        string;
  notes:       string;
  is_active:   boolean;
};

const EMPTY_FORM: ScheduleForm = {
  batch_id:    "",
  teacher_id:  "",
  day_of_week: "",
  start_time:  "",
  end_time:    "",
  room:        "",
  notes:       "",
  is_active:   true,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(t: string) {
  if (!t) return "—";
  const [h, m] = t.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12  = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, valueClass }: {
  label: string; value: number; valueClass?: string;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="px-5 pt-5 pb-4">
        <p className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500 mb-2">{label}</p>
        <p className={["text-[30px] font-black leading-none tracking-tight", valueClass ?? "text-neutral-900"].join(" ")}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

// ── Toggle Switch ─────────────────────────────────────────────────────────────
function ToggleSwitch({ checked, onChange, label, hint }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; hint: string;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
      <div>
        <p className="text-[13px] font-semibold text-neutral-800">{label}</p>
        <p className="text-[11px] text-neutral-500">{hint}</p>
      </div>
      <button type="button" onClick={() => onChange(!checked)}
        className={["relative rounded-full transition-colors duration-200 focus:outline-none", checked ? "bg-success-500" : "bg-neutral-300"].join(" ")}
        style={{ width: 40, height: 22, flexShrink: 0 }}>
        <span className={["absolute top-[3px] w-4 h-4 bg-white rounded-full shadow transition-transform duration-200", checked ? "translate-x-[19px]" : "translate-x-[3px]"].join(" ")} />
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ClassSchedulePage() {
  const [schedules,     setSchedules]     = useState<ScheduleRecord[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const [dayFilter,     setDayFilter]     = useState("all");
  const [batchFilter,   setBatchFilter]   = useState("all");
  const [statusFilter,  setStatusFilter]  = useState("all");

  // Lookup data
  const [batches,       setBatches]       = useState<BatchOption[]>([]);
  const [teachers,      setTeachers]      = useState<TeacherOption[]>([]);

  // Add / Edit
  const [addOpen,       setAddOpen]       = useState(false);
  const [editTarget,    setEditTarget]    = useState<ScheduleRecord | null>(null);
  const [form,          setForm]          = useState<ScheduleForm>(EMPTY_FORM);
  const [saving,        setSaving]        = useState(false);

  // Auto-fill teacher from batch
  const [autoTeacher,   setAutoTeacher]   = useState<string | null>(null);

  // Delete
  const [deleteTarget,  setDeleteTarget]  = useState<ScheduleRecord | null>(null);
  const [deleting,      setDeleting]      = useState(false);

  // ── Fetch lookup data ────────────────────────────────────────────────────
  useEffect(() => {
    // Fetch active batches with class, subject, teacher
    supabase
      .from("batch")
      .select(`
        id, name,
        class:class_id   ( id, class ),
        subject:subject_id ( id, name, code ),
        teacher:teacher_id ( id, name )
      `)
      .eq("is_active", true)
      .order("name")
      .then(({ data }) => {
        if (data) {
          setBatches((data as any[]).map((b) => ({
            id:           b.id,
            name:         b.name,
            class_name:   b.class?.class      ?? "—",
            subject_name: b.subject?.name     ?? null,
            teacher_id:   b.teacher?.id       ?? null,
            teacher_name: b.teacher?.name     ?? null,
          })));
        }
      });

    // Fetch active teachers
    supabase
      .from("teachers")
      .select("id, name")
      .eq("is_active", true)
      .order("name")
      .then(({ data }) => { if (data) setTeachers(data); });
  }, []);

  // ── Fetch schedules ──────────────────────────────────────────────────────
  const fetchSchedules = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("class_schedule")
      .select(`
        id, batch_id, teacher_id, day_of_week,
        start_time, end_time, room, notes,
        is_active, created_at,
        batch:batch_id (
          id, name,
          class:class_id   ( id, class ),
          subject:subject_id ( id, name, code )
        ),
        teacher:teacher_id ( id, name )
      `)
      .order("day_of_week")
      .order("start_time");

    if (search)
      query = query.or(`room.ilike.%${search}%`);

    if (dayFilter !== "all")
      query = query.eq("day_of_week", parseInt(dayFilter));

    if (batchFilter !== "all")
      query = query.eq("batch_id", batchFilter);

    if (statusFilter === "active")
      query = query.eq("is_active", true);
    else if (statusFilter === "inactive")
      query = query.eq("is_active", false);

    const { data, error } = await query;
    if (error) toast.error("Failed to load schedules");
    else setSchedules((data as unknown as ScheduleRecord[]) ?? []);
    setLoading(false);
  }, [search, dayFilter, batchFilter, statusFilter]);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  // ── Auto-fill teacher when batch is selected ─────────────────────────────
  const handleBatchChange = (batch_id: string) => {
    const batch = batches.find((b) => b.id === batch_id);
    if (batch?.teacher_id) {
      setAutoTeacher(batch.teacher_name);
      setForm((prev) => ({ ...prev, batch_id, teacher_id: batch.teacher_id! }));
    } else {
      setAutoTeacher(null);
      setForm((prev) => ({ ...prev, batch_id, teacher_id: "" }));
    }
  };

  // ── Add schedule ─────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!form.batch_id || form.day_of_week === "" || !form.start_time || !form.end_time) {
      toast.error("Batch, day, start time and end time are required");
      return;
    }
    if (form.start_time >= form.end_time) {
      toast.error("End time must be after start time");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("class_schedule").insert({
      batch_id:    form.batch_id,
      teacher_id:  form.teacher_id  || null,
      day_of_week: parseInt(form.day_of_week),
      start_time:  form.start_time,
      end_time:    form.end_time,
      room:        form.room        || null,
      notes:       form.notes       || null,
      is_active:   form.is_active,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Schedule created successfully");
      setAddOpen(false);
      setForm(EMPTY_FORM);
      setAutoTeacher(null);
      fetchSchedules();
    }
    setSaving(false);
  };

  // ── Open edit ────────────────────────────────────────────────────────────
  const openEdit = (s: ScheduleRecord) => {
    setEditTarget(s);
    const batch = batches.find((b) => b.id === s.batch_id);
    setAutoTeacher(batch?.teacher_name ?? null);
    setForm({
      batch_id:    s.batch_id,
      teacher_id:  s.teacher_id  ?? "",
      day_of_week: String(s.day_of_week),
      start_time:  s.start_time,
      end_time:    s.end_time,
      room:        s.room   ?? "",
      notes:       s.notes  ?? "",
      is_active:   s.is_active,
    });
  };

  // ── Save edit ────────────────────────────────────────────────────────────
  const handleEdit = async () => {
    if (!editTarget) return;
    if (!form.batch_id || form.day_of_week === "" || !form.start_time || !form.end_time) {
      toast.error("Batch, day, start time and end time are required");
      return;
    }
    if (form.start_time >= form.end_time) {
      toast.error("End time must be after start time");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("class_schedule")
      .update({
        batch_id:    form.batch_id,
        teacher_id:  form.teacher_id  || null,
        day_of_week: parseInt(form.day_of_week),
        start_time:  form.start_time,
        end_time:    form.end_time,
        room:        form.room   || null,
        notes:       form.notes  || null,
        is_active:   form.is_active,
      })
      .eq("id", editTarget.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Schedule updated successfully");
      setEditTarget(null);
      setForm(EMPTY_FORM);
      setAutoTeacher(null);
      fetchSchedules();
    }
    setSaving(false);
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("class_schedule").delete().eq("id", deleteTarget.id);
    if (error) toast.error("Failed to delete schedule");
    else { toast.success("Schedule deleted"); fetchSchedules(); }
    setDeleting(false);
    setDeleteTarget(null);
  };

  // ── Stats ────────────────────────────────────────────────────────────────
  const total    = schedules.length;
  const active   = schedules.filter((s) => s.is_active).length;
  const inactive = schedules.filter((s) => !s.is_active).length;
  const uniqueBatches = new Set(schedules.map((s) => s.batch_id)).size;

  // ── Schedule Form JSX (shared between Add + Edit modals) ─────────────────
  const ScheduleFormFields = (
    <div className="space-y-4">
      {/* Batch */}
      <div className="space-y-1.5">
        <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">Batch *</Label>
        <Select value={form.batch_id} onValueChange={handleBatchChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a batch" />
          </SelectTrigger>
          <SelectContent>
            {batches.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-neutral-400">No active batches found</div>
            ) : (
              batches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  <span className="font-semibold">{b.name}</span>
                  <span className="text-neutral-400 ml-1.5 text-xs">· {b.class_name}</span>
                  {b.subject_name && <span className="text-neutral-400 ml-1 text-xs">· {b.subject_name}</span>}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Teacher — auto-filled from batch or manual select */}
      <div className="space-y-1.5">
        <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">Teacher</Label>
        {autoTeacher ? (
          <div className="h-9 rounded-md border border-success-400/50 bg-success-50 flex items-center justify-between px-3">
            <span className="text-sm font-semibold text-success-700">{autoTeacher}</span>
            <span className="font-mono text-[10px] text-success-600 bg-success-100 border border-success-400/30 px-1.5 py-0.5 rounded-full">
              From batch
            </span>
          </div>
        ) : (
          <Select value={form.teacher_id} onValueChange={(val) => setForm((prev) => ({ ...prev, teacher_id: val }))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a teacher (optional)" />
            </SelectTrigger>
            <SelectContent>
              {teachers.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Day + Time */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">Day *</Label>
          <Select value={form.day_of_week} onValueChange={(val) => setForm((prev) => ({ ...prev, day_of_week: val }))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Day" />
            </SelectTrigger>
            <SelectContent>
              {DAYS.map((d) => (
                <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">Start Time *</Label>
          <Input type="time" value={form.start_time}
            onChange={(e) => setForm((prev) => ({ ...prev, start_time: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">End Time *</Label>
          <Input type="time" value={form.end_time}
            onChange={(e) => setForm((prev) => ({ ...prev, end_time: e.target.value }))} />
        </div>
      </div>

      {/* Room */}
      <div className="space-y-1.5">
        <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">Room / Location</Label>
        <Input placeholder="e.g. Room 101, Lab A, Online" value={form.room}
          onChange={(e) => setForm((prev) => ({ ...prev, room: e.target.value }))} />
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">Notes</Label>
        <Textarea placeholder="Optional notes…" rows={2} className="resize-none"
          value={form.notes}
          onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} />
      </div>

      {/* Active toggle */}
      <ToggleSwitch
        checked={form.is_active}
        onChange={(v) => setForm((prev) => ({ ...prev, is_active: v }))}
        label="Active Schedule"
        hint="Inactive schedules are hidden from student views"
      />
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Schedules"  value={total}         />
        <StatCard label="Active"           value={active}        valueClass="text-success-600" />
        <StatCard label="Inactive"         value={inactive}      valueClass="text-danger-600"  />
        <StatCard label="Batches Scheduled" value={uniqueBatches} valueClass="text-edu-600"    />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm pointer-events-none">⌕</span>
          <Input className="pl-8" placeholder="Search by room…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {/* Day filter */}
        <Select value={dayFilter} onValueChange={setDayFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Days" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Days</SelectItem>
            {DAYS.map((d) => (
              <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Batch filter */}
        <Select value={batchFilter} onValueChange={setBatchFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Batches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Batches</SelectItem>
            {batches.map((b) => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={() => { setForm(EMPTY_FORM); setAutoTeacher(null); setAddOpen(true); }}>
          + Add Schedule
        </Button>
        <Button variant="outline" onClick={fetchSchedules}>↺ Refresh</Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="px-5 py-3.5 border-b border-neutral-100 flex-row items-center gap-3 space-y-0">
          <span className="text-[13px] font-bold text-neutral-900">Class Schedules</span>
          <span className="font-mono text-[11px] bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full">
            {schedules.length} total
          </span>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col gap-2.5 p-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full rounded-lg" style={{ opacity: 1 - i * 0.15 }} />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                    {["#", "Day", "Batch", "Class", "Subject", "Teacher", "Time", "Room", "Status", "Actions"].map((h) => (
                      <TableHead key={h} className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500 whitespace-nowrap">
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {schedules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10}>
                        <div className="py-14 text-center">
                          <p className="text-3xl opacity-30 mb-2">◈</p>
                          <p className="text-[13px] text-neutral-500">
                            No schedules found. Add your first class schedule to get started.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    schedules.map((s, i) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-[11px] text-neutral-400">
                          {String(i + 1).padStart(2, "0")}
                        </TableCell>

                        {/* Day */}
                        <TableCell>
                          <span className={`text-[10px] font-semibold border px-2 py-0.5 rounded-full font-mono whitespace-nowrap ${DAY_COLORS[s.day_of_week]}`}>
                            {DAYS[s.day_of_week]?.label}
                          </span>
                        </TableCell>

                        {/* Batch */}
                        <TableCell className="font-semibold text-neutral-900 whitespace-nowrap">
                          {s.batch?.name ?? "—"}
                        </TableCell>

                        {/* Class */}
                        <TableCell>
                          {s.batch?.class ? (
                            <span className="text-xs font-semibold bg-neutral-100 text-neutral-700 border border-neutral-200 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                              {s.batch.class.class}
                            </span>
                          ) : <span className="text-neutral-300">—</span>}
                        </TableCell>

                        {/* Subject */}
                        <TableCell>
                          {s.batch?.subject ? (
                            <span className="text-xs font-semibold bg-edu-50 text-edu-700 border border-edu-200/70 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                              {s.batch.subject.code ? `${s.batch.subject.code} – ${s.batch.subject.name}` : s.batch.subject.name}
                            </span>
                          ) : <span className="text-neutral-300">—</span>}
                        </TableCell>

                        {/* Teacher */}
                        <TableCell className="text-neutral-700 text-xs font-semibold whitespace-nowrap">
                          {s.teacher?.name ?? <span className="text-neutral-300">—</span>}
                        </TableCell>

                        {/* Time */}
                        <TableCell className="font-mono text-[11px] text-neutral-600 whitespace-nowrap">
                          {formatTime(s.start_time)} – {formatTime(s.end_time)}
                        </TableCell>

                        {/* Room */}
                        <TableCell className="text-neutral-500 text-xs whitespace-nowrap">
                          {s.room ?? <span className="text-neutral-300">—</span>}
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Badge className={
                            s.is_active
                              ? "bg-success-100 text-success-700 border border-success-500/20 hover:bg-success-100 font-mono text-[10px] tracking-wide"
                              : "bg-danger-100 text-danger-700 border border-danger-500/20 hover:bg-danger-100 font-mono text-[10px] tracking-wide"
                          }>
                            <span className="w-1.5 h-1.5 rounded-full bg-current mr-1 shrink-0" />
                            {s.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>

                        {/* Actions */}
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Button variant="ghost" size="sm"
                              className="text-[11px] font-semibold text-edu-600 bg-edu-50 border border-edu-500/15 hover:bg-edu-500 hover:text-white h-auto py-1 px-2.5"
                              onClick={() => openEdit(s)}>
                              ✎ Edit
                            </Button>
                            <Button variant="ghost" size="sm"
                              className="text-[11px] font-semibold text-danger-600 bg-danger-100 border border-danger-500/15 hover:bg-danger-500 hover:text-white h-auto py-1 px-2.5"
                              onClick={() => setDeleteTarget(s)}>
                              ✕ Delete
                            </Button>
                          </div>
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

      {/* ── Add Modal ── */}
      <Dialog open={addOpen} onOpenChange={(open) => {
        if (!open) { setAddOpen(false); setForm(EMPTY_FORM); setAutoTeacher(null); }
      }}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader><DialogTitle>Add New Schedule</DialogTitle></DialogHeader>
          <div className="font-mono text-[11px] text-neutral-500 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2.5 leading-relaxed">
            ◈ Schedule a recurring class session for a batch. The teacher will be{" "}
            <span className="text-edu-600 font-semibold">auto-filled</span> from the batch if assigned.
          </div>
          {ScheduleFormFields}
          <div className="flex justify-end gap-2.5 pt-1">
            <Button variant="outline" onClick={() => { setAddOpen(false); setForm(EMPTY_FORM); setAutoTeacher(null); }}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={saving}>
              {saving ? "Creating…" : "Create Schedule"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit Modal ── */}
      <Dialog open={!!editTarget} onOpenChange={(open) => {
        if (!open) { setEditTarget(null); setForm(EMPTY_FORM); setAutoTeacher(null); }
      }}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader><DialogTitle>Edit Schedule</DialogTitle></DialogHeader>
          {ScheduleFormFields}
          <div className="flex justify-end gap-2.5 pt-1">
            <Button variant="outline" onClick={() => { setEditTarget(null); setForm(EMPTY_FORM); setAutoTeacher(null); }}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Dialog ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="w-11 h-11 rounded-xl bg-danger-100 border border-danger-500/20 grid place-items-center text-xl mb-1">⚠</div>
            <AlertDialogTitle>Delete Schedule?</AlertDialogTitle>
            <AlertDialogDescription>
              You&apos;re about to permanently delete the{" "}
              <strong className="text-foreground">
                {deleteTarget && DAYS[deleteTarget.day_of_week]?.label}
              </strong>{" "}
              schedule for{" "}
              <strong className="text-foreground">{deleteTarget?.batch?.name}</strong>.{" "}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-danger-500 hover:bg-danger-600 text-white"
              onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete Schedule"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}