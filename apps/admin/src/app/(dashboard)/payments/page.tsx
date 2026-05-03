"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

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

// ── Types ─────────────────────────────────────────────────────────────────────
type TeacherPaymentRow = {
  id:             string;
  teacher_id:     string;
  teacher_name:   string;
  teacher_email:  string;
  batch_id:       string;
  batch_name:     string;
  amount:         number;
  paid_amount:    number;
  status:         "pending" | "paid" | "partial";
  paid_at:        string | null;
  payment_method: string | null;
  transaction_id: string | null;
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
  installment_no: number;
  amount:         number;
  paid_amount:    number;
  status:         "unpaid" | "paid" | "partial" | "waived";
  due_date:       string | null;
  paid_at:        string | null;
  payment_method: string | null;
  reference_no:   string | null;
  notes:          string | null;
};

type TeacherOption  = { id: string; name: string; email: string };
type BatchOption    = { id: string; name: string; class_name: string; fee: number | null, end_date: string | null };
type StudentOption  = { id: string; name: string; email: string };

type TeacherPayForm = {
  teacher_id:     string;
  batch_id:       string;
  amount:         string;
  status:         string;
  paid_amount:    string;
  paid_at:        string;
  payment_method: string;
  transaction_id: string;
  notes:          string;
};

type StudentPayForm = {
  student_id:     string;
  batch_id:       string;
  installment_no: string;
  amount:         string;
  status:         string;
  paid_amount:    string;
  due_date:       string;
  paid_at:        string;
  payment_method: string;
  reference_no:   string;
  notes:          string;
};

const EMPTY_TEACHER_FORM: TeacherPayForm = {
  teacher_id: "", batch_id: "", amount: "", status: "pending",
  paid_amount: "", paid_at: "", payment_method: "", transaction_id: "", notes: "",
};

