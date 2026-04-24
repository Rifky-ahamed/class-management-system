"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// ── Types ─────────────────────────────────────────────────────────────────────
type Student = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  dob: string | null;
  is_active: boolean;
  is_registered: boolean;
  force_password_reset: boolean;
  last_login: string | null;
  created_at: string;
  batches: EnrolledBatch[];
};

type EnrolledBatch = {
  batch_id: string;
  batch_name: string;
  class_name: string;
  subject_name: string | null;
};

type BatchOption = {
  id: string;
  name: string;
  class_name: string;
  subject_name: string | null;
  subject_code: string | null;
  teacher_name: string | null;
};

type AddForm = {
  name: string;
  email: string;
  phone: string;
  dob: string;
};

const EMPTY_FORM: AddForm = { name: "", email: "", phone: "", dob: "" };

// ── Helpers ───────────────────────────────────────────────────────────────────
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

// ── Batch Checkbox Row ────────────────────────────────────────────────────────
function BatchCheckRow({ batch, checked, onChange }: {
  batch: BatchOption; checked: boolean; onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={[
        "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-150",
        checked
          ? "bg-edu-50 border-edu-400/50 shadow-sm"
          : "bg-white border-neutral-200 hover:border-neutral-300",
      ].join(" ")}
    >
      <div
        className={[
          "w-4 h-4 mt-0.5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors duration-150",
          checked ? "bg-edu-600 border-edu-600" : "border-neutral-300 bg-white",
        ].join(" ")}
        onClick={() => onChange(!checked)}
      >
        {checked && (
          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
            <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[13px] font-semibold text-neutral-900">{batch.name}</span>
          <span className="font-mono text-[10px] font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200 px-2 py-0.5 rounded-full">
            {batch.class_name}
          </span>
          {batch.subject_name && (
            <span className="font-mono text-[10px] font-semibold bg-edu-50 text-edu-700 border border-edu-200/70 px-2 py-0.5 rounded-full">
              {batch.subject_code ? `${batch.subject_code} · ` : ""}{batch.subject_name}
            </span>
          )}
        </div>
        {batch.teacher_name && (
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[10px] text-neutral-400 font-mono uppercase tracking-[1px]">Teacher</span>
            <span className="text-[11px] font-semibold text-neutral-600">{batch.teacher_name}</span>
          </div>
        )}
      </div>
    </label>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function StudentsPage() {
  const [students,     setStudents]     = useState<Student[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [classFilter,  setClassFilter]  = useState("all");
  const [classOptions, setClassOptions] = useState<{ id: string; name: string }[]>([]);

  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [deleting,     setDeleting]     = useState(false);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm,      setAddForm]      = useState<AddForm>(EMPTY_FORM);
  const [adding,       setAdding]       = useState(false);

  const [assignTarget,     setAssignTarget]     = useState<Student | null>(null);
  const [allBatches,       setAllBatches]       = useState<BatchOption[]>([]);
  const [selectedBatchIds, setSelectedBatchIds] = useState<Set<string>>(new Set());
  const [batchSearch,      setBatchSearch]      = useState("");
  const [saving,           setSaving]           = useState(false);
  const [loadingBatches,   setLoadingBatches]   = useState(false);

  // ── Fetch students ───────────────────────────────────────────────────────
  const fetchStudents = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("student")
      .select(`id, name, email, phone, dob,
        is_active, is_registered, force_password_reset,
        last_login, created_at`)
      .order("created_at", { ascending: false });

    if (search)
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);

    const { data: studentData, error } = await query;
    if (error) { toast.error("Failed to load students"); setLoading(false); return; }

    const studentIds = (studentData ?? []).map((s) => s.id);

    // Fetch enrolled batches with class + subject
    const { data: sbRows } = studentIds.length > 0
      ? await supabase
          .from("student_batch")
          .select(`
            student_id,
            batch:batch_id (
              id, name,
              class:class_id    ( id, class ),
              subject:subject_id ( id, name )
            )
          `)
          .in("student_id", studentIds)
      : { data: [] };

    // ── Build map ────────────────────────────────────────────────────────
    const batchMap: Record<string, EnrolledBatch[]> = {};   // ← declared here
    (sbRows ?? []).forEach((row: any) => {
      const sid = row.student_id;
      if (!batchMap[sid]) batchMap[sid] = [];
      if (row.batch) {
        batchMap[sid].push({
          batch_id:     row.batch.id,
          batch_name:   row.batch.name,
          class_name:   row.batch.class?.class  ?? "—",
          subject_name: row.batch.subject?.name ?? null,
        });
      }
    });

    const enriched: Student[] = (studentData ?? []).map((s) => ({
      ...s,
      batches: batchMap[s.id] ?? [],
    }));

    // Build class filter options
    const classMap: Record<string, string> = {};
    enriched.forEach((s) => s.batches.forEach((b) => { classMap[b.class_name] = b.class_name; }));
    setClassOptions(Object.keys(classMap).map((name) => ({ id: name, name })));

    const filtered = classFilter === "all"
      ? enriched
      : enriched.filter((s) => s.batches.some((b) => b.class_name === classFilter));

    setStudents(filtered);
    setLoading(false);
  }, [search, classFilter]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  // ── Open assign modal ────────────────────────────────────────────────────
  const openAssignModal = async (student: Student) => {
    setAssignTarget(student);
    setLoadingBatches(true);
    setBatchSearch("");

    const { data: batchRows, error } = await supabase
      .from("batch")
      .select(`
        id, name,
        class:class_id    ( id, class ),
        subject:subject_id ( id, name, code )
      `)
      .eq("is_active", true)
      .order("name");

    if (error) { toast.error("Failed to load batches"); setLoadingBatches(false); return; }

    const { data: teacherRows } = await supabase
      .from("teachers")
      .select("id, name, subject_id")
      .not("subject_id", "is", null);

    const teacherBySubject: Record<string, string> = {};
    (teacherRows ?? []).forEach((t) => {
      if (t.subject_id) teacherBySubject[t.subject_id] = t.name;
    });

    const options: BatchOption[] = (batchRows ?? []).map((b: any) => ({
      id:           b.id,
      name:         b.name,
      class_name:   b.class?.class   ?? "—",
      subject_name: b.subject?.name  ?? null,
      subject_code: b.subject?.code  ?? null,
      teacher_name: b.subject ? (teacherBySubject[b.subject.id] ?? null) : null,
    }));

    setAllBatches(options);
    setSelectedBatchIds(new Set(student.batches.map((b) => b.batch_id)));
    setLoadingBatches(false);
  };

  // ── Save assignments ─────────────────────────────────────────────────────
  const handleSaveAssignments = async () => {
    if (!assignTarget) return;
    setSaving(true);

    const currentIds = new Set(assignTarget.batches.map((b) => b.batch_id));
    const toAdd      = [...selectedBatchIds].filter((id) => !currentIds.has(id));
    const toRemove   = [...currentIds].filter((id) => !selectedBatchIds.has(id));

    if (toAdd.length > 0) {
      const { error } = await supabase.from("student_batch").insert(
        toAdd.map((batch_id) => ({ student_id: assignTarget.id, batch_id }))
      );
      if (error) { toast.error("Failed to add some batch assignments"); setSaving(false); return; }
    }

    if (toRemove.length > 0) {
      const { error } = await supabase
        .from("student_batch").delete()
        .eq("student_id", assignTarget.id)
        .in("batch_id", toRemove);
      if (error) { toast.error("Failed to remove some batch assignments"); setSaving(false); return; }
    }

    toast.success(`Batch assignments updated for ${assignTarget.name}`);
    setAssignTarget(null);
    fetchStudents();
    setSaving(false);
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("student").delete().eq("id", deleteTarget.id);
    if (error) toast.error("Failed to delete student");
    else { toast.success(`${deleteTarget.name} removed successfully`); fetchStudents(); }
    setDeleting(false);
    setDeleteTarget(null);
  };

  // ── Add student ──────────────────────────────────────────────────────────
  const handleAddStudent = async () => {
    if (!addForm.name || !addForm.email) { toast.error("Name and email are required"); return; }
    setAdding(true);
    const { error } = await supabase.from("student").insert({
      name: addForm.name, email: addForm.email,
      phone: addForm.phone || null, dob: addForm.dob || null,
      is_registered: true, is_active: true, force_password_reset: true,
    });
    if (error) toast.error(error.message);
    else {
      toast.success(`Student added! Credentials sent to ${addForm.email}`);
      setAddModalOpen(false); setAddForm(EMPTY_FORM); fetchStudents();
    }
    setAdding(false);
  };

  const toggleBatch = (id: string, checked: boolean) => {
    setSelectedBatchIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  };

  const filteredBatches = allBatches.filter((b) =>
    !batchSearch ||
    b.name.toLowerCase().includes(batchSearch.toLowerCase()) ||
    b.class_name.toLowerCase().includes(batchSearch.toLowerCase()) ||
    (b.subject_name ?? "").toLowerCase().includes(batchSearch.toLowerCase())
  );

  const totalStudents = students.length;
  const activeCount   = students.filter((s) => s.is_active).length;
  const pendingCount  = students.filter((s) => s.force_password_reset).length;
  const inactiveCount = students.filter((s) => !s.is_active).length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Students" value={totalStudents} />
        <StatCard label="Active"         value={activeCount}   valueClass="text-success-600" />
        <StatCard label="Pending Reset"  value={pendingCount}  valueClass="text-warning-600" />
        <StatCard label="Inactive"       value={inactiveCount} valueClass="text-danger-600"  />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm pointer-events-none">⌕</span>
          <Input className="pl-8" placeholder="Search by name or email…" value={search}
            onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Classes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classOptions.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={() => setAddModalOpen(true)}>+ Add Student</Button>
        <Button variant="outline" onClick={fetchStudents}>↺ Refresh</Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="px-5 py-3.5 border-b border-neutral-100 flex-row items-center gap-3 space-y-0">
          <span className="text-[13px] font-bold text-neutral-900">Student Records</span>
          <span className="font-mono text-[11px] bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full">
            {students.length} total
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
                    {["#", "Student", "Email", "Enrolled Batches", "Subject", "Phone", "Status", "Last Login", "Actions"].map((h) => (
                      <TableHead key={h} className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500 whitespace-nowrap">
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {students.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9}>  {/* ← 9 columns now */}
                        <div className="py-14 text-center">
                          <p className="text-3xl opacity-30 mb-2">◈</p>
                          <p className="text-[13px] text-neutral-500">
                            No students found. Try adjusting filters or add a new student.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    students.map((s, i) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-[11px] text-neutral-400">
                          {String(i + 1).padStart(2, "0")}
                        </TableCell>
                        <TableCell className="font-semibold text-neutral-900">{s.name}</TableCell>
                        <TableCell className="text-neutral-500 text-xs">{s.email}</TableCell>

                        {/* Enrolled Batches */}
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {s.batches.length === 0 ? (
                              <span className="text-neutral-300 text-xs">Not assigned</span>
                            ) : (
                              s.batches.map((b) => (
                                <span key={b.batch_id}
                                  className="text-[10px] font-semibold bg-edu-50 text-edu-700 border border-edu-200/70 px-2 py-0.5 rounded-full whitespace-nowrap font-mono">
                                  {b.class_name} · {b.batch_name}
                                </span>
                              ))
                            )}
                          </div>
                        </TableCell>

                        {/* Subject — deduplicated across batches */}
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(() => {
                              const unique = [
                                ...new Map(
                                  s.batches
                                    .filter((b) => b.subject_name)
                                    .map((b) => [b.subject_name, b])
                                ).values(),
                              ];
                              return unique.length === 0 ? (
                                <span className="text-neutral-300">—</span>
                              ) : (
                                unique.map((b) => (
                                  <span key={b.batch_id}
                                    className="text-[10px] font-semibold bg-neutral-100 text-neutral-700 border border-neutral-200 px-2 py-0.5 rounded-full whitespace-nowrap font-mono">
                                    {b.subject_name}
                                  </span>
                                ))
                              );
                            })()}
                          </div>
                        </TableCell>

                        <TableCell className="text-neutral-500 text-xs">{s.phone ?? "—"}</TableCell>
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
                        <TableCell className="font-mono text-[11px] text-neutral-500 whitespace-nowrap">
                          {formatDate(s.last_login)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Button variant="ghost" size="sm"
                              className="text-[11px] font-semibold text-edu-600 bg-edu-50 border border-edu-500/15 hover:bg-edu-500 hover:text-white h-auto py-1 px-2.5 whitespace-nowrap"
                              onClick={() => openAssignModal(s)}>
                              ⊞ Assign Batches
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

      {/* ── Delete dialog ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="w-11 h-11 rounded-xl bg-danger-100 border border-danger-500/20 grid place-items-center text-xl mb-1">⚠</div>
            <AlertDialogTitle>Delete Student?</AlertDialogTitle>
            <AlertDialogDescription>
              You&apos;re about to permanently remove{" "}
              <strong className="text-foreground">{deleteTarget?.name}</strong>.{" "}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-danger-500 hover:bg-danger-600 text-white"
              onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete Student"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Add student modal ── */}
      <Dialog open={addModalOpen} onOpenChange={(open) => { if (!open) setAddModalOpen(false); }}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader><DialogTitle>Add New Student</DialogTitle></DialogHeader>
          <div className="font-mono text-[11px] text-neutral-500 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2.5 leading-relaxed">
            ◈ System will auto-generate a temporary password and{" "}
            <span className="text-edu-600 font-semibold">email credentials</span>{" "}
            to the student. They&apos;ll be forced to change password on first login.
            You can assign batches after adding the student.
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">Full Name *</Label>
              <Input placeholder="John Doe" value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">Email Address *</Label>
              <Input type="email" placeholder="student@email.com" value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">Phone</Label>
                <Input placeholder="+94 77 123 4567" value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">Date of Birth</Label>
                <Input type="date" value={addForm.dob}
                  onChange={(e) => setAddForm({ ...addForm, dob: e.target.value })} />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2.5 pt-1">
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddStudent} disabled={adding}>
              {adding ? "Adding…" : "Add Student & Send Email"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Assign Batches modal ── */}
      <Dialog open={!!assignTarget} onOpenChange={(open) => { if (!open) setAssignTarget(null); }}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader><DialogTitle>Assign Batches</DialogTitle></DialogHeader>

          <div className="flex items-center gap-2.5 px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg">
            <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-[1.5px]">Student</span>
            <span className="text-[13px] font-semibold text-neutral-900">{assignTarget?.name}</span>
            {assignTarget && assignTarget.batches.length > 0 && (
              <span className="ml-auto font-mono text-[10px] bg-edu-50 text-edu-700 border border-edu-200/70 px-2 py-0.5 rounded-full">
                {assignTarget.batches.length} enrolled
              </span>
            )}
          </div>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm pointer-events-none">⌕</span>
            <Input className="pl-8" placeholder="Search batches by name, class, or subject…"
              value={batchSearch} onChange={(e) => setBatchSearch(e.target.value)} />
          </div>

          {selectedBatchIds.size > 0 && (
            <div className="flex items-center justify-between px-3 py-2 bg-edu-50 border border-edu-200/70 rounded-lg">
              <span className="text-[12px] font-semibold text-edu-700">
                {selectedBatchIds.size} batch{selectedBatchIds.size !== 1 ? "es" : ""} selected
              </span>
              <button className="text-[11px] text-edu-500 hover:text-edu-700 font-mono underline"
                onClick={() => setSelectedBatchIds(new Set())}>
                Clear all
              </button>
            </div>
          )}

          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-0.5">
            {loadingBatches ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" style={{ opacity: 1 - i * 0.2 }} />
              ))
            ) : filteredBatches.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-3xl opacity-30 mb-2">◈</p>
                <p className="text-[13px] text-neutral-500">
                  {allBatches.length === 0 ? "No active batches found. Create batches first." : "No batches match your search."}
                </p>
              </div>
            ) : (
              filteredBatches.map((b) => (
                <BatchCheckRow key={b.id} batch={b}
                  checked={selectedBatchIds.has(b.id)}
                  onChange={(checked) => toggleBatch(b.id, checked)} />
              ))
            )}
          </div>

          <div className="flex justify-end gap-2.5 pt-1 border-t border-neutral-100">
            <Button variant="outline" onClick={() => setAssignTarget(null)}>Cancel</Button>
            <Button onClick={handleSaveAssignments} disabled={saving || loadingBatches}>
              {saving ? "Saving…" : "Save Assignments"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}