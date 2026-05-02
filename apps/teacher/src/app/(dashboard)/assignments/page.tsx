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
import { CalendarIcon, Trash2, Plus, FileText } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

const supabase = createClient();

type Assignment = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  created_at: string;
  batch_name: string;
  class_name: string;
};

type TeacherBatch = {
  id: string;
  name: string;
  class_name: string;
};

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [batches, setBatches] = useState<TeacherBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherId, setTeacherId] = useState<string | null>(null);

  // Form State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: "",
    batch_id: "",
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

    // Fetch batches for the dropdown
    const { data: batchData } = await supabase
      .from("batch")
      .select(`
        id, name,
        class:class_id ( class )
      `)
      .eq("teacher_id", teacherData.id)
      .eq("is_active", true)
      .order("name");

    if (batchData) {
      setBatches(batchData.map((b: any) => ({
        id: b.id,
        name: b.name,
        class_name: b.class?.class || "Unknown",
      })));
    }

    // Fetch assignments
    const { data: assignData } = await supabase
      .from("assignments")
      .select(`
        id, title, description, due_date, created_at,
        batch:batch_id (
          name,
          class:class_id ( class )
        )
      `)
      .eq("teacher_id", teacherData.id)
      .order("created_at", { ascending: false });

    if (assignData) {
      setAssignments(assignData.map((a: any) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        due_date: a.due_date,
        created_at: a.created_at,
        batch_name: a.batch?.name || "—",
        class_name: a.batch?.class?.class || "—",
      })));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherId || !formData.title || !formData.batch_id) return;

    setIsSubmitting(true);
    const payload = {
      title: formData.title,
      description: formData.description || null,
      due_date: formData.due_date || null,
      batch_id: formData.batch_id,
      teacher_id: teacherId,
    };

    const { error } = await supabase.from("assignments").insert(payload);

    if (!error) {
      setIsDialogOpen(false);
      setFormData({ title: "", description: "", due_date: "", batch_id: "" });
      fetchData(); // Refresh list
    } else {
      console.error("Failed to create assignment", error);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return;
    const { error } = await supabase.from("assignments").delete().eq("id", id);
    if (!error) {
      setAssignments(prev => prev.filter(a => a.id !== id));
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Assignments</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage and assign tasks to your batches.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-edu-600 hover:bg-edu-700 text-white rounded-xl shadow-sm gap-2">
              <Plus className="w-4 h-4" />
              New Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Assignment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateAssignment} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="batch">Select Batch <span className="text-red-500">*</span></Label>
                <select
                  id="batch"
                  required
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.batch_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, batch_id: e.target.value }))}
                >
                  <option value="" disabled>Select a batch...</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.class_name})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
                <Input
                  id="title"
                  required
                  placeholder="e.g. Chapter 1 Math Homework"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description (Optional)</Label>
                <Textarea
                  id="desc"
                  placeholder="Provide instructions or details..."
                  className="resize-none h-24"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date (Optional)</Label>
                <Input
                  id="dueDate"
                  type="datetime-local"
                  value={formData.due_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                />
              </div>
              <DialogFooter className="mt-6">
                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-edu-600 hover:bg-edu-700">
                  {isSubmitting ? "Creating..." : "Create Assignment"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-5 w-3/4 rounded-md mb-2" />
                <Skeleton className="h-4 w-1/2 rounded-md mb-6" />
                <Skeleton className="h-16 w-full rounded-md" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <Card className="border-dashed border-neutral-200">
          <CardContent className="py-20 text-center">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-neutral-400" />
            </div>
            <p className="text-[15px] font-bold text-neutral-900">No Assignments Yet</p>
            <p className="text-[13px] text-neutral-500 mt-1 max-w-sm mx-auto">
              You haven't created any assignments. Click the button above to assign tasks to your students.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {assignments.map((assignment) => (
            <Card key={assignment.id} className="flex flex-col hover:shadow-md transition-all group">
              <CardHeader className="px-5 py-4 border-b border-neutral-100 bg-neutral-50/50 flex-row items-start justify-between space-y-0">
                <div className="flex flex-col gap-1.5">
                  <Badge variant="outline" className="w-fit bg-white text-edu-700 border-edu-200 text-[10px]">
                    {assignment.class_name} • {assignment.batch_name}
                  </Badge>
                  <h3 className="text-[15px] font-bold text-neutral-900 leading-tight line-clamp-2" title={assignment.title}>
                    {assignment.title}
                  </h3>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-neutral-400 hover:text-red-600 hover:bg-red-50 -mr-2 -mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(assignment.id)}
                  title="Delete Assignment"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="p-5 flex flex-col flex-1">
                <p className="text-[13px] text-neutral-600 line-clamp-3 flex-1 mb-4">
                  {assignment.description || <span className="italic text-neutral-400">No description provided.</span>}
                </p>
                
                <div className="pt-4 border-t border-neutral-100 mt-auto flex items-center justify-between text-[11px] text-neutral-500 font-medium">
                  <div className="flex items-center gap-1.5" title="Due Date">
                    <CalendarIcon className="w-3.5 h-3.5 text-neutral-400" />
                    {assignment.due_date ? (
                      <span className={new Date(assignment.due_date) < new Date() ? "text-red-600 font-bold" : ""}>
                        Due: {format(new Date(assignment.due_date), "MMM d, h:mm a")}
                      </span>
                    ) : (
                      "No due date"
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
