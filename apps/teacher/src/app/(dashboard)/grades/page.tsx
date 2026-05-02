"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, FileSpreadsheet, Award } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

const supabase = createClient();

type Grade = {
  id: string;
  exam_name: string;
  marks_obtained: number;
  total_marks: number;
  created_at: string;
  batch_name: string;
  class_name: string;
  student_name: string;
};

type TeacherBatch = {
  id: string;
  name: string;
  class_name: string;
};

type EnrolledStudent = {
  id: string;
  name: string;
};

export default function GradesPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [batches, setBatches] = useState<TeacherBatch[]>([]);
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherId, setTeacherId] = useState<string | null>(null);

  // Form State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    batch_id: "",
    student_id: "",
    exam_name: "",
    marks_obtained: "",
    total_marks: "",
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

    // Fetch grades
    const { data: gradeData } = await supabase
      .from("exam_marks")
      .select(`
        id, exam_name, marks_obtained, total_marks, created_at,
        student:student_id ( name ),
        batch:batch_id (
          name,
          class:class_id ( class )
        )
      `)
      .eq("teacher_id", teacherData.id)
      .order("created_at", { ascending: false });

    if (gradeData) {
      setGrades(gradeData.map((g: any) => ({
        id: g.id,
        exam_name: g.exam_name,
        marks_obtained: g.marks_obtained,
        total_marks: g.total_marks,
        created_at: g.created_at,
        batch_name: g.batch?.name || "—",
        class_name: g.batch?.class?.class || "—",
        student_name: g.student?.name || "—",
      })));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch students when a batch is selected
  useEffect(() => {
    async function fetchStudents() {
      if (!formData.batch_id) {
        setStudents([]);
        return;
      }
      const { data } = await supabase
        .from("student_batch")
        .select(`
          student:student_id ( id, name )
        `)
        .eq("batch_id", formData.batch_id);

      if (data) {
        const mapped = data
          .filter((d: any) => d.student)
          .map((d: any) => ({
            id: d.student.id,
            name: d.student.name || "Unknown",
          }));
        setStudents(mapped.sort((a, b) => a.name.localeCompare(b.name)));
      }
    }
    fetchStudents();
  }, [formData.batch_id]);

  const handleCreateGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherId || !formData.batch_id || !formData.student_id || !formData.exam_name) return;

    setIsSubmitting(true);
    const payload = {
      batch_id: formData.batch_id,
      student_id: formData.student_id,
      teacher_id: teacherId,
      exam_name: formData.exam_name,
      marks_obtained: parseFloat(formData.marks_obtained),
      total_marks: parseFloat(formData.total_marks),
    };

    const { error } = await supabase.from("exam_marks").insert(payload);

    if (!error) {
      setIsDialogOpen(false);
      setFormData({ batch_id: "", student_id: "", exam_name: "", marks_obtained: "", total_marks: "" });
      fetchData();
    } else {
      console.error("Failed to add grade", error);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    const { error } = await supabase.from("exam_marks").delete().eq("id", id);
    if (!error) {
      setGrades(prev => prev.filter(g => g.id !== id));
    }
  };

  const getPercentage = (obtained: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((obtained / total) * 100);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Marks & Grades</h1>
          <p className="text-sm text-neutral-500 mt-1">Enter exam marks and internal assessment scores.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-edu-600 hover:bg-edu-700 text-white rounded-xl shadow-sm gap-2">
              <Plus className="w-4 h-4" />
              Add Marks
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Enter Student Marks</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateGrade} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="batch">Select Batch <span className="text-red-500">*</span></Label>
                <select
                  id="batch"
                  required
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={formData.batch_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, batch_id: e.target.value, student_id: "" }))}
                >
                  <option value="" disabled>Select a batch...</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.class_name})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="student">Select Student <span className="text-red-500">*</span></Label>
                <select
                  id="student"
                  required
                  disabled={!formData.batch_id || students.length === 0}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
                  value={formData.student_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, student_id: e.target.value }))}
                >
                  <option value="" disabled>
                    {!formData.batch_id ? "Select a batch first" : students.length === 0 ? "No students in batch" : "Select a student..."}
                  </option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="exam">Exam / Assessment Name <span className="text-red-500">*</span></Label>
                <Input
                  id="exam"
                  required
                  placeholder="e.g. Midterm 1"
                  value={formData.exam_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, exam_name: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="obtained">Marks Obtained <span className="text-red-500">*</span></Label>
                  <Input
                    id="obtained"
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={formData.marks_obtained}
                    onChange={(e) => setFormData(prev => ({ ...prev, marks_obtained: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total">Total Marks <span className="text-red-500">*</span></Label>
                  <Input
                    id="total"
                    type="number"
                    step="0.1"
                    min="1"
                    required
                    value={formData.total_marks}
                    onChange={(e) => setFormData(prev => ({ ...prev, total_marks: e.target.value }))}
                  />
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-edu-600 hover:bg-edu-700">
                  {isSubmitting ? "Saving..." : "Save Marks"}
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
                <Skeleton className="h-10 w-full rounded-md mt-4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : grades.length === 0 ? (
        <Card className="border-dashed border-neutral-200">
          <CardContent className="py-20 text-center">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileSpreadsheet className="w-8 h-8 text-neutral-400" />
            </div>
            <p className="text-[15px] font-bold text-neutral-900">No Grades Recorded</p>
            <p className="text-[13px] text-neutral-500 mt-1 max-w-sm mx-auto">
              You haven't entered any marks yet. Click the button above to add exam scores for your students.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {grades.map((grade) => {
            const percentage = getPercentage(grade.marks_obtained, grade.total_marks);
            let colorClass = "bg-green-50 text-green-700 border-green-200";
            if (percentage < 40) colorClass = "bg-red-50 text-red-700 border-red-200";
            else if (percentage < 75) colorClass = "bg-amber-50 text-amber-700 border-amber-200";

            return (
              <Card key={grade.id} className="flex flex-col hover:shadow-md transition-all group">
                <CardHeader className="px-5 py-4 border-b border-neutral-100 bg-neutral-50/50 flex-row items-start justify-between space-y-0">
                  <div className="flex flex-col gap-1.5">
                    <Badge variant="outline" className="w-fit bg-white text-edu-700 border-edu-200 text-[10px]">
                      {grade.class_name} • {grade.batch_name}
                    </Badge>
                    <h3 className="text-[15px] font-bold text-neutral-900 leading-tight">
                      {grade.student_name}
                    </h3>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-neutral-400 hover:text-red-600 hover:bg-red-50 -mr-2 -mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDelete(grade.id)}
                    title="Delete Record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-4">
                    <Award className="w-4 h-4 text-neutral-400" />
                    <span className="text-[13px] font-medium text-neutral-600">{grade.exam_name}</span>
                  </div>
                  
                  <div className="mt-auto flex items-end justify-between">
                    <div>
                      <p className="text-[11px] text-neutral-500 font-medium mb-1">Score</p>
                      <p className="text-2xl font-black text-neutral-900 font-mono tracking-tighter">
                        {grade.marks_obtained}<span className="text-sm text-neutral-400 font-medium tracking-normal">/{grade.total_marks}</span>
                      </p>
                    </div>
                    <div className={`px-3 py-1.5 rounded-lg border font-bold text-[15px] ${colorClass}`}>
                      {percentage}%
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
