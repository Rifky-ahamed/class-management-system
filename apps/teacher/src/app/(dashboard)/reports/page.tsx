"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Plus, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

const supabase = createClient();

type Report = {
  id: string;
  category: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  response: string | null;
  created_at: string;
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherId, setTeacherId] = useState<string | null>(null);

  // Form State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    category: "general",
    subject: "",
    message: "",
    priority: "normal",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      setLoading(false);
      return;
    }

    const { data: teacherData } = await supabase
      .from("teachers")
      .select("id")
      .eq("email", user.email)
      .single();

    if (!teacherData) {
      setLoading(false);
      return;
    }

    setTeacherId(teacherData.id);

    // Fetch reports/requests
    const { data: reportData } = await supabase
      .from("requests")
      .select(`
        id, category, subject, message, status, priority, response, created_at
      `)
      .eq("requester_type", "teacher")
      .eq("teacher_id", teacherData.id)
      .order("created_at", { ascending: false });

    if (reportData) {
      setReports(reportData);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherId || !formData.subject || !formData.message) return;

    setIsSubmitting(true);
    const payload = {
      requester_type: "teacher",
      teacher_id: teacherId,
      category: formData.category,
      subject: formData.subject,
      message: formData.message,
      priority: formData.priority,
      status: "pending",
    };

    const { error } = await supabase.from("requests").insert(payload);

    if (!error) {
      setIsDialogOpen(false);
      setFormData({ category: "general", subject: "", message: "", priority: "normal" });
      fetchData();
    } else {
      console.error("Failed to submit report", error);
    }
    setIsSubmitting(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="w-4 h-4 text-amber-500" />;
      case "in_progress": return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case "resolved": return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "rejected": return <XCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none">Pending</Badge>;
      case "in_progress": return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">In Progress</Badge>;
      case "resolved": return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Resolved</Badge>;
      case "rejected": return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none">Rejected</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "low": return <Badge variant="outline" className="text-neutral-500 border-neutral-200">Low</Badge>;
      case "normal": return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Normal</Badge>;
      case "high": return <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">High</Badge>;
      case "urgent": return <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 animate-pulse">Urgent</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Submit Report</h1>
          <p className="text-sm text-neutral-500 mt-1">Send issue reports, leave requests, or messages to the admin.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-edu-600 hover:bg-edu-700 text-white rounded-xl shadow-sm gap-2">
              <Plus className="w-4 h-4" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Submit New Request</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateReport} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
                  <select
                    id="category"
                    required
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="leave">Leave Request</option>
                    <option value="payment">Payment Issue</option>
                    <option value="technical">Technical Support</option>
                    <option value="schedule">Schedule Change</option>
                    <option value="general">General Inquiry</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority <span className="text-red-500">*</span></Label>
                  <select
                    id="priority"
                    required
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject <span className="text-red-500">*</span></Label>
                <Input
                  id="subject"
                  required
                  placeholder="Brief summary of the issue..."
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message <span className="text-red-500">*</span></Label>
                <Textarea
                  id="message"
                  required
                  placeholder="Provide detailed information here..."
                  className="resize-none h-32"
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                />
              </div>

              <DialogFooter className="mt-6">
                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-edu-600 hover:bg-edu-700">
                  {isSubmitting ? "Submitting..." : "Submit Request"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <Card key={i}>
              <CardContent className="p-5 flex gap-4">
                <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : reports.length === 0 ? (
        <Card className="border-dashed border-neutral-200">
          <CardContent className="py-20 text-center">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-neutral-400" />
            </div>
            <p className="text-[15px] font-bold text-neutral-900">No Reports Submitted</p>
            <p className="text-[13px] text-neutral-500 mt-1 max-w-sm mx-auto">
              You haven't submitted any requests or reports to the admin yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="p-5 pb-3 bg-neutral-50/50 flex-row items-start justify-between border-b border-neutral-100">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    {getStatusBadge(report.status)}
                    {getPriorityBadge(report.priority)}
                    <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 ml-2">
                      {report.category}
                    </span>
                  </div>
                  <h3 className="text-[16px] font-bold text-neutral-900">{report.subject}</h3>
                </div>
                <div className="text-[12px] text-neutral-400 whitespace-nowrap text-right">
                  {new Date(report.created_at).toLocaleDateString()}
                </div>
              </CardHeader>
              <CardContent className="p-5">
                <p className="text-[13px] text-neutral-600 whitespace-pre-wrap">{report.message}</p>
                
                {report.response && (
                  <div className="mt-4 p-4 bg-edu-50 rounded-lg border border-edu-100">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-edu-700 mb-1 flex items-center gap-1.5">
                      <MessageSquare className="w-3 h-3" />
                      Admin Response
                    </p>
                    <p className="text-[13px] text-edu-900">{report.response}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
