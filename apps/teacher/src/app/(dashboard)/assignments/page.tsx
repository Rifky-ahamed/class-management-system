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
import { CalendarIcon, Trash2, Plus, FileText, CheckCircle2, Search } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

type Submission = {
  id: string;
  assignment_id: string;
  student_id: string;
  status: "pending" | "submitted" | "graded";
  submission_content: string | null;
  file_url: string | null;
  marks_obtained: number | null;
  feedback: string | null;
  submitted_at: string | null;
  student_name: string;
  assignment_title: string;
  batch_name: string;
};

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [batches, setBatches] = useState<TeacherBatch[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
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

  // Grading State
  const [gradingSub, setGradingSub] = useState<Submission | null>(null);
  const [marks, setMarks] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isGrading, setIsGrading] = useState(false);

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

    // Fetch batches
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

      // Fetch Submissions for these assignments
      const assignIds = assignData.map(a => a.id);
      if (assignIds.length > 0) {
        const { data: subsData } = await supabase
          .from("assignment_submissions")
          .select(`
            *,
            student:student_id ( name ),
            assignment:assignment_id ( title, batch:batch_id ( name ) )
          `)
          .in("assignment_id", assignIds)
          .order("submitted_at", { ascending: false });

        if (subsData) {
          setSubmissions(subsData.map((s: any) => ({
            ...s,
            student_name: s.student?.name || "Unknown",
            assignment_title: s.assignment?.title || "Unknown",
            batch_name: s.assignment?.batch?.name || "Unknown"
          })));
        }
      } else {
        setSubmissions([]);
      }
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
      toast.success("Assignment created!");
    } else {
      toast.error("Failed to create assignment");
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return;
    const { error } = await supabase.from("assignments").delete().eq("id", id);
    if (!error) {
      setAssignments(prev => prev.filter(a => a.id !== id));
      toast.success("Assignment deleted");
    } else {
      toast.error("Failed to delete assignment");
    }
  };

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSub || !marks) return;
    setIsGrading(true);

    const { error } = await supabase.from("assignment_submissions").update({
      status: "graded",
      marks_obtained: parseFloat(marks),
      feedback: feedback || null,
      graded_at: new Date().toISOString()
    }).eq("id", gradingSub.id);

    if (error) {
      toast.error("Failed to submit grades");
    } else {
      toast.success("Submission graded successfully!");
      setGradingSub(null);
      fetchData();
    }
    setIsGrading(false);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Assignments</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage tasks and review student submissions.</p>
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

      <Tabs defaultValue="assignments" className="space-y-6">
        <TabsList className="bg-neutral-100 p-1 rounded-lg">
          <TabsTrigger value="assignments" className="font-mono text-[11px] tracking-[1.5px] uppercase px-5 py-2">
            All Assignments
          </TabsTrigger>
          <TabsTrigger value="submissions" className="font-mono text-[11px] tracking-[1.5px] uppercase px-5 py-2">
            Submissions
            {submissions.filter(s => s.status === 'submitted').length > 0 && (
              <Badge variant="default" className="ml-2 h-4 px-1.5 text-[9px] bg-edu-600">
                {submissions.filter(s => s.status === 'submitted').length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="mt-0">
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
        </TabsContent>

        <TabsContent value="submissions" className="mt-0">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-neutral-500">Loading submissions...</div>
              ) : submissions.length === 0 ? (
                <div className="py-20 text-center">
                  <CheckCircle2 className="w-12 h-12 text-neutral-200 mx-auto mb-3" />
                  <p className="text-neutral-500">No student submissions found yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-neutral-50">
                    <TableRow>
                      <TableHead className="font-mono text-[10px] uppercase tracking-wider">Student</TableHead>
                      <TableHead className="font-mono text-[10px] uppercase tracking-wider">Assignment</TableHead>
                      <TableHead className="font-mono text-[10px] uppercase tracking-wider">Batch</TableHead>
                      <TableHead className="font-mono text-[10px] uppercase tracking-wider">Status</TableHead>
                      <TableHead className="font-mono text-[10px] uppercase tracking-wider">Submitted</TableHead>
                      <TableHead className="text-right font-mono text-[10px] uppercase tracking-wider">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium text-neutral-900">{sub.student_name}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={sub.assignment_title}>{sub.assignment_title}</TableCell>
                        <TableCell><Badge variant="secondary" className="font-normal">{sub.batch_name}</Badge></TableCell>
                        <TableCell>
                          <Badge variant={sub.status === 'graded' ? 'default' : 'outline'} className={
                            sub.status === 'submitted' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                            sub.status === 'graded' ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : ''
                          }>
                            {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-neutral-500">
                          {sub.submitted_at ? format(new Date(sub.submitted_at), "MMM d, h:mm a") : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-edu-600 hover:text-edu-700 hover:bg-edu-50"
                            onClick={() => {
                              setGradingSub(sub);
                              setMarks(sub.marks_obtained ? String(sub.marks_obtained) : "");
                              setFeedback(sub.feedback || "");
                            }}
                          >
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Grading Modal */}
      <Dialog open={!!gradingSub} onOpenChange={(open) => !open && setGradingSub(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Submission</DialogTitle>
          </DialogHeader>
          
          {gradingSub && (
            <div className="space-y-6 mt-2">
              <div className="grid grid-cols-2 gap-4 p-4 bg-neutral-50 rounded-lg text-sm border border-neutral-100">
                <div>
                  <span className="text-neutral-500 block text-xs uppercase tracking-wider mb-1">Student</span>
                  <span className="font-semibold">{gradingSub.student_name}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-xs uppercase tracking-wider mb-1">Assignment</span>
                  <span className="font-semibold line-clamp-1" title={gradingSub.assignment_title}>{gradingSub.assignment_title}</span>
                </div>
              </div>

              <div>
                <Label className="text-xs uppercase tracking-wider text-neutral-500 mb-2 block">Student's Answer</Label>
                <div className="p-4 bg-white border border-neutral-200 rounded-lg min-h-[120px] text-sm whitespace-pre-wrap shadow-inner">
                  {gradingSub.submission_content || <span className="text-neutral-400 italic">No text provided.</span>}
                </div>
              </div>

              {gradingSub.file_url && (
                <div>
                  <Label className="text-xs uppercase tracking-wider text-neutral-500 mb-2 block">Attached File</Label>
                  <div className="p-3 border border-neutral-200 rounded-lg flex items-center justify-between bg-neutral-50">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <span className="text-sm truncate font-medium">{gradingSub.file_url.split('/').pop()}</span>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      {/* TODO: Update href when storage is configured */}
                      <a href="#" target="_blank" rel="noreferrer">Download</a>
                    </Button>
                  </div>
                </div>
              )}

              <form onSubmit={handleGradeSubmit} className="space-y-4 pt-4 border-t border-neutral-100">
                <h3 className="font-bold text-neutral-900">Grading</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="marks">Marks Obtained <span className="text-red-500">*</span></Label>
                  <Input 
                    id="marks" 
                    type="number" 
                    placeholder="e.g. 85" 
                    required
                    value={marks}
                    onChange={(e) => setMarks(e.target.value)}
                    className="max-w-[150px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feedback">Feedback for Student</Label>
                  <Textarea 
                    id="feedback" 
                    placeholder="Great job on the introduction! However..." 
                    className="h-24 resize-none"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setGradingSub(null)}>Cancel</Button>
                  <Button type="submit" className="bg-edu-600 hover:bg-edu-700" disabled={isGrading}>
                    {isGrading ? "Saving..." : "Save Grade"}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
