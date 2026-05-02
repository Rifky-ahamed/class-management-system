"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const supabase = createClient();

type EnrolledStudent = {
  id: string;
  name: string;
  email: string;
};

type BatchDetails = {
  id: string;
  name: string;
  class_name: string;
  subject_name: string | null;
  students: EnrolledStudent[];
  is_active: boolean;
};

export default function ClassesPage() {
  const [batches, setBatches] = useState<BatchDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClasses = useCallback(async () => {
    setLoading(true);

    // 1. Get logged-in user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user?.email) {
      console.error("Auth error:", authError);
      setLoading(false);
      return;
    }

    // 2. Get teacher ID
    const { data: teacherData, error: teacherError } = await supabase
      .from("teachers")
      .select("id")
      .eq("email", user.email)
      .single();

    if (teacherError || !teacherData) {
      console.error("Teacher fetch error:", teacherError);
      setLoading(false);
      return;
    }

    const tid = teacherData.id;

    // 3. Fetch batches for this teacher
    const { data: batchData, error: batchError } = await supabase
      .from("batch")
      .select(`
        id, name, is_active,
        class:class_id ( class ),
        subject:subject_id ( name )
      `)
      .eq("teacher_id", tid)
      .order("name");

    if (batchError || !batchData) {
      console.error("Batch fetch error:", batchError);
      setLoading(false);
      return;
    }

    const batchIds = batchData.map((b: any) => b.id);

    // 4. Fetch students for these batches
    const { data: studentBatchData, error: sbError } = await supabase
      .from("student_batch")
      .select(`
        batch_id,
        student:student_id ( id, name, email )
      `)
      .in("batch_id", batchIds);

    if (sbError) {
      console.error("Student fetch error:", sbError);
    }

    // Map students by batch
    const studentMap = new Map<string, EnrolledStudent[]>();
    batchIds.forEach((id: string) => studentMap.set(id, []));

    (studentBatchData || []).forEach((sb: any) => {
      if (sb.student && studentMap.has(sb.batch_id)) {
        studentMap.get(sb.batch_id)!.push({
          id: sb.student.id,
          name: sb.student.name || "Unknown",
          email: sb.student.email || "—",
        });
      }
    });

    const formattedBatches: BatchDetails[] = batchData.map((b: any) => ({
      id: b.id,
      name: b.name,
      class_name: b.class?.class || "—",
      subject_name: b.subject?.name || null,
      is_active: b.is_active,
      students: (studentMap.get(b.id) || []).sort((x, y) => x.name.localeCompare(y.name)),
    }));

    setBatches(formattedBatches);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-neutral-900 tracking-tight">My Subjects & Classes</h1>
        <p className="text-sm text-neutral-500 mt-1">View your assigned subjects, class batches, and enrolled student lists.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-5 space-y-4">
                <Skeleton className="h-6 w-3/4 rounded-md" />
                <Skeleton className="h-4 w-1/2 rounded-md" />
                <Skeleton className="h-10 w-full rounded-md mt-4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : batches.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-4xl mb-3 opacity-30">📚</p>
            <p className="text-[14px] font-semibold text-neutral-600">No batches assigned yet.</p>
            <p className="text-[12px] text-neutral-400 mt-1">Contact the administrator if you believe this is a mistake.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {batches.map((batch) => (
            <Card key={batch.id} className={`flex flex-col hover:shadow-md transition-shadow ${!batch.is_active ? 'opacity-70' : ''}`}>
              <CardHeader className="px-5 py-4 border-b border-neutral-100 flex-row items-start justify-between space-y-0">
                <div>
                  <h3 className="text-[16px] font-bold text-neutral-900 leading-tight">{batch.name}</h3>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-[10px] font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200 px-2 py-0.5 rounded-full">
                      {batch.class_name}
                    </span>
                    {batch.subject_name && (
                      <span className="text-[10px] font-semibold bg-edu-50 text-edu-700 border border-edu-200/70 px-2 py-0.5 rounded-full">
                        {batch.subject_name}
                      </span>
                    )}
                  </div>
                </div>
                {!batch.is_active && (
                  <Badge variant="outline" className="bg-neutral-50 text-neutral-500 border-neutral-200 text-[9px] uppercase">
                    Inactive
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="p-5 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-neutral-500">
                    <span className="text-lg opacity-50">👥</span>
                    <span className="text-[13px] font-medium">{batch.students.length} students enrolled</span>
                  </div>
                </div>

                <div className="mt-auto pt-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full justify-between group">
                        View Student List
                        <span className="text-neutral-400 group-hover:text-neutral-900 transition-colors">→</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-bold">{batch.name} Students</DialogTitle>
                        <p className="text-[13px] text-neutral-500 mt-1">{batch.class_name} {batch.subject_name ? `· ${batch.subject_name}` : ''}</p>
                      </DialogHeader>
                      
                      <div className="flex-1 overflow-y-auto mt-4 pr-2">
                        {batch.students.length === 0 ? (
                          <div className="py-10 text-center">
                            <p className="text-[13px] text-neutral-500">No students enrolled in this batch.</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-neutral-100 border border-neutral-100 rounded-lg">
                            {batch.students.map((student, idx) => (
                              <div key={student.id} className="p-3 flex items-center gap-3 hover:bg-neutral-50 transition-colors">
                                <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-[10px] font-bold text-neutral-400 flex-shrink-0">
                                  {idx + 1}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[13px] font-semibold text-neutral-900 truncate">{student.name}</p>
                                  <p className="text-[11px] text-neutral-400 truncate">{student.email}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
