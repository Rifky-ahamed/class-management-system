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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const supabase = createClient();

// ── Constants ─────────────────────────────────────────────────────────────────
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const CURRENT_MONTH = new Date().getMonth() + 1;
const CURRENT_YEAR  = new Date().getFullYear();

const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 2 + i);

// ── Types ─────────────────────────────────────────────────────────────────────
type TeacherPaymentRow = {
  id:             string;
  teacher_id:     string;
  teacher_name:   string;
  teacher_email:  string;
  amount:         number;
  paid_amount:    number;
  month:          number;
  year:           number;
  status:         "pending" | "paid" | "partial";
  paid_date:      string | null;
  payment_method: string | null;
  notes:          string | null;
};

type StudentPaymentRow = {
  id:             string;
  student_id:     string;
  student_name:   string;
  student_email:  string;
  batch_id:       string;
  batch_name:     string;
  class_name:     string;
  amount:         number;
  paid_amount:    number;
  month:          number;
  year:           number;
  status:         "unpaid" | "paid" | "partial" | "waived";
  paid_date:      string | null;
  payment_method: string | null;
  reference_no:   string | null;
  notes:          string | null;
};

type TeacherOption  = { id: string; name: string; email: string };
type BatchOption    = { id: string; name: string; class_name: string; fee: number | null };

type TeacherPayForm = {
  teacher_id:     string;
  amount:         string;
  month:          string;
  year:           string;
  status:         string;
  paid_amount:    string;
  paid_date:      string;
  payment_method: string;
  notes:          string;
};

type StudentPayForm = {
  student_id:     string;
  batch_id:       string;
  amount:         string;
  month:          string;
  year:           string;
  status:         string;
  paid_amount:    string;
  payment_method: string;
  reference_no:   string;
  notes:          string;
};

const EMPTY_TEACHER_FORM: TeacherPayForm = {
  teacher_id: "", amount: "", month: String(CURRENT_MONTH),
  year: String(CURRENT_YEAR), status: "pending",
  paid_amount: "", paid_date: "", payment_method: "", notes: "",
};

