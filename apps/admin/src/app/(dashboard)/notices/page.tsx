"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DialogTrigger, DialogFooter
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Plus, Megaphone, Trash2 } from "lucide-react";

const supabase = createClient();

type Notice = {
  id: string;
  title: string;
  content: string;
  target_audience: "all" | "teachers" | "students" | "batch";
  target_batch_id: string | null;
  created_at: string;
  batch?: { name: string; class?: { class: string } } | null;
};

type Batch = {
  id: string;
  name: string;
  class: { class: string } | null;
};

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    target_audience: "all",
    target_batch_id: "none",
  });

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<Notice | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);

    // Fetch batches for the dropdown
    const { data: batchData } = await supabase
      .from("batch")
      .select("id, name, class(class)")
      .order("name");

    if (batchData) setBatches(batchData as unknown as Batch[]);

    // Fetch notices
    const { data: noticeData, error } = await supabase
      .from("notices")
      .select(`
        id, title, content, target_audience, target_batch_id, created_at,
        batch:target_batch_id ( name, class(class) )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch notices");
    } else if (noticeData) {
      setNotices(noticeData as unknown as Notice[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (formData.target_audience === "batch" && (!formData.target_batch_id || formData.target_batch_id === "none")) {
      toast.error("Please select a target batch.");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      title: formData.title,
      content: formData.content,
      target_audience: formData.target_audience,
      target_batch_id: formData.target_audience === "batch" ? formData.target_batch_id : null,
    };

    const { error } = await supabase.from("notices").insert(payload);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Notice published successfully");
      setIsDialogOpen(false);
      setFormData({ title: "", content: "", target_audience: "all", target_batch_id: "none" });
      fetchData();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    const { error } = await supabase
      .from("notices")
      .delete()
      .eq("id", deleteTarget.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Notice deleted");
      fetchData();
    }

    setDeleting(false);
    setDeleteTarget(null);
  };

  const getAudienceLabel = (notice: Notice) => {
    switch (notice.target_audience) {
      case "all": return "General";
      case "teachers": return "Teachers Only";
      case "students": return "Students Only";
      case "batch": return `Batch: ${notice.batch?.class?.class} - ${notice.batch?.name}`;
      default: return notice.target_audience;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Manage Notices</h1>
          <p className="text-sm text-neutral-500 mt-1">Publish announcements to teachers, students, or specific batches.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-edu-600 hover:bg-edu-700 text-white rounded-xl shadow-sm gap-2">
              <Plus className="w-4 h-4" />
              New Notice
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Publish New Notice</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateNotice} className="space-y-4 mt-4">
              
              <div className="space-y-2">
                <Label htmlFor="title">Notice Title <span className="text-red-500">*</span></Label>
                <Input
                  id="title"
                  required
                  placeholder="e.g. Holiday Announcement"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Target Audience <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.target_audience}
                  onValueChange={(val) => setFormData(prev => ({ ...prev, target_audience: val }))}
                >
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select Audience" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Everyone (General)</SelectItem>
                    <SelectItem value="teachers">Teachers Only</SelectItem>
                    <SelectItem value="students">Students Only</SelectItem>
                    <SelectItem value="batch">Specific Batch</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.target_audience === "batch" && (
                <div className="space-y-2">
                  <Label>Select Batch <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.target_batch_id}
                    onValueChange={(val) => setFormData(prev => ({ ...prev, target_batch_id: val }))}
                  >
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select Batch" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" disabled>Select a batch...</SelectItem>
                      {batches.map(b => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.class?.class} - {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="content">Notice Content <span className="text-red-500">*</span></Label>
                <Textarea
                  id="content"
                  required
                  placeholder="Detailed announcement text..."
                  className="resize-none h-32"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                />
              </div>

              <DialogFooter className="mt-6 pt-4 border-t border-neutral-100">
                <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-edu-600 hover:bg-edu-700">
                  {isSubmitting ? "Publishing..." : "Publish Notice"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="px-5 py-3.5 border-b border-neutral-100 flex-row items-center gap-3 space-y-0">
          <span className="text-[13px] font-bold text-neutral-900">Published Notices</span>
          <span className="font-mono text-[11px] bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full">
            {notices.length} records
          </span>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
            </div>
          ) : notices.length === 0 ? (
            <div className="py-14 text-center">
              <p className="text-3xl opacity-30 mb-2"><Megaphone className="mx-auto text-neutral-400" size={32} /></p>
              <p className="text-[13px] text-neutral-500">No notices have been published yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                    <TableHead className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">Title</TableHead>
                    <TableHead className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">Audience</TableHead>
                    <TableHead className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">Content</TableHead>
                    <TableHead className="font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500 whitespace-nowrap">Date Published</TableHead>
                    <TableHead className="text-right font-mono text-[10px] tracking-[1.5px] uppercase text-neutral-500">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notices.map((notice) => (
                    <TableRow key={notice.id}>
                      <TableCell>
                        <p className="font-semibold text-[13px] text-neutral-900">{notice.title}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-[10px] bg-neutral-50 whitespace-nowrap">
                          {getAudienceLabel(notice)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-[12px] text-neutral-500 max-w-xs truncate" title={notice.content}>
                          {notice.content}
                        </p>
                      </TableCell>
                      <TableCell className="font-mono text-[11px] text-neutral-500 whitespace-nowrap">
                        {new Date(notice.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost" 
                          size="icon"
                          className="text-danger-500 hover:text-danger-600 hover:bg-danger-50"
                          onClick={() => setDeleteTarget(notice)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="w-11 h-11 rounded-xl bg-danger-100 border border-danger-500/20 grid place-items-center text-xl mb-1">⚠</div>
            <AlertDialogTitle>Delete Notice?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the notice &ldquo;<strong className="text-foreground">{deleteTarget?.title}</strong>&rdquo;?
              This will remove it from all teacher and student panels permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger-500 hover:bg-danger-600 text-white"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete Notice"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