const EMPTY_STUDENT_FORM: StudentPayForm = {
  student_id: "", batch_id: "", installment_no: "1", amount: "",
  status: "unpaid", paid_amount: "", due_date: "", paid_at: "", payment_method: "",
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
  // Teacher Filters
  const [tBatchFilter, setTBatchFilter] = useState("all");
  const [tTeacherFilter, setTTeacherFilter] = useState("all");
  const [tStartDate, setTStartDate] = useState("");
  const [tEndDate, setTEndDate] = useState("");

  // Student Filters
  const [sBatchFilter, setSBatchFilter] = useState("all");
  const [sStudentFilter, setSStudentFilter] = useState("all");
  const [sStatusFilter, setSStatusFilter] = useState("all");
  const [sStartDate, setSStartDate] = useState("");
  const [sEndDate, setSEndDate] = useState("");

  // ── Data ─────────────────────────────────────────────────────────────────
  const [teacherPayments,  setTeacherPayments]  = useState<TeacherPaymentRow[]>([]);
  const [studentPayments,  setStudentPayments]  = useState<StudentPaymentRow[]>([]);
  const [pendingDues,      setPendingDues]      = useState<any[]>([]);

  const [teachers,         setTeachers]         = useState<TeacherOption[]>([]);
  const [batches,          setBatches]          = useState<BatchOption[]>([]);
  const [students,         setStudents]         = useState<StudentOption[]>([]);

  // ── Loading ───────────────────────────────────────────────────────────────
  const [loadingT, setLoadingT] = useState(true);
  const [loadingS, setLoadingS] = useState(true);
  const [loadingD, setLoadingD] = useState(true);

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

  // PayPal Payment Modal specific
  const [showPayPal, setShowPayPal] = useState(false);

  // ── Fetch lookups ─────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.from("teachers").select("id, name, email").order("name")
      .then(({ data }) => { if (data) setTeachers(data); });

    supabase.from("batch")
      .select("id, name, end_date, class:class_id ( class ), batch_fee ( amount )")
      .order("name")
      .then(({ data }) => {
        if (data) setBatches((data as any[]).map((b) => ({
          id:         b.id,
          name:       b.name,
          class_name: b.class?.class ?? "—",
          fee:        b.batch_fee?.[0]?.amount ?? null,
          end_date:   b.end_date,
        })));
      });

    supabase.from("student").select("id, name, email").order("name")
      .then(({ data }) => { if (data) setStudents(data); });
  }, []);

  // ── Fetch teacher payments ────────────────────────────────────────────────
  const fetchTeacherPayments = useCallback(async () => {
    setLoadingT(true);
    let query = supabase
      .from("teacher_payment")
      .select(`
        id, teacher_id, batch_id, amount, paid_amount,
        status, paid_at, payment_method, transaction_id, notes,
        teacher:teacher_id ( id, name, email ),
        batch:batch_id ( id, name )
      `)
      .order("created_at", { ascending: false });

    if (tBatchFilter !== "all") query = query.eq("batch_id", tBatchFilter);
    if (tTeacherFilter !== "all") query = query.eq("teacher_id", tTeacherFilter);
    if (tStartDate) query = query.gte("paid_at", tStartDate);
    if (tEndDate) query = query.lte("paid_at", tEndDate);

    const { data, error } = await query;
    if (error) { toast.error("Failed to load teacher payments"); setLoadingT(false); return; }

    const rows: TeacherPaymentRow[] = (data as any[]).map((r) => ({
      id:             r.id,
      teacher_id:     r.teacher_id,
      teacher_name:   r.teacher?.name  ?? "—",
      teacher_email:  r.teacher?.email ?? "—",
      batch_id:       r.batch_id,
      batch_name:     r.batch?.name ?? "—",
      amount:         r.amount,
      paid_amount:    r.paid_amount,
      status:         r.status,
      paid_at:        r.paid_at,
      payment_method: r.payment_method,
      transaction_id: r.transaction_id,
      notes:          r.notes,
    }));

    setTeacherPayments(rows);
    setLoadingT(false);
  }, [tBatchFilter, tTeacherFilter, tStartDate, tEndDate]);

  useEffect(() => { fetchTeacherPayments(); }, [fetchTeacherPayments]);

  // ── Fetch student payments ────────────────────────────────────────────────
  const fetchStudentPayments = useCallback(async () => {
    setLoadingS(true);
    let query = supabase
      .from("student_payment")
      .select(`
        id, student_id, batch_id, installment_no, amount, paid_amount,
        status, due_date, paid_at, payment_method, reference_no, notes,
        student:student_id ( id, name, email ),
        batch:batch_id ( id, name, class:class_id ( class ) )
      `)
      .order("created_at", { ascending: false });

    if (sBatchFilter !== "all") query = query.eq("batch_id", sBatchFilter);
    if (sStudentFilter !== "all") query = query.eq("student_id", sStudentFilter);
    if (sStatusFilter !== "all") query = query.eq("status", sStatusFilter);
    if (sStartDate) query = query.gte("paid_at", sStartDate);
    if (sEndDate) query = query.lte("paid_at", sEndDate);

    const { data, error } = await query;
    if (error) { toast.error("Failed to load student payments"); setLoadingS(false); return; }

    const rows: StudentPaymentRow[] = (data as any[]).map((r) => ({
      id:             r.id,
      student_id:     r.student_id,
      student_name:   r.student?.name  ?? "—",
      student_email:  r.student?.email ?? "—",
      batch_id:       r.batch_id,
      batch_name:     r.batch?.name ?? "—",
      class_name:     r.batch?.class?.class ?? "—",
      installment_no: r.installment_no,
      amount:         r.amount,
      paid_amount:    r.paid_amount,
      status:         r.status,
      due_date:       r.due_date,
      paid_at:        r.paid_at,
      payment_method: r.payment_method,
      reference_no:   r.reference_no,
      notes:          r.notes,
    }));

    setStudentPayments(rows);
    setLoadingS(false);
  }, [sBatchFilter, sStudentFilter, sStatusFilter, sStartDate, sEndDate]);

  useEffect(() => { fetchStudentPayments(); }, [fetchStudentPayments]);

  // ── Fetch pending dues (completed batches) ────────────────────────────────
  const fetchPendingDues = useCallback(async () => {
    setLoadingD(true);
    const today = new Date().toISOString().split("T")[0];
    
    // Find batches where end_date <= today
    const { data: pastBatches, error: bError } = await supabase
      .from("batch")
      .select("id, name, end_date, teacher_id, teachers(name)")
      .lte("end_date", today);
      
    if (bError) { toast.error("Failed to fetch pending dues"); setLoadingD(false); return; }
    
    const dues = [];
    for (const b of (pastBatches || [])) {
      // Check teacher payment
      let teacherPaid = false;
      if (b.teacher_id) {
        const { data: tPay } = await supabase.from("teacher_payment")
          .select("id, paid_amount, amount")
          .eq("batch_id", b.id).eq("teacher_id", b.teacher_id).single();
        if (tPay && tPay.paid_amount >= tPay.amount) {
          teacherPaid = true;
        }
      } else {
        teacherPaid = true; // No teacher assigned
      }
      
      // Check student pending installments
      const { data: sPays } = await supabase.from("student_payment")
        .select("id, amount, paid_amount, student:student_id(name)")
        .eq("batch_id", b.id);
        
      const pendingStudents = (sPays || []).filter(sp => sp.paid_amount < sp.amount);
      
      if (!teacherPaid || pendingStudents.length > 0) {
        dues.push({
          batch_id: b.id,
          batch_name: b.name,
          end_date: b.end_date,
          teacher_name: (b.teachers as any)?.name ?? (b.teachers as any)?.[0]?.name ?? "—",
          teacher_pending: !teacherPaid,
          pending_students: pendingStudents.map(ps => (ps.student as any)?.name ?? (ps.student as any)?.[0]?.name).filter(Boolean)
        });
      }
    }
    
    setPendingDues(dues);
    setLoadingD(false);
  }, []);

  useEffect(() => { fetchPendingDues(); }, [fetchPendingDues]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSaveTeacherPay = async () => {
    if (!teacherForm.teacher_id || !teacherForm.batch_id || !teacherForm.amount) {
      toast.error("Teacher, batch and amount are required");
      return;
    }
    setSavingT(true);

    const payload = {
      teacher_id:     teacherForm.teacher_id,
      batch_id:       teacherForm.batch_id,
      amount:         parseFloat(teacherForm.amount),
      status:         teacherForm.status,
      paid_amount:    parseFloat(teacherForm.paid_amount || "0"),
      paid_at:        teacherForm.paid_at   || null,
      payment_method: teacherForm.payment_method || null,
      transaction_id: teacherForm.transaction_id || null,
      notes:          teacherForm.notes       || null,
    };

    const { error } = editTeacherPay
      ? await supabase.from("teacher_payment").update(payload).eq("id", editTeacherPay.id)
      : await supabase.from("teacher_payment").insert(payload);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(editTeacherPay ? "Payment updated" : "Payment record created");
      setTeacherPayOpen(false);
      setEditTeacherPay(null);
      setTeacherForm(EMPTY_TEACHER_FORM);
      fetchTeacherPayments();
      fetchPendingDues();
    }
    setSavingT(false);
  };
  
  // PayPal integration mock for teacher
  const handlePayPalSuccess = (details: any) => {
    toast.success("PayPal transaction completed by " + details.payer.name.given_name);
    setTeacherForm(prev => ({
      ...prev,
      status: "paid",
      paid_amount: prev.amount,
      paid_at: new Date().toISOString().split("T")[0],
      payment_method: "online",
      transaction_id: details.id
    }));
    setShowPayPal(false);
  };

  const handleSaveStudentPay = async () => {
    if (!studentForm.student_id || !studentForm.batch_id || !studentForm.amount) {
      toast.error("Student, batch and amount are required");
      return;
    }
    setSavingS(true);

    const payload = {
      student_id:     studentForm.student_id,
      batch_id:       studentForm.batch_id,
      installment_no: parseInt(studentForm.installment_no),
      amount:         parseFloat(studentForm.amount),
      status:         studentForm.status,
      paid_amount:    parseFloat(studentForm.paid_amount || "0"),
      due_date:       studentForm.due_date || null,
      paid_at:        studentForm.paid_at || null,
      payment_method: studentForm.payment_method || null,
      reference_no:   studentForm.reference_no   || null,
      notes:          studentForm.notes           || null,
    };

    const { error } = editStudentPay
      ? await supabase.from("student_payment").update(payload).eq("id", editStudentPay.id)
      : await supabase.from("student_payment").insert(payload);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(editStudentPay ? "Payment updated" : "Payment record created");
      setStudentPayOpen(false);
      setEditStudentPay(null);
      setStudentForm(EMPTY_STUDENT_FORM);
      fetchStudentPayments();
      fetchPendingDues();
    }
    setSavingS(false);
  };

  const handleDeleteTeacher = async () => {
    if (!deleteTeacherPay) return;
    setDeletingT(true);
    const { error } = await supabase.from("teacher_payment").delete().eq("id", deleteTeacherPay.id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Payment record deleted"); fetchTeacherPayments(); fetchPendingDues(); }
    setDeletingT(false);
    setDeleteTeacherPay(null);
  };

  const handleDeleteStudent = async () => {
    if (!deleteStudentPay) return;
    setDeletingS(true);
    const { error } = await supabase.from("student_payment").delete().eq("id", deleteStudentPay.id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Payment record deleted"); fetchStudentPayments(); fetchPendingDues(); }
    setDeletingS(false);
    setDeleteStudentPay(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <PayPalScriptProvider options={{ clientId: "test", currency: "USD" }}>
      <div className="space-y-5">

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
            <TabsTrigger value="pending"
              className="font-mono text-[11px] tracking-[1.5px] uppercase px-5 py-2
                         data-[state=active]:bg-danger-50 data-[state=active]:shadow-sm
                         data-[state=active]:text-danger-900 text-neutral-500">
              Pending Dues <Badge variant="destructive" className="ml-2 h-4 px-1 text-[9px]">{pendingDues.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* ══════════════ TEACHER SALARIES TAB ══════════════ */}
          <TabsContent value="teachers" className="space-y-4 mt-0">
            <Card>
              <CardContent className="px-5 py-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500 whitespace-nowrap">
                    Filters
                  </span>
                  <Select value={tBatchFilter} onValueChange={setTBatchFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Batch (Primary)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Batches</SelectItem>
                      {batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={tTeacherFilter} onValueChange={setTTeacherFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Teacher (Optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Teachers</SelectItem>
                      {teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="font-mono text-[10px] text-neutral-400">Date Range:</span>
                    <Input type="date" className="w-[130px] h-9" value={tStartDate} onChange={e => setTStartDate(e.target.value)} />
                    <span className="text-neutral-300">-</span>
                    <Input type="date" className="w-[130px] h-9" value={tEndDate} onChange={e => setTEndDate(e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Teacher Payments</h3>
              <Button onClick={() => {
                setEditTeacherPay(null);
                setShowPayPal(false);
                setTeacherForm(EMPTY_TEACHER_FORM);
                setTeacherPayOpen(true);
              }}>
                + Add Salary Record
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                {loadingT ? <TableSkeletons /> : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                        {["#","Teacher","Batch","Salary","Paid","Balance","Method","Paid At","Status","Actions"].map((h) => (
                          <TableHead key={h} className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">{h}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teacherPayments.length === 0 ? (
                        <TableRow><TableCell colSpan={10} className="py-10 text-center text-neutral-400">No records found.</TableCell></TableRow>
                      ) : (
                        teacherPayments.map((r, i) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-mono text-[11px] text-neutral-400">{i + 1}</TableCell>
                            <TableCell className="font-semibold text-neutral-900">{r.teacher_name}</TableCell>
                            <TableCell><Badge variant="outline">{r.batch_name}</Badge></TableCell>
                            <TableCell className="font-mono font-bold">{formatCurrency(r.amount)}</TableCell>
                            <TableCell className="font-mono font-bold text-success-600">{formatCurrency(r.paid_amount)}</TableCell>
                            <TableCell className={`font-mono font-bold ${r.amount - r.paid_amount > 0 ? "text-danger-600" : "text-neutral-400"}`}>
                              {formatCurrency(Math.max(0, r.amount - r.paid_amount))}
                            </TableCell>
                            <TableCell className="capitalize text-xs text-neutral-500">{r.payment_method || "—"}</TableCell>
                            <TableCell className="font-mono text-[11px]">{formatDate(r.paid_at)}</TableCell>
                            <TableCell>
                              <Badge className={`font-mono text-[10px] border ${TEACHER_STATUS[r.status]}`}>
                                {r.status.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" onClick={() => { setEditTeacherPay(r); setTeacherForm({
                                  teacher_id: r.teacher_id, batch_id: r.batch_id, amount: String(r.amount),
                                  status: r.status, paid_amount: String(r.paid_amount), paid_at: r.paid_at ?? "",
                                  payment_method: r.payment_method ?? "", transaction_id: r.transaction_id ?? "", notes: r.notes ?? ""
                                }); setTeacherPayOpen(true); setShowPayPal(false); }}>Edit</Button>
                                <Button variant="ghost" size="sm" className="text-danger-600" onClick={() => setDeleteTeacherPay(r)}>Del</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ══════════════ STUDENT FEES TAB ══════════════ */}
          <TabsContent value="students" className="space-y-4 mt-0">
            <Card>
              <CardContent className="px-5 py-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500 whitespace-nowrap">
                    Filters
                  </span>
                  <Select value={sBatchFilter} onValueChange={setSBatchFilter}>
                    <SelectTrigger className="w-[160px]"><SelectValue placeholder="Batch (Primary)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Batches</SelectItem>
                      {batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={sStudentFilter} onValueChange={setSStudentFilter}>
                    <SelectTrigger className="w-[160px]"><SelectValue placeholder="Student (Opt)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Students</SelectItem>
                      {students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={sStatusFilter} onValueChange={setSStatusFilter}>
                    <SelectTrigger className="w-[120px]"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="font-mono text-[10px] text-neutral-400">Date Range:</span>
                    <Input type="date" className="w-[130px] h-9" value={sStartDate} onChange={e => setSStartDate(e.target.value)} />
                    <span className="text-neutral-300">-</span>
                    <Input type="date" className="w-[130px] h-9" value={sEndDate} onChange={e => setSEndDate(e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Student Installments</h3>
              <Button onClick={() => {
                setEditStudentPay(null);
                setStudentForm(EMPTY_STUDENT_FORM);
                setStudentPayOpen(true);
              }}>
                + Add Installment
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                {loadingS ? <TableSkeletons /> : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-neutral-50">
                        {["#","Student","Batch","Inst #","Amount","Paid","Balance","Due Date","Status","Actions"].map((h) => (
                          <TableHead key={h} className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">{h}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentPayments.length === 0 ? (
                        <TableRow><TableCell colSpan={10} className="py-10 text-center text-neutral-400">No records found.</TableCell></TableRow>
                      ) : (
                        studentPayments.map((r, i) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-mono text-[11px] text-neutral-400">{i + 1}</TableCell>
                            <TableCell className="font-semibold text-neutral-900">{r.student_name}</TableCell>
                            <TableCell><Badge variant="secondary">{r.batch_name}</Badge></TableCell>
                            <TableCell className="font-mono font-bold text-center">{r.installment_no}</TableCell>
                            <TableCell className="font-mono">{formatCurrency(r.amount)}</TableCell>
                            <TableCell className="font-mono text-success-600">{formatCurrency(r.paid_amount)}</TableCell>
                            <TableCell className={`font-mono ${r.amount - r.paid_amount > 0 ? "text-danger-600" : "text-neutral-400"}`}>
                              {formatCurrency(Math.max(0, r.amount - r.paid_amount))}
                            </TableCell>
                            <TableCell className="font-mono text-[11px]">{formatDate(r.due_date)}</TableCell>
                            <TableCell>
                              <Badge className={`font-mono text-[10px] border ${STUDENT_STATUS[r.status]}`}>
                                {r.status.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" onClick={() => { setEditStudentPay(r); setStudentForm({
                                  student_id: r.student_id, batch_id: r.batch_id, installment_no: String(r.installment_no),
                                  amount: String(r.amount), status: r.status, paid_amount: String(r.paid_amount),
                                  due_date: r.due_date ?? "", paid_at: r.paid_at ?? "", payment_method: r.payment_method ?? "",
                                  reference_no: r.reference_no ?? "", notes: r.notes ?? ""
                                }); setStudentPayOpen(true); }}>Edit</Button>
                                <Button variant="ghost" size="sm" className="text-danger-600" onClick={() => setDeleteStudentPay(r)}>Del</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ══════════════ PENDING DUES TAB ══════════════ */}
          <TabsContent value="pending" className="space-y-4 mt-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-danger-900">Batch End Alerts</h3>
              <p className="text-sm text-neutral-500">Batches that have reached their end date with outstanding dues.</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loadingD ? <Skeleton className="h-32 w-full" /> : pendingDues.length === 0 ? (
                <div className="col-span-full py-12 text-center text-neutral-400 bg-neutral-50 rounded-xl border border-dashed">
                  No completed batches have pending dues. All clear! 🎉
                </div>
              ) : pendingDues.map((due, idx) => (
                <Card key={idx} className="border-danger-200 bg-danger-50/30 overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-danger-500" />
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-lg">{due.batch_name}</h4>
                        <p className="text-xs text-neutral-500 font-mono">Ended: {formatDate(due.end_date)}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {due.teacher_pending && (
                      <div className="p-2 bg-warning-50 rounded text-sm text-warning-800 border border-warning-200">
                        <span className="font-bold">Teacher Unpaid:</span> {due.teacher_name}
                      </div>
                    )}
                    {due.pending_students.length > 0 && (
                      <div className="p-2 bg-danger-50 rounded text-sm text-danger-800 border border-danger-200">
                        <span className="font-bold">Students Unpaid ({due.pending_students.length}):</span>
                        <p className="text-xs mt-1 truncate">{due.pending_students.join(", ")}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* ══ Teacher Payment Modal ══ */}
        <Dialog open={teacherPayOpen} onOpenChange={(open) => {
          if (!open) { setTeacherPayOpen(false); setEditTeacherPay(null); setTeacherForm(EMPTY_TEACHER_FORM); setShowPayPal(false); }
        }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editTeacherPay ? "Edit Salary Record" : "Add Salary Record"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">Teacher *</Label>
                <Select value={teacherForm.teacher_id} disabled={!!editTeacherPay}
                  onValueChange={(val) => setTeacherForm((p) => ({ ...p, teacher_id: val }))}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select teacher" /></SelectTrigger>
                  <SelectContent>{teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">Batch *</Label>
                <Select value={teacherForm.batch_id} disabled={!!editTeacherPay}
                  onValueChange={(val) => setTeacherForm((p) => ({ ...p, batch_id: val }))}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select batch" /></SelectTrigger>
                  <SelectContent>{batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>

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

              <div className="grid grid-cols-2 gap-3">
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
                <div className="space-y-1.5">
                  <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">Paid At</Label>
                  <Input type="date" value={teacherForm.paid_at}
                    onChange={(e) => setTeacherForm((p) => ({ ...p, paid_at: e.target.value }))} />
                </div>
              </div>

              {!showPayPal && (
                <div className="pt-2">
                  <Button variant="outline" className="w-full bg-[#0070ba] text-white hover:bg-[#003087] hover:text-white border-0" 
                    onClick={() => setShowPayPal(true)}>
                    Pay with PayPal (Sandbox)
                  </Button>
                </div>
              )}
              
              {showPayPal && (
                <div className="p-4 bg-neutral-50 border rounded-xl">
                  <p className="text-xs text-center text-neutral-500 mb-4">Complete sandbox payment for {formatCurrency(parseFloat(teacherForm.amount || "0"))}</p>
                  <PayPalButtons 
                    style={{ layout: "horizontal", height: 40 }}
                    createOrder={(data, actions) => {
                      return actions.order.create({
                        intent: "CAPTURE",
                        purchase_units: [{
                          amount: {
                            currency_code: "USD",
                            value: (parseFloat(teacherForm.amount || "0") / 300).toFixed(2), // Mock conversion
                          },
                          description: `Salary for ${teacherForm.batch_id}`
                        }],
                      });
                    }}
                    onApprove={async (data, actions) => {
                      const details = await actions.order?.capture();
                      handlePayPalSuccess(details);
                    }}
                  />
                  <Button variant="ghost" size="sm" className="w-full mt-2 text-xs" onClick={() => setShowPayPal(false)}>Cancel PayPal</Button>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2.5 pt-1">
              <Button variant="outline" onClick={() => { setTeacherPayOpen(false); }}>Cancel</Button>
              <Button onClick={handleSaveTeacherPay} disabled={savingT || showPayPal}>
                {savingT ? "Saving…" : "Save Record"}
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
              <DialogTitle>{editStudentPay ? "Edit Installment" : "Add Installment"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">Student *</Label>
                <Select value={studentForm.student_id} disabled={!!editStudentPay}
                  onValueChange={(val) => setStudentForm((p) => ({ ...p, student_id: val }))}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>{students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">Batch *</Label>
                  <Select value={studentForm.batch_id} disabled={!!editStudentPay}
                    onValueChange={(val) => {
                      const b = batches.find(x => x.id === val);
                      setStudentForm((p) => ({ ...p, batch_id: val, amount: b?.fee ? String(b.fee) : p.amount }));
                    }}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select batch" /></SelectTrigger>
                    <SelectContent>{batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">Installment No *</Label>
                  <Input type="number" min="1" value={studentForm.installment_no} disabled={!!editStudentPay}
                    onChange={(e) => setStudentForm((p) => ({ ...p, installment_no: e.target.value }))} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">Expected Amount *</Label>
                  <Input type="number" placeholder="0.00" value={studentForm.amount}
                    onChange={(e) => setStudentForm((p) => ({ ...p, amount: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">Paid Amount</Label>
                  <Input type="number" placeholder="0.00" value={studentForm.paid_amount}
                    onChange={(e) => setStudentForm((p) => ({ ...p, paid_amount: e.target.value }))} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">Status *</Label>
                  <Select value={studentForm.status}
                    onValueChange={(val) => setStudentForm((p) => ({ ...p, status: val }))}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">Paid At</Label>
                  <Input type="date" value={studentForm.paid_at}
                    onChange={(e) => setStudentForm((p) => ({ ...p, paid_at: e.target.value }))} />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-1">
              <Button variant="outline" onClick={() => { setStudentPayOpen(false); }}>Cancel</Button>
              <Button onClick={handleSaveStudentPay} disabled={savingS}>
                {savingS ? "Saving…" : "Save Record"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ══ Delete Alerts ══ */}
        <AlertDialog open={!!deleteTeacherPay} onOpenChange={(o) => !o && setDeleteTeacherPay(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Record?</AlertDialogTitle>
              <AlertDialogDescription>Are you sure you want to delete this payment record?</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-danger-500 text-white" onClick={handleDeleteTeacher}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!deleteStudentPay} onOpenChange={(o) => !o && setDeleteStudentPay(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Record?</AlertDialogTitle>
              <AlertDialogDescription>Are you sure you want to delete this payment record?</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-danger-500 text-white" onClick={handleDeleteStudent}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </PayPalScriptProvider>
  );
}