const EMPTY_STUDENT_FORM: StudentPayForm = {
  student_id: "", batch_id: "", amount: "",
  month: String(CURRENT_MONTH), year: String(CURRENT_YEAR),
  status: "unpaid", paid_amount: "", payment_method: "",
  reference_no: "", notes: "",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatCurrency(amount: number) {
  return `LKR ${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function monthLabel(m: number) { return MONTHS[m - 1] ?? "—"; }

// ── Status Badge ──────────────────────────────────────────────────────────────
const TEACHER_STATUS: Record<string, string> = {
  paid:    "bg-success-100 text-success-700 border-success-500/20",
  pending: "bg-warning-100 text-warning-700 border-warning-500/20",
  partial: "bg-blue-100    text-blue-700    border-blue-500/20",
};

const STUDENT_STATUS: Record<string, string> = {
  paid:    "bg-success-100 text-success-700 border-success-500/20",
  unpaid:  "bg-danger-100  text-danger-700  border-danger-500/20",
  partial: "bg-blue-100    text-blue-700    border-blue-500/20",
  waived:  "bg-neutral-100 text-neutral-600 border-neutral-300",
};

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
        <p className={["text-[26px] font-black leading-none tracking-tight", valueClass ?? "text-neutral-900"].join(" ")}>
          {value}
        </p>
        {sub && <p className="text-[11px] text-neutral-400 mt-1.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function TableSkeletons({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2.5 p-5">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-11 w-full rounded-lg" style={{ opacity: 1 - i * 0.15 }} />
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PaymentPage() {

  // ── Filters ──────────────────────────────────────────────────────────────
  const [monthFilter, setMonthFilter] = useState(String(CURRENT_MONTH));
  const [yearFilter,  setYearFilter]  = useState(String(CURRENT_YEAR));
  const [tSearch,     setTSearch]     = useState("");
  const [sSearch,     setSSearch]     = useState("");
  const [tStatusFilter, setTStatusFilter] = useState("all");
  const [sStatusFilter, setSStatusFilter] = useState("all");
  const [sBatchFilter,  setSBatchFilter]  = useState("all");

  // ── Data ─────────────────────────────────────────────────────────────────
  const [teacherPayments,  setTeacherPayments]  = useState<TeacherPaymentRow[]>([]);
  const [studentPayments,  setStudentPayments]  = useState<StudentPaymentRow[]>([]);
  const [teachers,         setTeachers]         = useState<TeacherOption[]>([]);
  const [batches,          setBatches]          = useState<BatchOption[]>([]);
  const [students,         setStudents]         = useState<{ id: string; name: string; email: string }[]>([]);

  // ── Loading ───────────────────────────────────────────────────────────────
  const [loadingT, setLoadingT] = useState(true);
  const [loadingS, setLoadingS] = useState(true);

  // ── Modals ────────────────────────────────────────────────────────────────
  const [teacherPayOpen,   setTeacherPayOpen]   = useState(false);
  const [studentPayOpen,   setStudentPayOpen]   = useState(false);
  const [editTeacherPay,   setEditTeacherPay]   = useState<TeacherPaymentRow | null>(null);
  const [editStudentPay,   setEditStudentPay]   = useState<StudentPaymentRow | null>(null);
  const [deleteTeacherPay, setDeleteTeacherPay] = useState<TeacherPaymentRow | null>(null);
  const [deleteStudentPay, setDeleteStudentPay] = useState<StudentPaymentRow | null>(null);

  const [teacherForm, setTeacherForm] = useState<TeacherPayForm>(EMPTY_TEACHER_FORM);
  const [studentForm, setStudentForm] = useState<StudentPayForm>(EMPTY_STUDENT_FORM);
  const [savingT,     setSavingT]     = useState(false);
  const [savingS,     setSavingS]     = useState(false);
  const [deletingT,   setDeletingT]   = useState(false);
  const [deletingS,   setDeletingS]   = useState(false);

  // ── Fetch lookups ─────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.from("teachers").select("id, name, email")
      .eq("is_active", true).order("name")
      .then(({ data }) => { if (data) setTeachers(data); });

    supabase.from("batch")
      .select("id, name, class:class_id ( class ), batch_fee ( amount )")
      .eq("is_active", true).order("name")
      .then(({ data }) => {
        if (data) setBatches((data as any[]).map((b) => ({
          id:         b.id,
          name:       b.name,
          class_name: b.class?.class ?? "—",
          fee:        b.batch_fee?.[0]?.amount ?? null,
        })));
      });

    supabase.from("student").select("id, name, email")
      .eq("is_active", true).order("name")
      .then(({ data }) => { if (data) setStudents(data); });
  }, []);

  // ── Fetch teacher payments ────────────────────────────────────────────────
  const fetchTeacherPayments = useCallback(async () => {
    setLoadingT(true);
    let query = supabase
      .from("teacher_payment")
      .select(`
        id, teacher_id, amount, paid_amount,
        month, year, status, paid_date,
        payment_method, notes,
        teacher:teacher_id ( id, name, email )
      `)
      .eq("month", parseInt(monthFilter))
      .eq("year",  parseInt(yearFilter))
      .order("created_at", { ascending: false });

    if (tStatusFilter !== "all") query = query.eq("status", tStatusFilter);

    const { data, error } = await query;
    if (error) { toast.error("Failed to load teacher payments"); setLoadingT(false); return; }

    const rows: TeacherPaymentRow[] = (data as any[]).map((r) => ({
      id:             r.id,
      teacher_id:     r.teacher_id,
      teacher_name:   r.teacher?.name  ?? "—",
      teacher_email:  r.teacher?.email ?? "—",
      amount:         r.amount,
      paid_amount:    r.paid_amount,
      month:          r.month,
      year:           r.year,
      status:         r.status,
      paid_date:      r.paid_date,
      payment_method: r.payment_method,
      notes:          r.notes,
    }));

    // Filter by search
    const filtered = !tSearch ? rows : rows.filter((r) =>
      r.teacher_name.toLowerCase().includes(tSearch.toLowerCase()) ||
      r.teacher_email.toLowerCase().includes(tSearch.toLowerCase())
    );

    setTeacherPayments(filtered);
    setLoadingT(false);
  }, [monthFilter, yearFilter, tStatusFilter, tSearch]);

  useEffect(() => { fetchTeacherPayments(); }, [fetchTeacherPayments]);

  // ── Fetch student payments ────────────────────────────────────────────────
  const fetchStudentPayments = useCallback(async () => {
    setLoadingS(true);
    let query = supabase
      .from("student_payment")
      .select(`
        id, student_id, batch_id, amount, paid_amount,
        month, year, status, paid_date,
        payment_method, reference_no, notes,
        student:student_id ( id, name, email ),
        batch:batch_id (
          id, name,
          class:class_id ( class )
        )
      `)
      .eq("month", parseInt(monthFilter))
      .eq("year",  parseInt(yearFilter))
      .order("created_at", { ascending: false });

    if (sStatusFilter !== "all") query = query.eq("status", sStatusFilter);
    if (sBatchFilter  !== "all") query = query.eq("batch_id", sBatchFilter);

    const { data, error } = await query;
    if (error) { toast.error("Failed to load student payments"); setLoadingS(false); return; }

    const rows: StudentPaymentRow[] = (data as any[]).map((r) => ({
      id:             r.id,
      student_id:     r.student_id,
      student_name:   r.student?.name  ?? "—",
      student_email:  r.student?.email ?? "—",
      batch_id:       r.batch_id,
      batch_name:     r.batch?.name         ?? "—",
      class_name:     r.batch?.class?.class  ?? "—",
      amount:         r.amount,
      paid_amount:    r.paid_amount,
      month:          r.month,
      year:           r.year,
      status:         r.status,
      paid_date:      r.paid_date,
      payment_method: r.payment_method,
      reference_no:   r.reference_no,
      notes:          r.notes,
    }));

    const filtered = !sSearch ? rows : rows.filter((r) =>
      r.student_name.toLowerCase().includes(sSearch.toLowerCase()) ||
      r.student_email.toLowerCase().includes(sSearch.toLowerCase())
    );

    setStudentPayments(filtered);
    setLoadingS(false);
  }, [monthFilter, yearFilter, sStatusFilter, sBatchFilter, sSearch]);

  useEffect(() => { fetchStudentPayments(); }, [fetchStudentPayments]);

  // ── Open edit teacher payment ─────────────────────────────────────────────
  const openEditTeacher = (row: TeacherPaymentRow) => {
    setEditTeacherPay(row);
    setTeacherForm({
      teacher_id:     row.teacher_id,
      amount:         String(row.amount),
      month:          String(row.month),
      year:           String(row.year),
      status:         row.status,
      paid_amount:    String(row.paid_amount),
      paid_date:      row.paid_date?.split("T")[0] ?? "",
      payment_method: row.payment_method ?? "",
      notes:          row.notes ?? "",
    });
    setTeacherPayOpen(true);
  };

  // ── Save teacher payment ──────────────────────────────────────────────────
  const handleSaveTeacherPay = async () => {
    if (!teacherForm.teacher_id || !teacherForm.amount) {
      toast.error("Teacher and amount are required");
      return;
    }
    setSavingT(true);

    const payload = {
      teacher_id:     teacherForm.teacher_id,
      amount:         parseFloat(teacherForm.amount),
      month:          parseInt(teacherForm.month),
      year:           parseInt(teacherForm.year),
      status:         teacherForm.status,
      paid_amount:    parseFloat(teacherForm.paid_amount || "0"),
      paid_date:      teacherForm.paid_date   || null,
      payment_method: teacherForm.payment_method || null,
      notes:          teacherForm.notes       || null,
    };

    const { error } = editTeacherPay
      ? await supabase.from("teacher_payment").update(payload).eq("id", editTeacherPay.id)
      : await supabase.from("teacher_payment").insert(payload);

    if (error) toast.error(error.message);
    else {
      toast.success(editTeacherPay ? "Payment updated" : "Payment record created");
      setTeacherPayOpen(false);
      setEditTeacherPay(null);
      setTeacherForm(EMPTY_TEACHER_FORM);
      fetchTeacherPayments();
    }
    setSavingT(false);
  };

  // ── Open edit student payment ─────────────────────────────────────────────
  const openEditStudent = (row: StudentPaymentRow) => {
    setEditStudentPay(row);
    setStudentForm({
      student_id:     row.student_id,
      batch_id:       row.batch_id,
      amount:         String(row.amount),
      month:          String(row.month),
      year:           String(row.year),
      status:         row.status,
      paid_amount:    String(row.paid_amount),
      payment_method: row.payment_method ?? "",
      reference_no:   row.reference_no   ?? "",
      notes:          row.notes          ?? "",
    });
    setStudentPayOpen(true);
  };

  // ── Save student payment ──────────────────────────────────────────────────
  const handleSaveStudentPay = async () => {
    if (!studentForm.student_id || !studentForm.batch_id || !studentForm.amount) {
      toast.error("Student, batch and amount are required");
      return;
    }
    setSavingS(true);

    const payload = {
      student_id:     studentForm.student_id,
      batch_id:       studentForm.batch_id,
      amount:         parseFloat(studentForm.amount),
      month:          parseInt(studentForm.month),
      year:           parseInt(studentForm.year),
      status:         studentForm.status,
      paid_amount:    parseFloat(studentForm.paid_amount || "0"),
      payment_method: studentForm.payment_method || null,
      reference_no:   studentForm.reference_no   || null,
      notes:          studentForm.notes           || null,
    };

    const { error } = editStudentPay
      ? await supabase.from("student_payment").update(payload).eq("id", editStudentPay.id)
      : await supabase.from("student_payment").insert(payload);

    if (error) toast.error(error.message);
    else {
      toast.success(editStudentPay ? "Payment updated" : "Payment record created");
      setStudentPayOpen(false);
      setEditStudentPay(null);
      setStudentForm(EMPTY_STUDENT_FORM);
      fetchStudentPayments();
    }
    setSavingS(false);
  };

  // ── Delete teacher payment ────────────────────────────────────────────────
  const handleDeleteTeacher = async () => {
    if (!deleteTeacherPay) return;
    setDeletingT(true);
    const { error } = await supabase.from("teacher_payment").delete().eq("id", deleteTeacherPay.id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Payment record deleted"); fetchTeacherPayments(); }
    setDeletingT(false);
    setDeleteTeacherPay(null);
  };

  // ── Delete student payment ────────────────────────────────────────────────
  const handleDeleteStudent = async () => {
    if (!deleteStudentPay) return;
    setDeletingS(true);
    const { error } = await supabase.from("student_payment").delete().eq("id", deleteStudentPay.id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Payment record deleted"); fetchStudentPayments(); }
    setDeletingS(false);
    setDeleteStudentPay(null);
  };

  // ── Auto-fill amount from batch fee ──────────────────────────────────────
  const handleBatchChange = (batch_id: string) => {
    const batch = batches.find((b) => b.id === batch_id);
    setStudentForm((prev) => ({
      ...prev,
      batch_id,
      amount: batch?.fee ? String(batch.fee) : prev.amount,
    }));
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const tTotal    = teacherPayments.reduce((s, r) => s + r.amount, 0);
  const tPaid     = teacherPayments.filter((r) => r.status === "paid").length;
  const tPending  = teacherPayments.filter((r) => r.status === "pending").length;
  const tPaidAmt  = teacherPayments.reduce((s, r) => s + r.paid_amount, 0);

  const sTotal    = studentPayments.reduce((s, r) => s + r.amount, 0);
  const sPaid     = studentPayments.filter((r) => r.status === "paid").length;
  const sUnpaid   = studentPayments.filter((r) => r.status === "unpaid").length;
  const sPaidAmt  = studentPayments.reduce((s, r) => s + r.paid_amount, 0);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── Month / Year Filter (global) ── */}
      <Card>
        <CardContent className="px-5 py-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500 whitespace-nowrap">
              Viewing Period
            </span>
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="font-mono text-[11px] text-neutral-400 ml-1">
              {monthLabel(parseInt(monthFilter))} {yearFilter}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ── Tabs ── */}
      <Tabs defaultValue="teachers" className="space-y-4">
        <TabsList className="bg-neutral-100 p-1 rounded-lg h-auto">
          <TabsTrigger value="teachers"
            className="font-mono text-[11px] tracking-[1.5px] uppercase px-5 py-2
                       data-[state=active]:bg-white data-[state=active]:shadow-sm
                       data-[state=active]:text-neutral-900 text-neutral-500">
            Teacher Salaries
          </TabsTrigger>
          <TabsTrigger value="students"
            className="font-mono text-[11px] tracking-[1.5px] uppercase px-5 py-2
                       data-[state=active]:bg-white data-[state=active]:shadow-sm
                       data-[state=active]:text-neutral-900 text-neutral-500">
            Student Fees
          </TabsTrigger>
        </TabsList>

        {/* ══════════════ TEACHER SALARIES TAB ══════════════ */}
        <TabsContent value="teachers" className="space-y-4 mt-0">

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Total Payable"  value={formatCurrency(tTotal)}   icon="💰" />
            <StatCard label="Total Paid"     value={formatCurrency(tPaidAmt)} valueClass="text-success-600" icon="✅" />
            <StatCard label="Paid"           value={tPaid}    valueClass="text-success-600"
              sub={`${teacherPayments.length} total teachers`} icon="👤" />
            <StatCard label="Pending"        value={tPending} valueClass="text-warning-600"
              sub="awaiting payment" icon="⏳" />
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm pointer-events-none">⌕</span>
              <Input className="pl-8" placeholder="Search teacher…"
                value={tSearch} onChange={(e) => setTSearch(e.target.value)} />
            </div>
            <Select value={tStatusFilter} onValueChange={setTStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => {
              setEditTeacherPay(null);
              setTeacherForm({ ...EMPTY_TEACHER_FORM, month: monthFilter, year: yearFilter });
              setTeacherPayOpen(true);
            }}>
              + Add Payment
            </Button>
            <Button variant="outline" onClick={fetchTeacherPayments}>↺ Refresh</Button>
          </div>

          {/* Table */}
          <Card>
            <CardHeader className="px-5 py-3.5 border-b border-neutral-100 flex-row items-center gap-3 space-y-0">
              <span className="text-[13px] font-bold text-neutral-900">Teacher Salary Records</span>
              <span className="font-mono text-[11px] bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full">
                {teacherPayments.length} records
              </span>
              <span className="font-mono text-[11px] bg-neutral-50 text-neutral-500 border border-neutral-200 px-2 py-0.5 rounded-full ml-auto">
                {monthLabel(parseInt(monthFilter))} {yearFilter}
              </span>
            </CardHeader>
            <CardContent className="p-0">
              {loadingT ? <TableSkeletons /> : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                        {["#","Teacher","Email","Salary","Paid","Balance","Method","Paid Date","Status","Actions"].map((h) => (
                          <TableHead key={h} className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500 whitespace-nowrap">
                            {h}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teacherPayments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10}>
                            <div className="py-14 text-center">
                              <p className="text-3xl opacity-30 mb-2">◈</p>
                              <p className="text-[13px] text-neutral-500">
                                No teacher payment records for {monthLabel(parseInt(monthFilter))} {yearFilter}.
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        teacherPayments.map((r, i) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-mono text-[11px] text-neutral-400">
                              {String(i + 1).padStart(2, "0")}
                            </TableCell>
                            <TableCell className="font-semibold text-neutral-900 whitespace-nowrap">
                              {r.teacher_name}
                            </TableCell>
                            <TableCell className="text-neutral-400 text-xs">{r.teacher_email}</TableCell>
                            <TableCell className="font-mono text-[12px] font-bold text-neutral-700 whitespace-nowrap">
                              {formatCurrency(r.amount)}
                            </TableCell>
                            <TableCell className="font-mono text-[12px] font-bold text-success-600 whitespace-nowrap">
                              {formatCurrency(r.paid_amount)}
                            </TableCell>
                            <TableCell className={`font-mono text-[12px] font-bold whitespace-nowrap ${
                              r.amount - r.paid_amount > 0 ? "text-danger-600" : "text-neutral-400"
                            }`}>
                              {formatCurrency(Math.max(0, r.amount - r.paid_amount))}
                            </TableCell>
                            <TableCell className="text-neutral-500 text-xs capitalize">
                              {r.payment_method ?? <span className="text-neutral-300">—</span>}
                            </TableCell>
                            <TableCell className="font-mono text-[11px] text-neutral-500 whitespace-nowrap">
                              {formatDate(r.paid_date)}
                            </TableCell>
                            <TableCell>
                              <Badge className={`font-mono text-[10px] border ${TEACHER_STATUS[r.status]}`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current mr-1 shrink-0" />
                                {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <Button variant="ghost" size="sm"
                                  className="text-[11px] font-semibold text-edu-600 bg-edu-50 border border-edu-500/15 hover:bg-edu-500 hover:text-white h-auto py-1 px-2.5"
                                  onClick={() => openEditTeacher(r)}>
                                  ✎ Edit
                                </Button>
                                <Button variant="ghost" size="sm"
                                  className="text-[11px] font-semibold text-danger-600 bg-danger-100 border border-danger-500/15 hover:bg-danger-500 hover:text-white h-auto py-1 px-2.5"
                                  onClick={() => setDeleteTeacherPay(r)}>
                                  ✕
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

        {/* ══════════════ STUDENT FEES TAB ══════════════ */}
        <TabsContent value="students" className="space-y-4 mt-0">

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Total Fees"     value={formatCurrency(sTotal)}   icon="💳" />
            <StatCard label="Collected"      value={formatCurrency(sPaidAmt)} valueClass="text-success-600" icon="✅" />
            <StatCard label="Paid"           value={sPaid}   valueClass="text-success-600"
              sub={`${studentPayments.length} total records`} icon="👤" />
            <StatCard label="Unpaid"         value={sUnpaid} valueClass="text-danger-600"
              sub="pending collection" icon="⚠️" />
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm pointer-events-none">⌕</span>
              <Input className="pl-8" placeholder="Search student…"
                value={sSearch} onChange={(e) => setSSearch(e.target.value)} />
            </div>
            <Select value={sBatchFilter} onValueChange={setSBatchFilter}>
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
            <Select value={sStatusFilter} onValueChange={setSStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="waived">Waived</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => {
              setEditStudentPay(null);
              setStudentForm({ ...EMPTY_STUDENT_FORM, month: monthFilter, year: yearFilter });
              setStudentPayOpen(true);
            }}>
              + Add Payment
            </Button>
            <Button variant="outline" onClick={fetchStudentPayments}>↺ Refresh</Button>
          </div>

          {/* Table */}
          <Card>
            <CardHeader className="px-5 py-3.5 border-b border-neutral-100 flex-row items-center gap-3 space-y-0">
              <span className="text-[13px] font-bold text-neutral-900">Student Fee Records</span>
              <span className="font-mono text-[11px] bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full">
                {studentPayments.length} records
              </span>
              <span className="font-mono text-[11px] bg-neutral-50 text-neutral-500 border border-neutral-200 px-2 py-0.5 rounded-full ml-auto">
                {monthLabel(parseInt(monthFilter))} {yearFilter}
              </span>
            </CardHeader>
            <CardContent className="p-0">
              {loadingS ? <TableSkeletons /> : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                        {["#","Student","Batch","Class","Fee","Paid","Balance","Method","Ref No","Status","Actions"].map((h) => (
                          <TableHead key={h} className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500 whitespace-nowrap">
                            {h}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentPayments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={11}>
                            <div className="py-14 text-center">
                              <p className="text-3xl opacity-30 mb-2">◈</p>
                              <p className="text-[13px] text-neutral-500">
                                No student payment records for {monthLabel(parseInt(monthFilter))} {yearFilter}.
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        studentPayments.map((r, i) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-mono text-[11px] text-neutral-400">
                              {String(i + 1).padStart(2, "0")}
                            </TableCell>
                            <TableCell>
                              <p className="font-semibold text-neutral-900 whitespace-nowrap text-[13px]">
                                {r.student_name}
                              </p>
                              <p className="text-neutral-400 text-[11px]">{r.student_email}</p>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs font-semibold bg-edu-50 text-edu-700 border border-edu-200/70 px-2 py-0.5 rounded-full whitespace-nowrap">
                                {r.batch_name}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs font-semibold bg-neutral-100 text-neutral-700 border border-neutral-200 px-2 py-0.5 rounded-full">
                                {r.class_name}
                              </span>
                            </TableCell>
                            <TableCell className="font-mono text-[12px] font-bold text-neutral-700 whitespace-nowrap">
                              {formatCurrency(r.amount)}
                            </TableCell>
                            <TableCell className="font-mono text-[12px] font-bold text-success-600 whitespace-nowrap">
                              {formatCurrency(r.paid_amount)}
                            </TableCell>
                            <TableCell className={`font-mono text-[12px] font-bold whitespace-nowrap ${
                              r.amount - r.paid_amount > 0 ? "text-danger-600" : "text-neutral-400"
                            }`}>
                              {formatCurrency(Math.max(0, r.amount - r.paid_amount))}
                            </TableCell>
                            <TableCell className="text-neutral-500 text-xs capitalize">
                              {r.payment_method ?? <span className="text-neutral-300">—</span>}
                            </TableCell>
                            <TableCell className="font-mono text-[11px] text-neutral-500">
                              {r.reference_no ?? <span className="text-neutral-300">—</span>}
                            </TableCell>
                            <TableCell>
                              <Badge className={`font-mono text-[10px] border ${STUDENT_STATUS[r.status]}`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current mr-1 shrink-0" />
                                {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <Button variant="ghost" size="sm"
                                  className="text-[11px] font-semibold text-edu-600 bg-edu-50 border border-edu-500/15 hover:bg-edu-500 hover:text-white h-auto py-1 px-2.5"
                                  onClick={() => openEditStudent(r)}>
                                  ✎ Edit
                                </Button>
                                <Button variant="ghost" size="sm"
                                  className="text-[11px] font-semibold text-danger-600 bg-danger-100 border border-danger-500/15 hover:bg-danger-500 hover:text-white h-auto py-1 px-2.5"
                                  onClick={() => setDeleteStudentPay(r)}>
                                  ✕
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

      {/* ══ Teacher Payment Modal ══ */}
      <Dialog open={teacherPayOpen} onOpenChange={(open) => {
        if (!open) { setTeacherPayOpen(false); setEditTeacherPay(null); setTeacherForm(EMPTY_TEACHER_FORM); }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editTeacherPay ? "Edit Teacher Payment" : "Add Teacher Payment"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">

            {/* Teacher */}
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">Teacher *</Label>
              <Select value={teacherForm.teacher_id} disabled={!!editTeacherPay}
                onValueChange={(val) => setTeacherForm((p) => ({ ...p, teacher_id: val }))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Month + Year */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">Month *</Label>
                <Select value={teacherForm.month} disabled={!!editTeacherPay}
                  onValueChange={(val) => setTeacherForm((p) => ({ ...p, month: val }))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">Year *</Label>
                <Select value={teacherForm.year} disabled={!!editTeacherPay}
                  onValueChange={(val) => setTeacherForm((p) => ({ ...p, year: val }))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Amount + Paid Amount */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">Salary Amount (LKR) *</Label>
                <Input type="number" placeholder="0.00" value={teacherForm.amount}
                  onChange={(e) => setTeacherForm((p) => ({ ...p, amount: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">Paid Amount (LKR)</Label>
                <Input type="number" placeholder="0.00" value={teacherForm.paid_amount}
                  onChange={(e) => setTeacherForm((p) => ({ ...p, paid_amount: e.target.value }))} />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">Status *</Label>
              <Select value={teacherForm.status}
                onValueChange={(val) => setTeacherForm((p) => ({ ...p, status: val }))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payment Method + Paid Date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">Payment Method</Label>
                <Select value={teacherForm.payment_method}
                  onValueChange={(val) => setTeacherForm((p) => ({ ...p, payment_method: val }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">Paid Date</Label>
                <Input type="date" value={teacherForm.paid_date}
                  onChange={(e) => setTeacherForm((p) => ({ ...p, paid_date: e.target.value }))} />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">Notes</Label>
              <Input placeholder="Optional notes…" value={teacherForm.notes}
                onChange={(e) => setTeacherForm((p) => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-1">
            <Button variant="outline" onClick={() => {
              setTeacherPayOpen(false); setEditTeacherPay(null); setTeacherForm(EMPTY_TEACHER_FORM);
            }}>Cancel</Button>
            <Button onClick={handleSaveTeacherPay} disabled={savingT}>
              {savingT ? "Saving…" : editTeacherPay ? "Save Changes" : "Create Record"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══ Student Payment Modal ══ */}
      <Dialog open={studentPayOpen} onOpenChange={(open) => {
        if (!open) { setStudentPayOpen(false); setEditStudentPay(null); setStudentForm(EMPTY_STUDENT_FORM); }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editStudentPay ? "Edit Student Payment" : "Add Student Payment"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">

            {/* Student */}
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">Student *</Label>
              <Select value={studentForm.student_id} disabled={!!editStudentPay}
                onValueChange={(val) => setStudentForm((p) => ({ ...p, student_id: val }))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Batch */}
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">Batch *</Label>
              <Select value={studentForm.batch_id} disabled={!!editStudentPay}
                onValueChange={handleBatchChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select batch" />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name} · {b.class_name}
                      {b.fee && <span className="text-neutral-400 ml-1">· LKR {b.fee}</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {studentForm.batch_id && batches.find((b) => b.id === studentForm.batch_id)?.fee && (
                <p className="text-[11px] text-success-600 font-mono">
                  ✓ Fee auto-filled from batch: LKR {batches.find((b) => b.id === studentForm.batch_id)?.fee}
                </p>
              )}
            </div>

            {/* Month + Year */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">Month *</Label>
                <Select value={studentForm.month} disabled={!!editStudentPay}
                  onValueChange={(val) => setStudentForm((p) => ({ ...p, month: val }))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">Year *</Label>
                <Select value={studentForm.year} disabled={!!editStudentPay}
                  onValueChange={(val) => setStudentForm((p) => ({ ...p, year: val }))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Amount + Paid Amount */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">Fee Amount (LKR) *</Label>
                <Input type="number" placeholder="0.00" value={studentForm.amount}
                  onChange={(e) => setStudentForm((p) => ({ ...p, amount: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">Paid Amount (LKR)</Label>
                <Input type="number" placeholder="0.00" value={studentForm.paid_amount}
                  onChange={(e) => setStudentForm((p) => ({ ...p, paid_amount: e.target.value }))} />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">Status *</Label>
              <Select value={studentForm.status}
                onValueChange={(val) => setStudentForm((p) => ({ ...p, status: val }))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="waived">Waived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payment Method + Reference */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">Payment Method</Label>
                <Select value={studentForm.payment_method}
                  onValueChange={(val) => setStudentForm((p) => ({ ...p, payment_method: val }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">Reference No</Label>
                <Input placeholder="e.g. TXN123456" value={studentForm.reference_no}
                  onChange={(e) => setStudentForm((p) => ({ ...p, reference_no: e.target.value }))} />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">Notes</Label>
              <Input placeholder="Optional notes…" value={studentForm.notes}
                onChange={(e) => setStudentForm((p) => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-1">
            <Button variant="outline" onClick={() => {
              setStudentPayOpen(false); setEditStudentPay(null); setStudentForm(EMPTY_STUDENT_FORM);
            }}>Cancel</Button>
            <Button onClick={handleSaveStudentPay} disabled={savingS}>
              {savingS ? "Saving…" : editStudentPay ? "Save Changes" : "Create Record"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══ Delete Teacher Pay Dialog ══ */}
      <AlertDialog open={!!deleteTeacherPay} onOpenChange={(open) => { if (!open) setDeleteTeacherPay(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="w-11 h-11 rounded-xl bg-danger-100 border border-danger-500/20 grid place-items-center text-xl mb-1">⚠</div>
            <AlertDialogTitle>Delete Payment Record?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete the {monthLabel(deleteTeacherPay?.month ?? 1)} {deleteTeacherPay?.year} salary record for{" "}
              <strong className="text-foreground">{deleteTeacherPay?.teacher_name}</strong>?
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-danger-500 hover:bg-danger-600 text-white"
              onClick={handleDeleteTeacher} disabled={deletingT}>
              {deletingT ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ══ Delete Student Pay Dialog ══ */}
      <AlertDialog open={!!deleteStudentPay} onOpenChange={(open) => { if (!open) setDeleteStudentPay(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="w-11 h-11 rounded-xl bg-danger-100 border border-danger-500/20 grid place-items-center text-xl mb-1">⚠</div>
            <AlertDialogTitle>Delete Payment Record?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete the {monthLabel(deleteStudentPay?.month ?? 1)} {deleteStudentPay?.year} fee record for{" "}
              <strong className="text-foreground">{deleteStudentPay?.student_name}</strong>?
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-danger-500 hover:bg-danger-600 text-white"
              onClick={handleDeleteStudent} disabled={deletingS}>
              {deletingS ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}