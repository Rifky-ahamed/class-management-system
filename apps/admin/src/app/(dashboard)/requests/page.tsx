"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Badge }    from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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
import { Label }  from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const supabase = createClient();

// ── Types ─────────────────────────────────────────────────────────────────────
type RequestRow = {
  id:             string;
  requester_type: "teacher" | "student";
  teacher_id:     string | null;
  student_id:     string | null;
  requester_name:  string;
  requester_email: string;
  category:       string;
  subject:        string;
  message:        string;
  status:         "pending" | "in_progress" | "resolved" | "rejected";
  priority:       "low" | "normal" | "high" | "urgent";
  response:       string | null;
  responded_at:   string | null;
  created_at:     string;
};

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  pending:     "bg-warning-100 text-warning-700 border-warning-500/20",
  in_progress: "bg-blue-100    text-blue-700    border-blue-500/20",
  resolved:    "bg-success-100 text-success-700 border-success-500/20",
  rejected:    "bg-danger-100  text-danger-700  border-danger-500/20",
};

const PRIORITY_STYLES: Record<string, string> = {
  low:    "bg-neutral-100 text-neutral-500 border-neutral-300",
  normal: "bg-neutral-100 text-neutral-600 border-neutral-300",
  high:   "bg-warning-100 text-warning-700 border-warning-500/20",
  urgent: "bg-danger-100  text-danger-700  border-danger-500/20",
};

const PRIORITY_DOTS: Record<string, string> = {
  low:    "bg-neutral-400",
  normal: "bg-neutral-500",
  high:   "bg-warning-500",
  urgent: "bg-danger-500",
};

