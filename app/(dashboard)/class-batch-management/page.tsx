"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// ── Types ────────────────────────────────────────────────────────────────────
type ClassRecord = {
  id: string;
  class: string;
  description: string | null;
  max_students: number | null;
  is_active: boolean;
  created_at: string;
  student_count: number;
  batch_count: number;
};

type BatchRecord = {
  id: string;
  name: string;
  class_id: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  max_students: number | null;
  is_active: boolean;
  created_at: string;
  class: { id: string; class: string } | null;
};

type SubjectRecord = {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
};

type ClassForm = {
  class: string;
  description: string;
  max_students: string;
  is_active: boolean;
};

type BatchForm = {
  name: string;
  class_id: string;
  subject_id: string;
  description: string;
  start_date: string;
  end_date: string;
  max_students: string;
};

type SubjectForm = {
  name: string;
  code: string;
  description: string;
  is_active: boolean;
};

const EMPTY_CLASS_FORM: ClassForm = {
  class: "",
  description: "",
  max_students: "",
  is_active: true,
};

const EMPTY_BATCH_FORM: BatchForm = {
  name: "",
  class_id: "",
  subject_id: "",
  description: "",
  start_date: "",
  end_date: "",
  max_students: "30",
};

const EMPTY_SUBJECT_FORM: SubjectForm = {
  name: "",
  code: "",
  description: "",
  is_active: true,
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
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

// ── Toggle Switch ─────────────────────────────────────────────────────────────
function ToggleSwitch({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint: string;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
      <div>
        <p className="text-[13px] font-semibold text-neutral-800">{label}</p>
        <p className="text-[11px] text-neutral-500">{hint}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={[
          "relative rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-400",
          checked ? "bg-success-500" : "bg-neutral-300",
        ].join(" ")}
        style={{ width: 40, height: 22, flexShrink: 0 }}
      >
        <span
          className={[
            "absolute top-[3px] w-4 h-4 bg-white rounded-full shadow transition-transform duration-200",
            checked ? "translate-x-[19px]" : "translate-x-[3px]",
          ].join(" ")}
        />
      </button>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function ClassBatchSubjectPage() {
  // ── Classes state ────────────────────────────────────────────────────────
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [classSearch, setClassSearch] = useState("");
  const [classLoading, setClassLoading] = useState(true);
  const [deleteClassTarget, setDeleteClassTarget] =
    useState<ClassRecord | null>(null);
  const [deletingClass, setDeletingClass] = useState(false);
  const [addClassOpen, setAddClassOpen] = useState(false);
  const [editClassTarget, setEditClassTarget] = useState<ClassRecord | null>(
    null,
  );
  const [classForm, setClassForm] = useState<ClassForm>(EMPTY_CLASS_FORM);
  const [addingClass, setAddingClass] = useState(false);
  const [editingClass, setEditingClass] = useState(false);

  // ── Batches state ────────────────────────────────────────────────────────
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [batchSearch, setBatchSearch] = useState("");
  const [batchClassFilter, setBatchClassFilter] = useState("all");
  const [batchLoading, setBatchLoading] = useState(true);
  const [deleteBatchTarget, setDeleteBatchTarget] =
    useState<BatchRecord | null>(null);
  const [deletingBatch, setDeletingBatch] = useState(false);
  const [addBatchOpen, setAddBatchOpen] = useState(false);
  const [batchForm, setBatchForm] = useState<BatchForm>(EMPTY_BATCH_FORM);
  const [addingBatch, setAddingBatch] = useState(false);
  const [batchSubjects, setBatchSubjects] = useState<SubjectRecord[]>([]);
const [batchClasses,  setBatchClasses]  = useState<ClassRecord[]>([]);
const [loadingBatchOptions, setLoadingBatchOptions] = useState(false);

  // ── Subjects state ───────────────────────────────────────────────────────
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [subjectSearch, setSubjectSearch] = useState("");
  const [subjectLoading, setSubjectLoading] = useState(true);
  const [deleteSubjectTarget, setDeleteSubjectTarget] =
    useState<SubjectRecord | null>(null);
  const [deletingSubject, setDeletingSubject] = useState(false);
  const [addSubjectOpen, setAddSubjectOpen] = useState(false);
  const [editSubjectTarget, setEditSubjectTarget] =
    useState<SubjectRecord | null>(null);
  const [subjectForm, setSubjectForm] =
    useState<SubjectForm>(EMPTY_SUBJECT_FORM);
  const [addingSubject, setAddingSubject] = useState(false);
  const [editingSubject, setEditingSubject] = useState(false);

  // ── Fetch classes ────────────────────────────────────────────────────────
  const fetchClasses = useCallback(async () => {
    setClassLoading(true);

    let query = supabase
      .from("class")
      .select("id, class, description, max_students, is_active, created_at")
      .order("created_at", { ascending: false });

    if (classSearch) query = query.ilike("class", `%${classSearch}%`);

    const { data: classData, error } = await query;
    if (error) {
      toast.error("Failed to load classes");
      setClassLoading(false);
      return;
    }

    const { data: studentRows } = await supabase
      .from("student")
      .select("class_id")
      .not("class_id", "is", null);

    const { data: batchRows } = await supabase.from("batch").select("class_id");

    const studentCountMap: Record<string, number> = {};
    studentRows?.forEach((s) => {
      if (s.class_id)
        studentCountMap[s.class_id] = (studentCountMap[s.class_id] ?? 0) + 1;
    });

    const batchCountMap: Record<string, number> = {};
    batchRows?.forEach((b) => {
      if (b.class_id)
        batchCountMap[b.class_id] = (batchCountMap[b.class_id] ?? 0) + 1;
    });

    const enriched: ClassRecord[] = (classData ?? []).map((c) => ({
      ...c,
      student_count: studentCountMap[c.id] ?? 0,
      batch_count: batchCountMap[c.id] ?? 0,
    }));

    setClasses(enriched);
    setClassLoading(false);
  }, [classSearch]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  // ── Fetch batches ────────────────────────────────────────────────────────
  const fetchBatches = useCallback(async () => {
    setBatchLoading(true);

    let query = supabase
      .from("batch")
      .select(
        `
        id, name, class_id, description,
        start_date, end_date, max_students,
        is_active, created_at,
        class:class_id ( id, class )
      `,
      )
      .order("created_at", { ascending: false });

    if (batchSearch) query = query.ilike("name", `%${batchSearch}%`);
    if (batchClassFilter !== "all")
      query = query.eq("class_id", batchClassFilter);

    const { data, error } = await query;
    if (error) toast.error("Failed to load batches");
    else setBatches((data as unknown as BatchRecord[]) ?? []);
    setBatchLoading(false);
  }, [batchSearch, batchClassFilter]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  // ── Fetch subjects ───────────────────────────────────────────────────────
  const fetchSubjects = useCallback(async () => {
    setSubjectLoading(true);

    let query = supabase
      .from("subject")
      .select("id, name, code, description, is_active, created_at")
      .order("created_at", { ascending: false });

    if (subjectSearch)
      query = query.or(
        `name.ilike.%${subjectSearch}%,code.ilike.%${subjectSearch}%`,
      );

    const { data, error } = await query;
    if (error) toast.error("Failed to load subjects");
    else setSubjects((data as SubjectRecord[]) ?? []);
    setSubjectLoading(false);
  }, [subjectSearch]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  // ── Fetch classes & subjects that are assigned to teachers ───────────────
const fetchBatchOptions = useCallback(async () => {
  setLoadingBatchOptions(true);

  // Get all class_ids that appear in teacher_classes
  const { data: tcRows } = await supabase
    .from("teacher_classes")
    .select("class_id");

  // Get all subject_ids that appear in teachers
  const { data: teacherRows } = await supabase
    .from("teachers")
    .select("subject_id")
    .not("subject_id", "is", null);

  const assignedClassIds   = [...new Set((tcRows ?? []).map((r) => r.class_id))];
  const assignedSubjectIds = [...new Set((teacherRows ?? []).map((r) => r.subject_id).filter(Boolean))];

  if (assignedClassIds.length > 0) {
    const { data } = await supabase
      .from("class")
      .select("id, class, description, max_students, is_active, created_at")
      .in("id", assignedClassIds)
      .eq("is_active", true)
      .order("class", { ascending: true });
    setBatchClasses(
      (data ?? []).map((c) => ({ ...c, student_count: 0, batch_count: 0 }))
    );
  } else {
    setBatchClasses([]);
  }

  if (assignedSubjectIds.length > 0) {
    const { data } = await supabase
      .from("subject")
      .select("id, name, code, description, is_active, created_at")
      .in("id", assignedSubjectIds as string[])
      .eq("is_active", true)
      .order("name", { ascending: true });
    setBatchSubjects((data as SubjectRecord[]) ?? []);
  } else {
    setBatchSubjects([]);
  }

  setLoadingBatchOptions(false);
}, []);

useEffect(() => { fetchBatchOptions(); }, [fetchBatchOptions]);

  // ── Add class ────────────────────────────────────────────────────────────
  const handleAddClass = async () => {
    if (!classForm.class.trim()) {
      toast.error("Class name is required");
      return;
    }
    setAddingClass(true);
    const { error } = await supabase.from("class").insert({
      class: classForm.class.trim(),
      description: classForm.description || null,
      max_students: classForm.max_students
        ? parseInt(classForm.max_students)
        : null,
      is_active: classForm.is_active,
    });
    if (error) toast.error(error.message);
    else {
      toast.success(`Class "${classForm.class}" created successfully`);
      setAddClassOpen(false);
      setClassForm(EMPTY_CLASS_FORM);
      fetchClasses();
    }
    setAddingClass(false);
  };

  const openEditClass = (c: ClassRecord) => {
    setEditClassTarget(c);
    setClassForm({
      class: c.class,
      description: c.description ?? "",
      max_students: c.max_students?.toString() ?? "",
      is_active: c.is_active,
    });
  };

  const handleEditClass = async () => {
    if (!editClassTarget || !classForm.class.trim()) return;
    setEditingClass(true);
    const { error } = await supabase
      .from("class")
      .update({
        class: classForm.class.trim(),
        description: classForm.description || null,
        max_students: classForm.max_students
          ? parseInt(classForm.max_students)
          : null,
        is_active: classForm.is_active,
      })
      .eq("id", editClassTarget.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Class updated successfully");
      setEditClassTarget(null);
      setClassForm(EMPTY_CLASS_FORM);
      fetchClasses();
    }
    setEditingClass(false);
  };

  const handleDeleteClass = async () => {
    if (!deleteClassTarget) return;
    setDeletingClass(true);
    const { error } = await supabase
      .from("class")
      .delete()
      .eq("id", deleteClassTarget.id);
    if (error) toast.error("Failed to delete class");
    else {
      toast.success(`Class "${deleteClassTarget.class}" deleted`);
      fetchClasses();
      fetchBatches();
    }
    setDeletingClass(false);
    setDeleteClassTarget(null);
  };

  // ── Add batch ────────────────────────────────────────────────────────────
const handleAddBatch = async () => {
  if (!batchForm.name.trim() || !batchForm.class_id) {
    toast.error("Batch name and class are required");
    return;
  }
  setAddingBatch(true);
  const { error } = await supabase.from("batch").insert({
    name:         batchForm.name.trim(),
    class_id:     batchForm.class_id,
    subject_id:   batchForm.subject_id || null,   // ← add this
    description:  batchForm.description || null,
    start_date:   batchForm.start_date  || null,
    end_date:     batchForm.end_date    || null,
    max_students: batchForm.max_students ? parseInt(batchForm.max_students) : null,
  });
  if (error) toast.error(error.message);
  else {
    toast.success(`Batch "${batchForm.name}" created successfully`);
    setAddBatchOpen(false);
    setBatchForm(EMPTY_BATCH_FORM);
    fetchBatches();
    fetchClasses();
  }
  setAddingBatch(false);
};

  const handleDeleteBatch = async () => {
    if (!deleteBatchTarget) return;
    setDeletingBatch(true);
    const { error } = await supabase
      .from("batch")
      .delete()
      .eq("id", deleteBatchTarget.id);
    if (error) toast.error("Failed to delete batch");
    else {
      toast.success(`Batch "${deleteBatchTarget.name}" deleted`);
      fetchBatches();
      fetchClasses();
    }
    setDeletingBatch(false);
    setDeleteBatchTarget(null);
  };

  // ── Add subject ──────────────────────────────────────────────────────────
  const handleAddSubject = async () => {
    if (!subjectForm.name.trim()) {
      toast.error("Subject name is required");
      return;
    }
    setAddingSubject(true);
    const { error } = await supabase.from("subject").insert({
      name: subjectForm.name.trim(),
      code: subjectForm.code.trim() || null,
      description: subjectForm.description.trim() || null,
      is_active: subjectForm.is_active,
    });
    if (error) toast.error(error.message);
    else {
      toast.success(`Subject "${subjectForm.name}" created successfully`);
      setAddSubjectOpen(false);
      setSubjectForm(EMPTY_SUBJECT_FORM);
      fetchSubjects();
    }
    setAddingSubject(false);
  };

  const openEditSubject = (s: SubjectRecord) => {
    setEditSubjectTarget(s);
    setSubjectForm({
      name: s.name,
      code: s.code ?? "",
      description: s.description ?? "",
      is_active: s.is_active,
    });
  };

  const handleEditSubject = async () => {
    if (!editSubjectTarget || !subjectForm.name.trim()) return;
    setEditingSubject(true);
    const { error } = await supabase
      .from("subject")
      .update({
        name: subjectForm.name.trim(),
        code: subjectForm.code.trim() || null,
        description: subjectForm.description.trim() || null,
        is_active: subjectForm.is_active,
      })
      .eq("id", editSubjectTarget.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Subject updated successfully");
      setEditSubjectTarget(null);
      setSubjectForm(EMPTY_SUBJECT_FORM);
      fetchSubjects();
    }
    setEditingSubject(false);
  };

  const handleDeleteSubject = async () => {
    if (!deleteSubjectTarget) return;
    setDeletingSubject(true);
    const { error } = await supabase
      .from("subject")
      .delete()
      .eq("id", deleteSubjectTarget.id);
    if (error) toast.error("Failed to delete subject");
    else {
      toast.success(`Subject "${deleteSubjectTarget.name}" deleted`);
      fetchSubjects();
    }
    setDeletingSubject(false);
    setDeleteSubjectTarget(null);
  };

  // ── Stats ────────────────────────────────────────────────────────────────
  const totalClasses = classes.length;
  const activeClasses = classes.filter((c) => c.is_active).length;
  const totalBatches = batches.length;
  const totalSubjects = subjects.length;
  const activeSubjects = subjects.filter((s) => s.is_active).length;
  const totalEnrolled = classes.reduce((sum, c) => sum + c.student_count, 0);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Classes" value={totalClasses} />
        <StatCard
          label="Active Classes"
          value={activeClasses}
          valueClass="text-success-600"
        />
        <StatCard
          label="Total Batches"
          value={totalBatches}
          valueClass="text-edu-600"
        />
        <StatCard
          label="Total Subjects"
          value={totalSubjects}
          valueClass="text-neutral-700"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="classes" className="space-y-4">
        <TabsList className="bg-neutral-100 p-1 rounded-lg h-auto">
          <TabsTrigger
            value="classes"
            className="font-mono text-[11px] tracking-[1.5px] uppercase px-5 py-2
                       data-[state=active]:bg-white data-[state=active]:shadow-sm
                       data-[state=active]:text-neutral-900 text-neutral-500"
          >
            Classes
          </TabsTrigger>

          <TabsTrigger
            value="subjects"
            className="font-mono text-[11px] tracking-[1.5px] uppercase px-5 py-2
                       data-[state=active]:bg-white data-[state=active]:shadow-sm
                       data-[state=active]:text-neutral-900 text-neutral-500"
          >
            Subjects
          </TabsTrigger>
          <TabsTrigger
            value="batches"
            className="font-mono text-[11px] tracking-[1.5px] uppercase px-5 py-2
                       data-[state=active]:bg-white data-[state=active]:shadow-sm
                       data-[state=active]:text-neutral-900 text-neutral-500"
          >
            Batches
          </TabsTrigger>
        </TabsList>

        {/* ───────────── CLASSES TAB ───────────── */}
        <TabsContent value="classes" className="space-y-4 mt-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative flex-1 min-w-[220px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm pointer-events-none">
                ⌕
              </span>
              <Input
                className="pl-8"
                placeholder="Search classes…"
                value={classSearch}
                onChange={(e) => setClassSearch(e.target.value)}
              />
            </div>
            <Button onClick={() => setAddClassOpen(true)}>+ Add Class</Button>
            <Button variant="outline" onClick={fetchClasses}>
              ↺ Refresh
            </Button>
          </div>

          <Card>
            <CardHeader className="px-5 py-3.5 border-b border-neutral-100 flex-row items-center gap-3 space-y-0">
              <span className="text-[13px] font-bold text-neutral-900">
                Class Records
              </span>
              <span className="font-mono text-[11px] bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full">
                {classes.length} total
              </span>
            </CardHeader>
            <CardContent className="p-0">
              {classLoading ? (
                <div className="flex flex-col gap-2.5 p-5">
                  {Array.from({ length: 4 }).map((_, i) => (
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
                        {[
                          "#",
                          "Class Name",
                          "Description",
                          "Max Students",
                          "Enrolled",
                          "Batches",
                          "Status",
                          "Actions",
                        ].map((h) => (
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
                      {classes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8}>
                            <div className="py-14 text-center">
                              <p className="text-3xl opacity-30 mb-2">◈</p>
                              <p className="text-[13px] text-neutral-500">
                                No classes found. Add your first class to get
                                started.
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        classes.map((c, i) => (
                          <TableRow key={c.id}>
                            <TableCell className="font-mono text-[11px] text-neutral-400">
                              {String(i + 1).padStart(2, "0")}
                            </TableCell>
                            <TableCell className="font-semibold text-neutral-900">
                              {c.class}
                            </TableCell>
                            <TableCell className="text-neutral-500 text-xs max-w-[200px] truncate">
                              {c.description ?? "—"}
                            </TableCell>
                            <TableCell className="font-mono text-[12px] text-neutral-600">
                              {c.max_students ?? "—"}
                            </TableCell>
                            <TableCell>
                              <span className="font-mono text-[11px] font-semibold bg-edu-50 text-edu-700 border border-edu-200/70 px-2 py-0.5 rounded-full">
                                {c.student_count}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="font-mono text-[11px] font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200 px-2 py-0.5 rounded-full">
                                {c.batch_count}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  c.is_active
                                    ? "bg-success-100 text-success-700 border border-success-500/20 hover:bg-success-100 font-mono text-[10px] tracking-wide"
                                    : "bg-danger-100 text-danger-700 border border-danger-500/20 hover:bg-danger-100 font-mono text-[10px] tracking-wide"
                                }
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-current mr-1 shrink-0" />
                                {c.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-[11px] font-semibold text-edu-600 bg-edu-50 border border-edu-500/15 hover:bg-edu-500 hover:text-white h-auto py-1 px-2.5"
                                  onClick={() => openEditClass(c)}
                                >
                                  ✎ Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-[11px] font-semibold text-danger-600 bg-danger-100 border border-danger-500/15 hover:bg-danger-500 hover:text-white h-auto py-1 px-2.5"
                                  onClick={() => setDeleteClassTarget(c)}
                                >
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
        </TabsContent>

        {/* ───────────── BATCHES TAB ───────────── */}
        <TabsContent value="batches" className="space-y-4 mt-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative flex-1 min-w-[220px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm pointer-events-none">
                ⌕
              </span>
              <Input
                className="pl-8"
                placeholder="Search batches…"
                value={batchSearch}
                onChange={(e) => setBatchSearch(e.target.value)}
              />
            </div>
            <Select
              value={batchClassFilter}
              onValueChange={setBatchClassFilter}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.class}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setAddBatchOpen(true)}>+ Add Batch</Button>
            <Button variant="outline" onClick={fetchBatches}>
              ↺ Refresh
            </Button>
          </div>

          <Card>
            <CardHeader className="px-5 py-3.5 border-b border-neutral-100 flex-row items-center gap-3 space-y-0">
              <span className="text-[13px] font-bold text-neutral-900">
                Batch Records
              </span>
              <span className="font-mono text-[11px] bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full">
                {batches.length} total
              </span>
            </CardHeader>
            <CardContent className="p-0">
              {batchLoading ? (
                <div className="flex flex-col gap-2.5 p-5">
                  {Array.from({ length: 4 }).map((_, i) => (
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
                        {[
                          "#",
                          "Batch Name",
                          "Class",
                          "Start Date",
                          "End Date",
                          "Max Students",
                          "Status",
                          "Actions",
                        ].map((h) => (
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
                      {batches.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8}>
                            <div className="py-14 text-center">
                              <p className="text-3xl opacity-30 mb-2">◈</p>
                              <p className="text-[13px] text-neutral-500">
                                No batches found. Create your first batch.
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        batches.map((b, i) => (
                          <TableRow key={b.id}>
                            <TableCell className="font-mono text-[11px] text-neutral-400">
                              {String(i + 1).padStart(2, "0")}
                            </TableCell>
                            <TableCell className="font-semibold text-neutral-900">
                              {b.name}
                            </TableCell>
                            <TableCell>
                              {b.class ? (
                                <span className="text-xs font-semibold bg-neutral-100 text-neutral-700 border border-neutral-200 px-2.5 py-1 rounded-full whitespace-nowrap">
                                  {b.class.class}
                                </span>
                              ) : (
                                <span className="text-neutral-300">—</span>
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-[11px] text-neutral-500 whitespace-nowrap">
                              {formatDate(b.start_date)}
                            </TableCell>
                            <TableCell className="font-mono text-[11px] text-neutral-500 whitespace-nowrap">
                              {formatDate(b.end_date)}
                            </TableCell>
                            <TableCell className="font-mono text-[12px] text-neutral-600">
                              {b.max_students ?? "—"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  b.is_active
                                    ? "bg-success-100 text-success-700 border border-success-500/20 hover:bg-success-100 font-mono text-[10px] tracking-wide"
                                    : "bg-danger-100 text-danger-700 border border-danger-500/20 hover:bg-danger-100 font-mono text-[10px] tracking-wide"
                                }
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-current mr-1 shrink-0" />
                                {b.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-[11px] font-semibold text-danger-600 bg-danger-100 border border-danger-500/15 hover:bg-danger-500 hover:text-white h-auto py-1 px-2.5"
                                onClick={() => setDeleteBatchTarget(b)}
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
        </TabsContent>

        {/* ───────────── SUBJECTS TAB ───────────── */}
        <TabsContent value="subjects" className="space-y-4 mt-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative flex-1 min-w-[220px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm pointer-events-none">
                ⌕
              </span>
              <Input
                className="pl-8"
                placeholder="Search by name or code…"
                value={subjectSearch}
                onChange={(e) => setSubjectSearch(e.target.value)}
              />
            </div>
            <Button onClick={() => setAddSubjectOpen(true)}>
              + Add Subject
            </Button>
            <Button variant="outline" onClick={fetchSubjects}>
              ↺ Refresh
            </Button>
          </div>

          <Card>
            <CardHeader className="px-5 py-3.5 border-b border-neutral-100 flex-row items-center gap-3 space-y-0">
              <span className="text-[13px] font-bold text-neutral-900">
                Subject Records
              </span>
              <span className="font-mono text-[11px] bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full">
                {subjects.length} total
              </span>
              <span className="font-mono text-[11px] bg-success-100 text-success-700 px-2 py-0.5 rounded-full ml-auto">
                {activeSubjects} active
              </span>
            </CardHeader>
            <CardContent className="p-0">
              {subjectLoading ? (
                <div className="flex flex-col gap-2.5 p-5">
                  {Array.from({ length: 4 }).map((_, i) => (
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
                        {[
                          "#",
                          "Subject Name",
                          "Code",
                          "Description",
                          "Status",
                          "Created",
                          "Actions",
                        ].map((h) => (
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
                      {subjects.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7}>
                            <div className="py-14 text-center">
                              <p className="text-3xl opacity-30 mb-2">◈</p>
                              <p className="text-[13px] text-neutral-500">
                                No subjects found. Add your first subject to get
                                started.
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        subjects.map((s, i) => (
                          <TableRow key={s.id}>
                            <TableCell className="font-mono text-[11px] text-neutral-400">
                              {String(i + 1).padStart(2, "0")}
                            </TableCell>
                            <TableCell className="font-semibold text-neutral-900">
                              {s.name}
                            </TableCell>
                            <TableCell>
                              {s.code ? (
                                <span className="font-mono text-[11px] font-semibold bg-edu-50 text-edu-700 border border-edu-200/70 px-2 py-0.5 rounded-full tracking-wider">
                                  {s.code}
                                </span>
                              ) : (
                                <span className="text-neutral-300">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-neutral-500 text-xs max-w-[220px] truncate">
                              {s.description ?? "—"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  s.is_active
                                    ? "bg-success-100 text-success-700 border border-success-500/20 hover:bg-success-100 font-mono text-[10px] tracking-wide"
                                    : "bg-danger-100 text-danger-700 border border-danger-500/20 hover:bg-danger-100 font-mono text-[10px] tracking-wide"
                                }
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-current mr-1 shrink-0" />
                                {s.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-[11px] text-neutral-500 whitespace-nowrap">
                              {formatDate(s.created_at)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-[11px] font-semibold text-edu-600 bg-edu-50 border border-edu-500/15 hover:bg-edu-500 hover:text-white h-auto py-1 px-2.5"
                                  onClick={() => openEditSubject(s)}
                                >
                                  ✎ Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-[11px] font-semibold text-danger-600 bg-danger-100 border border-danger-500/15 hover:bg-danger-500 hover:text-white h-auto py-1 px-2.5"
                                  onClick={() => setDeleteSubjectTarget(s)}
                                >
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
        </TabsContent>
      </Tabs>

      {/* ── Delete Class Dialog ── */}
      <AlertDialog
        open={!!deleteClassTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteClassTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="w-11 h-11 rounded-xl bg-danger-100 border border-danger-500/20 grid place-items-center text-xl mb-1">
              ⚠
            </div>
            <AlertDialogTitle>Delete Class?</AlertDialogTitle>
            <AlertDialogDescription>
              You&apos;re about to permanently delete{" "}
              <strong className="text-foreground">
                {deleteClassTarget?.class}
              </strong>
              . All batches inside this class will also be deleted. Students
              will be unassigned. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger-500 hover:bg-danger-600 text-white"
              onClick={handleDeleteClass}
              disabled={deletingClass}
            >
              {deletingClass ? "Deleting…" : "Delete Class"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Delete Batch Dialog ── */}
      <AlertDialog
        open={!!deleteBatchTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteBatchTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="w-11 h-11 rounded-xl bg-danger-100 border border-danger-500/20 grid place-items-center text-xl mb-1">
              ⚠
            </div>
            <AlertDialogTitle>Delete Batch?</AlertDialogTitle>
            <AlertDialogDescription>
              You&apos;re about to permanently delete batch{" "}
              <strong className="text-foreground">
                {deleteBatchTarget?.name}
              </strong>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger-500 hover:bg-danger-600 text-white"
              onClick={handleDeleteBatch}
              disabled={deletingBatch}
            >
              {deletingBatch ? "Deleting…" : "Delete Batch"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Delete Subject Dialog ── */}
      <AlertDialog
        open={!!deleteSubjectTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteSubjectTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="w-11 h-11 rounded-xl bg-danger-100 border border-danger-500/20 grid place-items-center text-xl mb-1">
              ⚠
            </div>
            <AlertDialogTitle>Delete Subject?</AlertDialogTitle>
            <AlertDialogDescription>
              You&apos;re about to permanently delete{" "}
              <strong className="text-foreground">
                {deleteSubjectTarget?.name}
              </strong>
              . Any teacher assignments linked to this subject may be affected.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger-500 hover:bg-danger-600 text-white"
              onClick={handleDeleteSubject}
              disabled={deletingSubject}
            >
              {deletingSubject ? "Deleting…" : "Delete Subject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Add Class Modal ── */}
      <Dialog
        open={addClassOpen}
        onOpenChange={(open) => {
          if (!open) {
            setAddClassOpen(false);
            setClassForm(EMPTY_CLASS_FORM);
          }
        }}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Add New Class</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">
                Class Name *
              </Label>
              <Input
                placeholder="e.g. Grade 10, Physics A/L, Mathematics"
                value={classForm.class}
                onChange={(e) =>
                  setClassForm({ ...classForm, class: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">
                Description
              </Label>
              <Textarea
                placeholder="Brief description of this class…"
                rows={3}
                className="resize-none"
                value={classForm.description}
                onChange={(e) =>
                  setClassForm({ ...classForm, description: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">
                Max Students
              </Label>
              <Input
                type="number"
                min={1}
                placeholder="e.g. 40"
                value={classForm.max_students}
                onChange={(e) =>
                  setClassForm({ ...classForm, max_students: e.target.value })
                }
              />
            </div>
            <ToggleSwitch
              checked={classForm.is_active}
              onChange={(v) => setClassForm({ ...classForm, is_active: v })}
              label="Active Class"
              hint="Students can only be enrolled in active classes"
            />
          </div>
          <div className="flex justify-end gap-2.5 pt-1">
            <Button
              variant="outline"
              onClick={() => {
                setAddClassOpen(false);
                setClassForm(EMPTY_CLASS_FORM);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddClass} disabled={addingClass}>
              {addingClass ? "Creating…" : "Create Class"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit Class Modal ── */}
      <Dialog
        open={!!editClassTarget}
        onOpenChange={(open) => {
          if (!open) {
            setEditClassTarget(null);
            setClassForm(EMPTY_CLASS_FORM);
          }
        }}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">
                Class Name *
              </Label>
              <Input
                value={classForm.class}
                onChange={(e) =>
                  setClassForm({ ...classForm, class: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">
                Description
              </Label>
              <Textarea
                rows={3}
                className="resize-none"
                value={classForm.description}
                onChange={(e) =>
                  setClassForm({ ...classForm, description: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">
                Max Students
              </Label>
              <Input
                type="number"
                min={1}
                value={classForm.max_students}
                onChange={(e) =>
                  setClassForm({ ...classForm, max_students: e.target.value })
                }
              />
            </div>
            <ToggleSwitch
              checked={classForm.is_active}
              onChange={(v) => setClassForm({ ...classForm, is_active: v })}
              label="Active Class"
              hint="Students can only be enrolled in active classes"
            />
          </div>
          <div className="flex justify-end gap-2.5 pt-1">
            <Button
              variant="outline"
              onClick={() => {
                setEditClassTarget(null);
                setClassForm(EMPTY_CLASS_FORM);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEditClass} disabled={editingClass}>
              {editingClass ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Add Batch Modal ── */}
{/* ── Add Batch Modal ── */}
<Dialog
  open={addBatchOpen}
  onOpenChange={(open) => {
    if (!open) {
      setAddBatchOpen(false);
      setBatchForm(EMPTY_BATCH_FORM);
    }
  }}
>
  <DialogContent className="sm:max-w-[540px]">
    <DialogHeader>
      <DialogTitle>Add New Batch</DialogTitle>
    </DialogHeader>

    <div className="font-mono text-[11px] text-neutral-500 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2.5 leading-relaxed">
      ◈ A batch is a time-bound group within a class — e.g.{" "}
      <span className="text-edu-600 font-semibold">Morning Batch</span>,{" "}
      <span className="text-edu-600 font-semibold">2024 Batch</span>, or{" "}
      <span className="text-edu-600 font-semibold">Section A</span>.
      Only classes and subjects <span className="text-edu-600 font-semibold">assigned to teachers</span> are shown.
    </div>

    <div className="space-y-4">
      {/* Batch Name */}
      <div className="space-y-1.5">
        <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">
          Batch Name *
        </Label>
        <Input
          placeholder="e.g. Morning Batch, 2024 Batch, Section A"
          value={batchForm.name}
          onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })}
        />
      </div>

      {/* Class + Subject side by side */}
      <div className="grid grid-cols-2 gap-3.5">
        <div className="space-y-1.5">
          <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">
            Class *
          </Label>
          <Select
            value={batchForm.class_id}
            onValueChange={(val) => setBatchForm({ ...batchForm, class_id: val })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={loadingBatchOptions ? "Loading…" : "Select a class"} />
            </SelectTrigger>
            <SelectContent>
              {batchClasses.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-neutral-400">
                  No classes assigned to teachers yet
                </div>
              ) : (
                batchClasses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.class}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">
            Subject
          </Label>
          <Select
            value={batchForm.subject_id}
            onValueChange={(val) => setBatchForm({ ...batchForm, subject_id: val })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={loadingBatchOptions ? "Loading…" : "Select a subject"} />
            </SelectTrigger>
            <SelectContent>
              {batchSubjects.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-neutral-400">
                  No subjects assigned to teachers yet
                </div>
              ) : (
                batchSubjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.code ? `${s.code} – ${s.name}` : s.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">
          Description
        </Label>
        <Textarea
          placeholder="Optional notes about this batch…"
          rows={2}
          className="resize-none"
          value={batchForm.description}
          onChange={(e) => setBatchForm({ ...batchForm, description: e.target.value })}
        />
      </div>

      {/* Start + End Date */}
      <div className="grid grid-cols-2 gap-3.5">
        <div className="space-y-1.5">
          <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">
            Start Date
          </Label>
          <Input
            type="date"
            value={batchForm.start_date}
            onChange={(e) => setBatchForm({ ...batchForm, start_date: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">
            End Date
          </Label>
          <Input
            type="date"
            value={batchForm.end_date}
            onChange={(e) => setBatchForm({ ...batchForm, end_date: e.target.value })}
          />
        </div>
      </div>

      {/* Max Students */}
      <div className="space-y-1.5">
        <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">
          Max Students
        </Label>
        <Input
          type="number"
          min={1}
          placeholder="e.g. 30"
          value={batchForm.max_students}
          onChange={(e) => setBatchForm({ ...batchForm, max_students: e.target.value })}
        />
      </div>
    </div>

    <div className="flex justify-end gap-2.5 pt-1">
      <Button
        variant="outline"
        onClick={() => {
          setAddBatchOpen(false);
          setBatchForm(EMPTY_BATCH_FORM);
        }}
      >
        Cancel
      </Button>
      <Button onClick={handleAddBatch} disabled={addingBatch}>
        {addingBatch ? "Creating…" : "Create Batch"}
      </Button>
    </div>
  </DialogContent>
</Dialog>

      {/* ── Add Subject Modal ── */}
      <Dialog
        open={addSubjectOpen}
        onOpenChange={(open) => {
          if (!open) {
            setAddSubjectOpen(false);
            setSubjectForm(EMPTY_SUBJECT_FORM);
          }
        }}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Add New Subject</DialogTitle>
          </DialogHeader>
          <div className="font-mono text-[11px] text-neutral-500 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2.5 leading-relaxed">
            ◈ Subjects can later be{" "}
            <span className="text-edu-600 font-semibold">
              assigned to teachers
            </span>{" "}
            from the Teacher Management page.
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">
                Subject Name *
              </Label>
              <Input
                placeholder="e.g. Mathematics, Physics, English Literature"
                value={subjectForm.name}
                onChange={(e) =>
                  setSubjectForm({ ...subjectForm, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">
                Subject Code
              </Label>
              <Input
                placeholder="e.g. MATH101, PHY-AL, ENG-OL"
                value={subjectForm.code}
                onChange={(e) =>
                  setSubjectForm({ ...subjectForm, code: e.target.value })
                }
              />
              <p className="text-[11px] text-neutral-400">
                Optional — must be unique if provided.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">
                Description
              </Label>
              <Textarea
                placeholder="Brief description of this subject…"
                rows={3}
                className="resize-none"
                value={subjectForm.description}
                onChange={(e) =>
                  setSubjectForm({
                    ...subjectForm,
                    description: e.target.value,
                  })
                }
              />
            </div>
            <ToggleSwitch
              checked={subjectForm.is_active}
              onChange={(v) => setSubjectForm({ ...subjectForm, is_active: v })}
              label="Active Subject"
              hint="Only active subjects can be assigned to teachers"
            />
          </div>
          <div className="flex justify-end gap-2.5 pt-1">
            <Button
              variant="outline"
              onClick={() => {
                setAddSubjectOpen(false);
                setSubjectForm(EMPTY_SUBJECT_FORM);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddSubject} disabled={addingSubject}>
              {addingSubject ? "Creating…" : "Create Subject"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit Subject Modal ── */}
      <Dialog
        open={!!editSubjectTarget}
        onOpenChange={(open) => {
          if (!open) {
            setEditSubjectTarget(null);
            setSubjectForm(EMPTY_SUBJECT_FORM);
          }
        }}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Edit Subject</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">
                Subject Name *
              </Label>
              <Input
                value={subjectForm.name}
                onChange={(e) =>
                  setSubjectForm({ ...subjectForm, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">
                Subject Code
              </Label>
              <Input
                placeholder="e.g. MATH101"
                value={subjectForm.code}
                onChange={(e) =>
                  setSubjectForm({ ...subjectForm, code: e.target.value })
                }
              />
              <p className="text-[11px] text-neutral-400">
                Optional — must be unique if provided.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">
                Description
              </Label>
              <Textarea
                rows={3}
                className="resize-none"
                value={subjectForm.description}
                onChange={(e) =>
                  setSubjectForm({
                    ...subjectForm,
                    description: e.target.value,
                  })
                }
              />
            </div>
            <ToggleSwitch
              checked={subjectForm.is_active}
              onChange={(v) => setSubjectForm({ ...subjectForm, is_active: v })}
              label="Active Subject"
              hint="Only active subjects can be assigned to teachers"
            />
          </div>
          <div className="flex justify-end gap-2.5 pt-1">
            <Button
              variant="outline"
              onClick={() => {
                setEditSubjectTarget(null);
                setSubjectForm(EMPTY_SUBJECT_FORM);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEditSubject} disabled={editingSubject}>
              {editingSubject ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
