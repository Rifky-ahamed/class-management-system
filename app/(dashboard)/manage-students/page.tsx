"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";

// shadcn/ui components
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Badge }    from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

// ── Supabase client ──────────────────────────────────────────────────────────
// NOTE: Move this to lib/supabase/client.ts and import from there
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Types ────────────────────────────────────────────────────────────────────
type Student = {
  id: string;
  student_code: string;
  name: string;
  email: string;
  phone: string | null;
  dob: string | null;
  is_active: boolean;
  is_registered: boolean;
  force_password_reset: boolean;
  last_login: string | null;
  created_at: string;
  class: { id: number; class: string; year: number } | null;
};

type ClassRecord = { id: number; class: string; year: number };

type AddForm = {
  name: string;
  email: string;
  student_code: string;
  phone: string;
  dob: string;
  class_id: string;
};

const EMPTY_FORM: AddForm = {
  name: "", email: "", student_code: "", phone: "", dob: "", class_id: "",
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: number;
  valueClass?: string;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="px-5 pt-5 pb-4">
        <p className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500 mb-2">
          {label}
        </p>
        <p
          className={[
            "text-[30px] font-black leading-none tracking-tight",
            valueClass ?? "text-neutral-900",
          ].join(" ")}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function StudentsPage() {
  const [students,     setStudents]     = useState<Student[]>([]);
  const [classes,      setClasses]      = useState<ClassRecord[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [classFilter,  setClassFilter]  = useState("all");
  const [yearFilter,   setYearFilter]   = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [deleting,     setDeleting]     = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm,      setAddForm]      = useState<AddForm>(EMPTY_FORM);
  const [adding,       setAdding]       = useState(false);

  // ── Fetch classes ────────────────────────────────────────────────────────
  useEffect(() => {
    supabase
      .from("class")
      .select("id, class, year")
      .then(({ data }) => { if (data) setClasses(data); });
  }, []);

  // ── Fetch students ───────────────────────────────────────────────────────
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("student")
      .select(`
        id, student_code, name, email, phone, dob,
        is_active, is_registered, force_password_reset,
        last_login, created_at,
        class:class_id ( id, class, year )
      `)
      .order("created_at", { ascending: false });

    if (search)
      query = query.or(
        `name.ilike.%${search}%,student_code.ilike.%${search}%,email.ilike.%${search}%`
      );
    if (classFilter && classFilter !== "all")
      query = query.eq("class.class", classFilter);
    if (yearFilter)
      query = query.eq("class.year", parseInt(yearFilter));

    const { data, error } = await query;
    if (error) toast.error("Failed to load students");
    else setStudents((data as unknown as Student[]) ?? []);
    setLoading(false);
  }, [search, classFilter, yearFilter]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase
      .from("student")
      .delete()
      .eq("student_code", deleteTarget.student_code);
    if (error) {
      toast.error("Failed to delete student");
    } else {
      toast.success(`${deleteTarget.name} removed successfully`);
      fetchStudents();
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  // ── Add ──────────────────────────────────────────────────────────────────
  const handleAddStudent = async () => {
    if (!addForm.name || !addForm.email || !addForm.student_code) {
      toast.error("Name, email, and student code are required");
      return;
    }
    setAdding(true);
    const { error } = await supabase.from("student").insert({
      student_code:         addForm.student_code,
      name:                 addForm.name,
      email:                addForm.email,
      phone:                addForm.phone  || null,
      dob:                  addForm.dob    || null,
      class_id:             addForm.class_id ? parseInt(addForm.class_id) : null,
      is_registered:        true,
      is_active:            true,
      force_password_reset: true,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Student added! Credentials sent to ${addForm.email}`);
      setAddModalOpen(false);
      setAddForm(EMPTY_FORM);
      fetchStudents();
    }
    setAdding(false);
  };

  const uniqueClasses = [...new Set(classes.map((c) => c.class))];

  // ── Stats ────────────────────────────────────────────────────────────────
  const totalStudents  = students.length;
  const activeCount    = students.filter((s) => s.is_active).length;
  const pendingCount   = students.filter((s) => s.force_password_reset).length;
  const inactiveCount  = students.filter((s) => !s.is_active).length;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Students" value={totalStudents} />
        <StatCard label="Active"         value={activeCount}   valueClass="text-success-600" />
        <StatCard label="Pending Reset"  value={pendingCount}  valueClass="text-warning-600" />
        <StatCard label="Inactive"       value={inactiveCount} valueClass="text-danger-600"  />
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2.5 flex-wrap">

        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm pointer-events-none">
            ⌕
          </span>
          <Input
            className="pl-8"
            placeholder="Search by name, code, or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Class filter */}
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {uniqueClasses.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Year filter */}
        <Input
          type="number"
          className="w-[90px]"
          placeholder="Year"
          min={2020}
          max={2099}
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
        />

        <Button onClick={() => setAddModalOpen(true)}>
          + Add Student
        </Button>

        <Button variant="outline" onClick={fetchStudents}>
          ↺ Refresh
        </Button>
      </div>

      {/* ── Table card ── */}
      <Card>
        <CardHeader className="px-5 py-3.5 border-b border-neutral-100 flex-row items-center gap-3 space-y-0">
          <span className="text-[13px] font-bold text-neutral-900">
            Student Records
          </span>
          <span className="font-mono text-[11px] bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full">
            {students.length} total
          </span>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col gap-2.5 p-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-11 w-full rounded-lg"
                  style={{ opacity: 1 - i * 0.15 }}
                />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                    {["#","Student","Code","Email","Class","Phone","Status","Last Login","Actions"].map((h) => (
                      <TableHead
                        key={h}
                        className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500 whitespace-nowrap"
                      >
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {students.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9}>
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

                        {/* # */}
                        <TableCell className="font-mono text-[11px] text-neutral-400">
                          {String(i + 1).padStart(2, "0")}
                        </TableCell>

                        {/* Name */}
                        <TableCell className="font-semibold text-neutral-900">
                          {s.name}
                        </TableCell>

                        {/* Code */}
                        <TableCell>
                          <span className="font-mono text-[11px] text-edu-600 bg-edu-100 px-2 py-0.5 rounded">
                            {s.student_code}
                          </span>
                        </TableCell>

                        {/* Email */}
                        <TableCell className="text-neutral-500 text-xs">
                          {s.email}
                        </TableCell>

                        {/* Class */}
                        <TableCell>
                          {s.class ? (
                            <span className="text-xs font-semibold bg-neutral-100 text-neutral-700 border border-neutral-200 px-2.5 py-1 rounded-full whitespace-nowrap">
                              {s.class.class} · {s.class.year}
                            </span>
                          ) : (
                            <span className="text-neutral-300">—</span>
                          )}
                        </TableCell>

                        {/* Phone */}
                        <TableCell className="text-neutral-500 text-xs">
                          {s.phone ?? "—"}
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Badge
                            variant={s.is_active ? "default" : "destructive"}
                            className={
                              s.is_active
                                ? "bg-success-100 text-success-700 border border-success-500/20 hover:bg-success-100 font-mono text-[10px] tracking-wide"
                                : "bg-danger-100 text-danger-700 border border-danger-500/20 hover:bg-danger-100 font-mono text-[10px] tracking-wide"
                            }
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-current mr-1 shrink-0"
                            />
                            {s.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>

                        {/* Last Login */}
                        <TableCell className="font-mono text-[11px] text-neutral-500 whitespace-nowrap">
                          {formatDate(s.last_login)}
                        </TableCell>

                        {/* Actions */}
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[11px] font-semibold text-danger-600 bg-danger-100 border border-danger-500/15 hover:bg-danger-500 hover:text-white h-auto py-1 px-2.5"
                            onClick={() => setDeleteTarget(s)}
                          >
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

      {/* ── Delete confirmation ── */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            {/* Warning icon */}
            <div className="w-11 h-11 rounded-xl bg-danger-100 border border-danger-500/20 grid place-items-center text-xl mb-1">
              ⚠
            </div>
            <AlertDialogTitle>Delete Student?</AlertDialogTitle>
            <AlertDialogDescription>
              You&apos;re about to permanently remove{" "}
              <strong className="text-foreground">{deleteTarget?.name}</strong>{" "}
              ({deleteTarget?.student_code}). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger-500 hover:bg-danger-600 text-white"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete Student"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Add student modal ── */}
      <Dialog
        open={addModalOpen}
        onOpenChange={(open) => { if (!open) setAddModalOpen(false); }}
      >
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
          </DialogHeader>

          {/* Info hint */}
          <div className="font-mono text-[11px] text-neutral-500 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2.5 leading-relaxed">
            ◈ System will auto-generate a temporary password and{" "}
            <span className="text-edu-600 font-semibold">email credentials</span>{" "}
            to the student. They&apos;ll be forced to change password on first login.
          </div>

          {/* Form */}
          <div className="space-y-4">

            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">
                  Full Name *
                </Label>
                <Input
                  placeholder="John Doe"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">
                  Student Code *
                </Label>
                <Input
                  placeholder="STU001"
                  value={addForm.student_code}
                  onChange={(e) => setAddForm({ ...addForm, student_code: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">
                Email Address *
              </Label>
              <Input
                type="email"
                placeholder="student@email.com"
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">
                  Phone
                </Label>
                <Input
                  placeholder="+94 77 123 4567"
                  value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">
                  Date of Birth
                </Label>
                <Input
                  type="date"
                  value={addForm.dob}
                  onChange={(e) => setAddForm({ ...addForm, dob: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">
                Class
              </Label>
              <Select
                value={addForm.class_id}
                onValueChange={(val) => setAddForm({ ...addForm, class_id: val })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.class} · {c.year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          </div>

          {/* Footer actions */}
          <div className="flex justify-end gap-2.5 pt-1">
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddStudent} disabled={adding}>
              {adding ? "Adding…" : "Add Student & Send Email"}
            </Button>
          </div>

        </DialogContent>
      </Dialog>

    </div>
  );
}