const CATEGORY_LABELS: Record<string, string> = {
  leave:    "Leave",
  payment:  "Payment",
  technical:"Technical",
  schedule: "Schedule",
  general:  "General",
  other:    "Other",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function formatDateTime(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
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

// ── Request Detail / Respond Modal ────────────────────────────────────────────
function RequestModal({
  request,
  open,
  onClose,
  onSaved,
}: {
  request: RequestRow | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [status,   setStatus]   = useState("pending");
  const [response, setResponse] = useState("");
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    if (request) {
      setStatus(request.status);
      setResponse(request.response ?? "");
    }
  }, [request]);

  const handleSave = async () => {
    if (!request) return;
    setSaving(true);

    const { error } = await supabase
      .from("requests")
      .update({
        status,
        response:     response || null,
        responded_at: response ? new Date().toISOString() : request.responded_at,
      })
      .eq("id", request.id);

    if (error) toast.error(error.message);
    else {
      toast.success("Request updated");
      onSaved();
      onClose();
    }
    setSaving(false);
  };

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Details</DialogTitle>
        </DialogHeader>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <Badge className={`font-mono text-[10px] border ${STATUS_STYLES[request.status]}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current mr-1 shrink-0" />
            {capitalize(request.status.replace("_", " "))}
          </Badge>
          <Badge className={`font-mono text-[10px] border ${PRIORITY_STYLES[request.priority]}`}>
            <span className={`w-1.5 h-1.5 rounded-full mr-1 shrink-0 ${PRIORITY_DOTS[request.priority]}`} />
            {capitalize(request.priority)}
          </Badge>
          <span className="font-mono text-[10px] bg-neutral-100 text-neutral-500 border border-neutral-200 px-2 py-0.5 rounded-full">
            {CATEGORY_LABELS[request.category] ?? request.category}
          </span>
          <span className="font-mono text-[10px] text-neutral-400 ml-auto">
            {formatDateTime(request.created_at)}
          </span>
        </div>

        {/* Requester */}
        <div className="rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-3 space-y-0.5">
          <p className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-400">
            {capitalize(request.requester_type)}
          </p>
          <p className="font-semibold text-neutral-900">{request.requester_name}</p>
          <p className="text-xs text-neutral-400">{request.requester_email}</p>
        </div>

        {/* Subject + Message */}
        <div className="space-y-1">
          <p className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">Subject</p>
          <p className="font-semibold text-neutral-900">{request.subject}</p>
        </div>
        <div className="space-y-1">
          <p className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">Message</p>
          <div className="rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-3 text-[13px] text-neutral-700 leading-relaxed whitespace-pre-wrap">
            {request.message}
          </div>
        </div>

        <div className="border-t border-neutral-100 pt-4 space-y-4">
          <p className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500 font-bold">
            Admin Response
          </p>

          {/* Status update */}
          <div className="space-y-1.5">
            <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">
              Update Status *
            </Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Response text */}
          <div className="space-y-1.5">
            <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">
              Response Message
            </Label>
            <Textarea
              placeholder="Write your response to the requester…"
              className="min-h-[100px] text-[13px]"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
            />
          </div>

          {request.responded_at && (
            <p className="font-mono text-[11px] text-neutral-400">
              Last responded: {formatDateTime(request.responded_at)}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2.5 pt-1">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save Response"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Requests Table ────────────────────────────────────────────────────────────
function RequestsTable({
  rows,
  loading,
  onView,
  onDelete,
  emptyLabel,
}: {
  rows: RequestRow[];
  loading: boolean;
  onView: (r: RequestRow) => void;
  onDelete: (r: RequestRow) => void;
  emptyLabel: string;
}) {
  const cols = ["#", "Name", "Category", "Subject", "Priority", "Status", "Submitted", "Actions"];

  return (
    <Card>
      <CardContent className="p-0">
        {loading ? (
          <TableSkeletons />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                  {cols.map((h) => (
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
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={cols.length}>
                      <div className="py-14 text-center">
                        <p className="text-3xl opacity-30 mb-2">◈</p>
                        <p className="text-[13px] text-neutral-500">{emptyLabel}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r, i) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-[11px] text-neutral-400">
                        {String(i + 1).padStart(2, "0")}
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold text-neutral-900 whitespace-nowrap text-[13px]">
                          {r.requester_name}
                        </p>
                        <p className="text-neutral-400 text-[11px]">{r.requester_email}</p>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-semibold bg-neutral-100 text-neutral-700 border border-neutral-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                          {CATEGORY_LABELS[r.category] ?? r.category}
                        </span>
                      </TableCell>
                      <TableCell>
                        <p className="text-[13px] text-neutral-800 max-w-[200px] truncate" title={r.subject}>
                          {r.subject}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge className={`font-mono text-[10px] border ${PRIORITY_STYLES[r.priority]}`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1 shrink-0 ${PRIORITY_DOTS[r.priority]}`} />
                          {capitalize(r.priority)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`font-mono text-[10px] border ${STATUS_STYLES[r.status]}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current mr-1 shrink-0" />
                          {capitalize(r.status.replace("_", " "))}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-[11px] text-neutral-500 whitespace-nowrap">
                        {formatDate(r.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="ghost" size="sm"
                            className="text-[11px] font-semibold text-edu-600 bg-edu-50 border border-edu-500/15 hover:bg-edu-500 hover:text-white h-auto py-1 px-2.5"
                            onClick={() => onView(r)}
                          >
                            ↗ View
                          </Button>
                          <Button
                            variant="ghost" size="sm"
                            className="text-[11px] font-semibold text-danger-600 bg-danger-100 border border-danger-500/15 hover:bg-danger-500 hover:text-white h-auto py-1 px-2.5"
                            onClick={() => onDelete(r)}
                          >
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
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function RequestsPage() {
  const [teacherRequests, setTeacherRequests] = useState<RequestRow[]>([]);
  const [studentRequests, setStudentRequests] = useState<RequestRow[]>([]);

  const [loadingT, setLoadingT] = useState(true);
  const [loadingS, setLoadingS] = useState(true);

  const [tSearch,        setTSearch]        = useState("");
  const [sSearch,        setSSearch]        = useState("");
  const [tStatusFilter,  setTStatusFilter]  = useState("all");
  const [sStatusFilter,  setSStatusFilter]  = useState("all");
  const [tCategoryFilter,setTCategoryFilter]= useState("all");
  const [sCategoryFilter,setSCategoryFilter]= useState("all");
  const [tPriorityFilter,setTPriorityFilter]= useState("all");
  const [sPriorityFilter,setSPriorityFilter]= useState("all");

  const [viewRequest,   setViewRequest]   = useState<RequestRow | null>(null);
  const [deleteTarget,  setDeleteTarget]  = useState<RequestRow | null>(null);
  const [deleting,      setDeleting]      = useState(false);

  // ── Fetch teacher requests ────────────────────────────────────────────────
  const fetchTeacherRequests = useCallback(async () => {
    setLoadingT(true);
    let query = supabase
      .from("requests")
      .select(`
        id, requester_type, teacher_id, student_id,
        category, subject, message,
        status, priority, response, responded_at, created_at,
        teacher:teacher_id ( id, name, email )
      `)
      .eq("requester_type", "teacher")
      .order("created_at", { ascending: false });

    if (tStatusFilter   !== "all") query = query.eq("status",   tStatusFilter);
    if (tCategoryFilter !== "all") query = query.eq("category", tCategoryFilter);
    if (tPriorityFilter !== "all") query = query.eq("priority", tPriorityFilter);

    const { data, error } = await query;
    if (error) { toast.error("Failed to load teacher requests"); setLoadingT(false); return; }

    let rows: RequestRow[] = (data as any[]).map((r) => ({
      id:              r.id,
      requester_type:  "teacher",
      teacher_id:      r.teacher_id,
      student_id:      null,
      requester_name:  r.teacher?.name  ?? "—",
      requester_email: r.teacher?.email ?? "—",
      category:        r.category,
      subject:         r.subject,
      message:         r.message,
      status:          r.status,
      priority:        r.priority,
      response:        r.response,
      responded_at:    r.responded_at,
      created_at:      r.created_at,
    }));

    if (tSearch) {
      rows = rows.filter((r) =>
        r.requester_name.toLowerCase().includes(tSearch.toLowerCase()) ||
        r.subject.toLowerCase().includes(tSearch.toLowerCase())
      );
    }

    setTeacherRequests(rows);
    setLoadingT(false);
  }, [tSearch, tStatusFilter, tCategoryFilter, tPriorityFilter]);

  useEffect(() => { fetchTeacherRequests(); }, [fetchTeacherRequests]);

  // ── Fetch student requests ────────────────────────────────────────────────
  const fetchStudentRequests = useCallback(async () => {
    setLoadingS(true);
    let query = supabase
      .from("requests")
      .select(`
        id, requester_type, teacher_id, student_id,
        category, subject, message,
        status, priority, response, responded_at, created_at,
        student:student_id ( id, name, email )
      `)
      .eq("requester_type", "student")
      .order("created_at", { ascending: false });

    if (sStatusFilter   !== "all") query = query.eq("status",   sStatusFilter);
    if (sCategoryFilter !== "all") query = query.eq("category", sCategoryFilter);
    if (sPriorityFilter !== "all") query = query.eq("priority", sPriorityFilter);

    const { data, error } = await query;
    if (error) { toast.error("Failed to load student requests"); setLoadingS(false); return; }

    let rows: RequestRow[] = (data as any[]).map((r) => ({
      id:              r.id,
      requester_type:  "student",
      teacher_id:      null,
      student_id:      r.student_id,
      requester_name:  r.student?.name  ?? "—",
      requester_email: r.student?.email ?? "—",
      category:        r.category,
      subject:         r.subject,
      message:         r.message,
      status:          r.status,
      priority:        r.priority,
      response:        r.response,
      responded_at:    r.responded_at,
      created_at:      r.created_at,
    }));

    if (sSearch) {
      rows = rows.filter((r) =>
        r.requester_name.toLowerCase().includes(sSearch.toLowerCase()) ||
        r.subject.toLowerCase().includes(sSearch.toLowerCase())
      );
    }

    setStudentRequests(rows);
    setLoadingS(false);
  }, [sSearch, sStatusFilter, sCategoryFilter, sPriorityFilter]);

  useEffect(() => { fetchStudentRequests(); }, [fetchStudentRequests]);

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("requests").delete().eq("id", deleteTarget.id);
    if (error) toast.error("Failed to delete");
    else {
      toast.success("Request deleted");
      deleteTarget.requester_type === "teacher"
        ? fetchTeacherRequests()
        : fetchStudentRequests();
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const tPending    = teacherRequests.filter((r) => r.status === "pending").length;
  const tInProgress = teacherRequests.filter((r) => r.status === "in_progress").length;
  const tResolved   = teacherRequests.filter((r) => r.status === "resolved").length;
  const tUrgent     = teacherRequests.filter((r) => r.priority === "urgent").length;

  const sPending    = studentRequests.filter((r) => r.status === "pending").length;
  const sInProgress = studentRequests.filter((r) => r.status === "in_progress").length;
  const sResolved   = studentRequests.filter((r) => r.status === "resolved").length;
  const sUrgent     = studentRequests.filter((r) => r.priority === "urgent").length;

  // ── Filter toolbar render helper ──────────────────────────────────────────
  const Toolbar = ({
    search, setSearch, statusFilter, setStatusFilter,
    catFilter, setCatFilter, prioFilter, setPrioFilter,
    onRefresh,
  }: {
    search: string; setSearch: (v: string) => void;
    statusFilter: string; setStatusFilter: (v: string) => void;
    catFilter: string; setCatFilter: (v: string) => void;
    prioFilter: string; setPrioFilter: (v: string) => void;
    onRefresh: () => void;
  }) => (
    <div className="flex items-center gap-2.5 flex-wrap">
      <div className="relative flex-1 min-w-[200px]">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm pointer-events-none">⌕</span>
        <Input
          className="pl-8"
          placeholder="Search name or subject…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Select value={catFilter} onValueChange={setCatFilter}>
        <SelectTrigger className="w-[140px]"><SelectValue placeholder="Category" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
            <SelectItem key={v} value={v}>{l}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={prioFilter} onValueChange={setPrioFilter}>
        <SelectTrigger className="w-[130px]"><SelectValue placeholder="Priority" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priorities</SelectItem>
          <SelectItem value="low">Low</SelectItem>
          <SelectItem value="normal">Normal</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="urgent">Urgent</SelectItem>
        </SelectContent>
      </Select>

      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="resolved">Resolved</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
        </SelectContent>
      </Select>

      <Button variant="outline" onClick={onRefresh}>↺ Refresh</Button>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      <Tabs defaultValue="teachers" className="space-y-4">
        <TabsList className="bg-neutral-100 p-1 rounded-lg h-auto">
          <TabsTrigger
            value="teachers"
            className="font-mono text-[11px] tracking-[1.5px] uppercase px-5 py-2
                       data-[state=active]:bg-white data-[state=active]:shadow-sm
                       data-[state=active]:text-neutral-900 text-neutral-500"
          >
            Teacher Requests
            {tPending > 0 && (
              <span className="ml-2 bg-warning-500 text-white font-mono text-[10px] px-1.5 py-0.5 rounded-full">
                {tPending}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="students"
            className="font-mono text-[11px] tracking-[1.5px] uppercase px-5 py-2
                       data-[state=active]:bg-white data-[state=active]:shadow-sm
                       data-[state=active]:text-neutral-900 text-neutral-500"
          >
            Student Requests
            {sPending > 0 && (
              <span className="ml-2 bg-warning-500 text-white font-mono text-[10px] px-1.5 py-0.5 rounded-full">
                {sPending}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ══════════════ TEACHER REQUESTS TAB ══════════════ */}
        <TabsContent value="teachers" className="space-y-4 mt-0">

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Total Requests" value={teacherRequests.length} icon="📋"
              sub="all time" />
            <StatCard label="Pending"        value={tPending}    icon="⏳"
              valueClass="text-warning-600"  sub="awaiting action" />
            <StatCard label="In Progress"    value={tInProgress} icon="🔄"
              valueClass="text-blue-600"     sub="being handled" />
            <StatCard label="Urgent"         value={tUrgent}     icon="🚨"
              valueClass="text-danger-600"   sub="need immediate attention" />
          </div>

          <Toolbar
            search={tSearch}          setSearch={setTSearch}
            statusFilter={tStatusFilter} setStatusFilter={setTStatusFilter}
            catFilter={tCategoryFilter}  setCatFilter={setTCategoryFilter}
            prioFilter={tPriorityFilter} setPrioFilter={setTPriorityFilter}
            onRefresh={fetchTeacherRequests}
          />

          <Card>
            <CardHeader className="px-5 py-3.5 border-b border-neutral-100 flex-row items-center gap-3 space-y-0">
              <span className="text-[13px] font-bold text-neutral-900">Teacher Requests</span>
              <span className="font-mono text-[11px] bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full">
                {teacherRequests.length} records
              </span>
              {tPending > 0 && (
                <span className="font-mono text-[11px] bg-warning-100 text-warning-700 border border-warning-500/20 px-2 py-0.5 rounded-full ml-auto">
                  {tPending} pending
                </span>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <RequestsTable
                rows={teacherRequests}
                loading={loadingT}
                onView={setViewRequest}
                onDelete={setDeleteTarget}
                emptyLabel="No teacher requests found. Adjust filters or check back later."
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════════ STUDENT REQUESTS TAB ══════════════ */}
        <TabsContent value="students" className="space-y-4 mt-0">

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Total Requests" value={studentRequests.length} icon="📋"
              sub="all time" />
            <StatCard label="Pending"        value={sPending}    icon="⏳"
              valueClass="text-warning-600"  sub="awaiting action" />
            <StatCard label="In Progress"    value={sInProgress} icon="🔄"
              valueClass="text-blue-600"     sub="being handled" />
            <StatCard label="Urgent"         value={sUrgent}     icon="🚨"
              valueClass="text-danger-600"   sub="need immediate attention" />
          </div>

          <Toolbar
            search={sSearch}          setSearch={setSSearch}
            statusFilter={sStatusFilter} setStatusFilter={setSStatusFilter}
            catFilter={sCategoryFilter}  setCatFilter={setSCategoryFilter}
            prioFilter={sPriorityFilter} setPrioFilter={setSPriorityFilter}
            onRefresh={fetchStudentRequests}
          />

          <Card>
            <CardHeader className="px-5 py-3.5 border-b border-neutral-100 flex-row items-center gap-3 space-y-0">
              <span className="text-[13px] font-bold text-neutral-900">Student Requests</span>
              <span className="font-mono text-[11px] bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full">
                {studentRequests.length} records
              </span>
              {sPending > 0 && (
                <span className="font-mono text-[11px] bg-warning-100 text-warning-700 border border-warning-500/20 px-2 py-0.5 rounded-full ml-auto">
                  {sPending} pending
                </span>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <RequestsTable
                rows={studentRequests}
                loading={loadingS}
                onView={setViewRequest}
                onDelete={setDeleteTarget}
                emptyLabel="No student requests found. Adjust filters or check back later."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ══ View / Respond Modal ══ */}
      <RequestModal
        request={viewRequest}
        open={!!viewRequest}
        onClose={() => setViewRequest(null)}
        onSaved={() => {
          if (viewRequest?.requester_type === "teacher") fetchTeacherRequests();
          else fetchStudentRequests();
        }}
      />

      {/* ══ Delete Dialog ══ */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="w-11 h-11 rounded-xl bg-danger-100 border border-danger-500/20 grid place-items-center text-xl mb-1">⚠</div>
            <AlertDialogTitle>Delete Request?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete the request &ldquo;<strong className="text-foreground">{deleteTarget?.subject}</strong>&rdquo;
              {" "}from <strong className="text-foreground">{deleteTarget?.requester_name}</strong>?
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger-500 hover:bg-danger-600 text-white"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}