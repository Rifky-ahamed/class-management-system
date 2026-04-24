"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";

import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Badge }    from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card, CardContent, CardHeader,
} from "@/components/ui/card";
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
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Types ────────────────────────────────────────────────────────────────────
type Teacher = {
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
  teacher_subjects?: { subject: { id: string; name: string; code: string | null } }[];
  teacher_classes?:  { class:   { id: string; class: string } }[];
};

type SubjectRecord = { id: string; name: string; code: string | null };
type ClassRecord   = { id: string; class: string };

type AddForm = {
  name:        string;
  email:       string;
  phone:       string;
  dob:         string;
  subject_ids: string[];  // ← fixed: was subject_id
  class_ids:   string[];
};

const EMPTY_FORM: AddForm = {
  name: "", email: "", phone: "", dob: "", subject_ids: [], class_ids: [],
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

// ── Subject Multi Picker ──────────────────────────────────────────────────────
function SubjectMultiPicker({
  subjects, selected, onChange,
  placeholder = "Select subjects",
}: {
  subjects: SubjectRecord[];
  selected: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
}) {
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  const label =
    selected.length === 0
      ? placeholder
      : selected.length === 1
      ? (() => {
          const s = subjects.find((s) => s.id === selected[0]);
          return s ? (s.code ? `${s.code} – ${s.name}` : s.name) : placeholder;
        })()
      : `${selected.length} subjects selected`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button"
          className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
          <span className={selected.length === 0 ? "text-muted-foreground" : ""}>{label}</span>
          <svg className="h-4 w-4 opacity-50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-1" align="start">
        {subjects.length === 0 ? (
          <p className="text-xs text-neutral-400 px-2 py-3 text-center">No subjects found</p>
        ) : (
          <div className="max-h-52 overflow-y-auto space-y-0.5">
            {subjects.map((s) => (
              <label key={s.id}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-neutral-100 cursor-pointer select-none">
                <Checkbox
                  checked={selected.includes(s.id)}
                  onCheckedChange={() => toggle(s.id)}
                />
                <span className="text-sm text-neutral-800">
                  {s.code ? `${s.code} – ${s.name}` : s.name}
                </span>
              </label>
            ))}
          </div>
        )}
        {selected.length > 0 && (
          <div className="border-t border-neutral-100 mt-1 pt-1 px-1">
            <button type="button" onClick={() => onChange([])}
              className="w-full text-xs text-neutral-400 hover:text-danger-600 py-1 text-left px-1">
              ✕ Clear all
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// ── Class Multi Picker ────────────────────────────────────────────────────────
function ClassMultiPicker({
  classes, selected, onChange,
  placeholder = "Select classes",
}: {
  classes: ClassRecord[];
  selected: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
}) {
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  const label =
    selected.length === 0
      ? placeholder
      : selected.length === 1
      ? classes.find((c) => c.id === selected[0])?.class ?? placeholder
      : `${selected.length} classes selected`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button"
          className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring">
          <span className={selected.length === 0 ? "text-muted-foreground" : ""}>{label}</span>
          <svg className="h-4 w-4 opacity-50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-1" align="start">
        {classes.length === 0 ? (
          <p className="text-xs text-neutral-400 px-2 py-3 text-center">No classes found</p>
        ) : (
          <div className="max-h-52 overflow-y-auto space-y-0.5">
            {classes.map((c) => (
              <label key={c.id}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-neutral-100 cursor-pointer select-none">
                <Checkbox
                  checked={selected.includes(c.id)}
                  onCheckedChange={() => toggle(c.id)}
                  id={`cls-${c.id}`}
                />
                <span className="text-sm text-neutral-800">{c.class}</span>
              </label>
            ))}
          </div>
        )}
        {selected.length > 0 && (
          <div className="border-t border-neutral-100 mt-1 pt-1 px-1">
            <button type="button" onClick={() => onChange([])}
              className="w-full text-xs text-neutral-400 hover:text-danger-600 py-1 text-left px-1">
              ✕ Clear all
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// ── Stat Card ────────────────────────────────────────────────────────────────
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

// ── Page ─────────────────────────────────────────────────────────────────────
export default function TeachersPage() {
  const [teachers,      setTeachers]      = useState<Teacher[]>([]);
  const [subjects,      setSubjects]      = useState<SubjectRecord[]>([]);
  const [classes,       setClasses]       = useState<ClassRecord[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [deleteTarget,  setDeleteTarget]  = useState<Teacher | null>(null);
  const [deleting,      setDeleting]      = useState(false);
  const [addModalOpen,  setAddModalOpen]  = useState(false);
  const [addForm,       setAddForm]       = useState<AddForm>(EMPTY_FORM);
  const [adding,        setAdding]        = useState(false);

  // ── Fetch lookup data ────────────────────────────────────────────────────
  useEffect(() => {
    supabase
      .from("subject")
      .select("id, name, code")
      .eq("is_active", true)
      .order("name", { ascending: true })
      .then(({ data }) => { if (data) setSubjects(data); });

    supabase
      .from("class")
      .select("id, class")
      .order("class", { ascending: true })
      .then(({ data }) => { if (data) setClasses(data); });
  }, []);

  // ── Fetch teachers ───────────────────────────────────────────────────────
  const fetchTeachers = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("teachers")
      .select(`
        id, name, email, phone, dob,
        is_active, is_registered, force_password_reset,
        last_login, created_at,
        teacher_subjects ( subject ( id, name, code ) ),
        teacher_classes  ( class   ( id, class ) )
      `)
      .order("created_at", { ascending: false });

    if (search)
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) toast.error("Failed to load teachers");
    else {
      let result = (data as unknown as Teacher[]) ?? [];

      // Client-side subject filter
      if (subjectFilter !== "all") {
        result = result.filter((t) =>
          t.teacher_subjects?.some((ts) => ts.subject?.id === subjectFilter)
        );
      }

      setTeachers(result);
    }
    setLoading(false);
  }, [search, subjectFilter]);

  useEffect(() => { fetchTeachers(); }, [fetchTeachers]);

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("teachers").delete().eq("id", deleteTarget.id);
    if (error) toast.error("Failed to delete teacher");
    else { toast.success(`${deleteTarget.name} removed successfully`); fetchTeachers(); }
    setDeleting(false);
    setDeleteTarget(null);
  };

  // ── Add ──────────────────────────────────────────────────────────────────
  const handleAddTeacher = async () => {
    if (!addForm.name || !addForm.email) {
      toast.error("Name and email are required");
      return;
    }
    setAdding(true);

    // 1. Insert teacher
    const { data: inserted, error: teacherError } = await supabase
      .from("teachers")
      .insert({
        name:                 addForm.name,
        email:                addForm.email,
        phone:                addForm.phone || null,
        dob:                  addForm.dob   || null,
        is_registered:        true,
        is_active:            true,
        force_password_reset: true,
      })
      .select("id")
      .single();

    if (teacherError) { toast.error(teacherError.message); setAdding(false); return; }

    // 2. Insert teacher_subjects junction rows
    if (addForm.subject_ids.length > 0) {
      const { error } = await supabase.from("teacher_subjects").insert(
        addForm.subject_ids.map((subject_id) => ({ teacher_id: inserted.id, subject_id }))
      );
      if (error) toast.error(`Teacher added but subjects failed: ${error.message}`);
    }

    // 3. Insert teacher_classes junction rows
    if (addForm.class_ids.length > 0) {
      const { error } = await supabase.from("teacher_classes").insert(
        addForm.class_ids.map((class_id) => ({ teacher_id: inserted.id, class_id }))
      );
      if (error) toast.error(`Teacher added but classes failed: ${error.message}`);
    }

    toast.success(`Teacher added! Credentials sent to ${addForm.email}`);
    setAddModalOpen(false);
    setAddForm(EMPTY_FORM);
    fetchTeachers();
    setAdding(false);
  };

  // ── Stats ────────────────────────────────────────────────────────────────
  const totalTeachers = teachers.length;
  const activeCount   = teachers.filter((t) => t.is_active).length;
  const pendingCount  = teachers.filter((t) => t.force_password_reset).length;
  const inactiveCount = teachers.filter((t) => !t.is_active).length;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Teachers" value={totalTeachers} />
        <StatCard label="Active"         value={activeCount}   valueClass="text-success-600" />
        <StatCard label="Pending Reset"  value={pendingCount}  valueClass="text-warning-600" />
        <StatCard label="Inactive"       value={inactiveCount} valueClass="text-danger-600"  />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm pointer-events-none">⌕</span>
          <Input className="pl-8" placeholder="Search by name or email…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.code ? `${s.code} – ${s.name}` : s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={() => setAddModalOpen(true)}>+ Add Teacher</Button>
        <Button variant="outline" onClick={fetchTeachers}>↺ Refresh</Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="px-5 py-3.5 border-b border-neutral-100 flex-row items-center gap-3 space-y-0">
          <span className="text-[13px] font-bold text-neutral-900">Teacher Records</span>
          <span className="font-mono text-[11px] bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full">
            {teachers.length} total
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
                    {["#", "Teacher", "Email", "Subjects", "Classes", "Phone", "Status", "Last Login", "Actions"].map((h) => (
                      <TableHead key={h} className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500 whitespace-nowrap">
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {teachers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9}>
                        <div className="py-14 text-center">
                          <p className="text-3xl opacity-30 mb-2">◈</p>
                          <p className="text-[13px] text-neutral-500">
                            No teachers found. Try adjusting filters or add a new teacher.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    teachers.map((t, i) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono text-[11px] text-neutral-400">
                          {String(i + 1).padStart(2, "0")}
                        </TableCell>
                        <TableCell className="font-semibold text-neutral-900">{t.name}</TableCell>
                        <TableCell className="text-neutral-500 text-xs">{t.email}</TableCell>

                        {/* ── Subjects cell ── */}
                        <TableCell>
                          {t.teacher_subjects && t.teacher_subjects.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {t.teacher_subjects.map(({ subject: subj }) => (
                                <span key={subj.id}
                                  className="text-[10px] font-semibold bg-neutral-100 text-neutral-700 border border-neutral-200 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                                  {subj.code ? `${subj.code} – ${subj.name}` : subj.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-neutral-300">—</span>
                          )}
                        </TableCell>

                        {/* ── Classes cell ── */}
                        <TableCell>
                          {t.teacher_classes && t.teacher_classes.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {t.teacher_classes.map(({ class: cls }) => (
                                <span key={cls.id}
                                  className="text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                                  {cls.class}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-neutral-300">—</span>
                          )}
                        </TableCell>

                        <TableCell className="text-neutral-500 text-xs">{t.phone ?? "—"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={t.is_active ? "default" : "destructive"}
                            className={
                              t.is_active
                                ? "bg-success-100 text-success-700 border border-success-500/20 hover:bg-success-100 font-mono text-[10px] tracking-wide"
                                : "bg-danger-100 text-danger-700 border border-danger-500/20 hover:bg-danger-100 font-mono text-[10px] tracking-wide"
                            }
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current mr-1 shrink-0" />
                            {t.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-neutral-500 whitespace-nowrap">
                          {formatDate(t.last_login)}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm"
                            className="text-[11px] font-semibold text-danger-600 bg-danger-100 border border-danger-500/15 hover:bg-danger-500 hover:text-white h-auto py-1 px-2.5"
                            onClick={() => setDeleteTarget(t)}>
                            ✕ Delete
                          </Button>
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

      {/* Delete dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="w-11 h-11 rounded-xl bg-danger-100 border border-danger-500/20 grid place-items-center text-xl mb-1">⚠</div>
            <AlertDialogTitle>Delete Teacher?</AlertDialogTitle>
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
              {deleting ? "Deleting…" : "Delete Teacher"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add teacher modal */}
      <Dialog open={addModalOpen} onOpenChange={(open) => { if (!open) setAddModalOpen(false); }}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle>Add New Teacher</DialogTitle>
          </DialogHeader>

          <div className="font-mono text-[11px] text-neutral-500 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2.5 leading-relaxed">
            ◈ System will auto-generate a temporary password and{" "}
            <span className="text-edu-600 font-semibold">email credentials</span>{" "}
            to the teacher. They&apos;ll be forced to change password on first login.
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">Full Name *</Label>
              <Input placeholder="Jane Smith" value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} />
            </div>

            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">Email Address *</Label>
              <Input type="email" placeholder="teacher@email.com" value={addForm.email}
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

            {/* Subjects multi-picker */}
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">
                Assigned Subjects
                {addForm.subject_ids.length > 0 && (
                  <span className="ml-2 normal-case font-normal text-neutral-400">
                    ({addForm.subject_ids.length} selected)
                  </span>
                )}
              </Label>
              <SubjectMultiPicker
                subjects={subjects}
                selected={addForm.subject_ids}
                onChange={(ids) => setAddForm({ ...addForm, subject_ids: ids })}
                placeholder="Select subjects…"
              />
              {addForm.subject_ids.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {addForm.subject_ids.map((id) => {
                    const subj = subjects.find((s) => s.id === id);
                    return subj ? (
                      <span key={id}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold bg-neutral-100 text-neutral-700 border border-neutral-200 px-2 py-0.5 rounded-full">
                        {subj.code ? `${subj.code} – ${subj.name}` : subj.name}
                        <button type="button"
                          onClick={() => setAddForm({ ...addForm, subject_ids: addForm.subject_ids.filter((x) => x !== id) })}
                          className="hover:text-danger-600 leading-none">✕</button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            {/* Classes multi-picker */}
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">
                Assigned Classes
                {addForm.class_ids.length > 0 && (
                  <span className="ml-2 normal-case font-normal text-neutral-400">
                    ({addForm.class_ids.length} selected)
                  </span>
                )}
              </Label>
              <ClassMultiPicker
                classes={classes}
                selected={addForm.class_ids}
                onChange={(ids) => setAddForm({ ...addForm, class_ids: ids })}
                placeholder="Select classes…"
              />
              {addForm.class_ids.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {addForm.class_ids.map((id) => {
                    const cls = classes.find((c) => c.id === id);
                    return cls ? (
                      <span key={id}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                        {cls.class}
                        <button type="button"
                          onClick={() => setAddForm({ ...addForm, class_ids: addForm.class_ids.filter((x) => x !== id) })}
                          className="hover:text-danger-600 leading-none">✕</button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-1">
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddTeacher} disabled={adding}>
              {adding ? "Adding…" : "Add Teacher & Send Email"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}