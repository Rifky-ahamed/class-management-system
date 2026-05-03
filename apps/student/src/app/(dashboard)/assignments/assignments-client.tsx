"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Upload, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

type Assignment = {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  status: "pending" | "submitted" | "graded";
  marksObtained?: number;
  totalMarks?: number;
  description: string;
};

export default function AssignmentsClient({ initialAssignments, studentId }: { initialAssignments: Assignment[], studentId: string }) {
  const supabase = createClient();
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionText, setSubmissionText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setSubmissionText("");
    setFile(null);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    if (!submissionText && !file) {
      toast.error("Please provide either text or a file for your submission.");
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Handle file upload to storage bucket when configured in the future
      let fileUrl = null;
      if (file) {
        fileUrl = `mock-upload/${file.name}`;
      }

      const payload = {
        assignment_id: selectedAssignment.id,
        student_id: studentId,
        status: "submitted",
        submission_content: submissionText || null,
        file_url: fileUrl,
        submitted_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from("assignment_submissions")
        .upsert(payload, { onConflict: "assignment_id,student_id" });

      if (error) throw error;

      setAssignments(assignments.map(a => 
        a.id === selectedAssignment.id ? { ...a, status: "submitted" } : a
      ));
      
      toast.success("Assignment submitted successfully!");
      setIsOpen(false);
    } catch (err: any) {
      toast.error("Failed to submit assignment: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="destructive" className="flex gap-1 items-center"><Clock className="w-3 h-3"/> Pending</Badge>;
      case "submitted": return <Badge variant="secondary" className="flex gap-1 items-center bg-blue-500/10 text-blue-600 hover:bg-blue-500/20"><CheckCircle2 className="w-3 h-3"/> Submitted</Badge>;
      case "graded": return <Badge variant="default" className="flex gap-1 items-center bg-green-500 hover:bg-green-600"><CheckCircle2 className="w-3 h-3"/> Graded</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
        <p className="text-muted-foreground mt-2">
          View pending and submitted assignments with deadlines.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {assignments.map((assignment) => (
          <Card key={assignment.id} className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <CardTitle className="text-lg leading-tight">{assignment.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{assignment.subject}</p>
                </div>
                {getStatusBadge(assignment.status)}
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <div>
                <p className="text-sm line-clamp-2 text-foreground mb-4">
                  {assignment.description}
                </p>
                {assignment.status === "graded" && (
                  <div className="mb-4 text-sm font-medium">
                    Score: <span className="text-green-600">{assignment.marksObtained} / {assignment.totalMarks}</span>
                  </div>
                )}
                <div className="text-sm text-muted-foreground mb-4">
                  Due: <span className="font-medium text-foreground">{assignment.dueDate}</span>
                </div>
              </div>

              <Dialog open={isOpen && selectedAssignment?.id === assignment.id} onOpenChange={(open) => {
                if (!open) setIsOpen(false);
                else handleOpen(assignment);
              }}>
                <DialogTrigger asChild>
                  <Button variant={assignment.status === "pending" ? "default" : "outline"} className="w-full">
                    {assignment.status === "pending" ? "Submit Assignment" : "View Details"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>{assignment.title}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <h4 className="text-sm font-medium mb-1 text-muted-foreground">Description</h4>
                      <p className="text-sm">{assignment.description}</p>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm border-y border-border py-2">
                      <span className="text-muted-foreground">Due Date:</span>
                      <span className="font-medium">{assignment.dueDate}</span>
                    </div>

                    {assignment.status === "pending" ? (
                      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                        <div className="space-y-2">
                          <Label htmlFor="submissionText">Your Answer (Optional if attaching file)</Label>
                          <Textarea 
                            id="submissionText" 
                            placeholder="Type your answer here..." 
                            className="min-h-[100px]"
                            value={submissionText}
                            onChange={(e) => setSubmissionText(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="fileUpload">Attach File (Optional if typing answer)</Label>
                          <Input 
                            id="fileUpload" 
                            type="file" 
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                          {isSubmitting ? "Submitting..." : "Confirm Submission"}
                        </Button>
                      </form>
                    ) : (
                      <div className="pt-2 space-y-4">
                        <div className="p-4 bg-muted/50 rounded-lg text-center">
                          <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                          <p className="font-medium">Assignment Submitted</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Your submission is currently being reviewed by your teacher.
                          </p>
                        </div>
                        {assignment.status === "graded" && (
                          <div className="p-4 border border-green-200 bg-green-50/50 dark:bg-green-500/10 rounded-lg">
                            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-green-700 dark:text-green-400">
                              Feedback & Grades
                            </h4>
                            <p className="text-sm">
                              Marks Obtained: <span className="font-bold">{assignment.marksObtained} / {assignment.totalMarks}</span>
                            </p>
                            <p className="text-sm mt-2 italic">
                              "Great work on the essay! Your explanation of covalent bonding was very clear."
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
