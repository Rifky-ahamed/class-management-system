import { createClient } from "@/lib/supabase/server";

/**
 * Gets the authenticated student's profile from the database.
 * Matches the authenticated user's email against the student table.
 */
export async function getStudentProfile() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) return null;

  // Find student by email
  const { data: student, error } = await supabase
    .from("student")
    .select(`
      *,
      student_batch(
        batch_id,
        enrolled_at,
        batch(
          id,
          name,
          class(class)
        )
      )
    `)
    .eq("email", user.email)
    .single();

  if (error) {
    console.error("Error fetching student profile:", error.message);
    return null;
  }

  return { authUser: user, profile: student };
}

/**
 * Gets data for the student dashboard.
 */
export async function getStudentDashboard() {
  const profileData = await getStudentProfile();
  if (!profileData?.profile) return null;

  const { profile } = profileData;
  const batchId = profile.student_batch?.[0]?.batch_id;
  
  const supabase = await createClient();

  // 1. Fetch Today's Classes
  const today = new Date().getDay(); // 0 is Sunday, 1 is Monday...
  let todayClasses: any[] = [];
  if (batchId) {
    const { data } = await supabase
      .from("class_schedule")
      .select("*, teachers(name)")
      .eq("batch_id", batchId)
      .eq("day_of_week", today)
      .eq("is_active", true)
      .order("start_time");
    todayClasses = data || [];
  }

  // 2. Fetch Recent Notices
  let notices: any[] = [];
  const { data: noticeData } = await supabase
    .from("notices")
    .select("*")
    .or(`target_audience.eq.all,target_audience.eq.students,target_batch_id.eq.${batchId || '00000000-0000-0000-0000-000000000000'}`)
    .order("created_at", { ascending: false })
    .limit(5);
  notices = noticeData || [];

  // 3. Fetch Recent Exam Marks
  let recentExams: any[] = [];
  const { data: examData } = await supabase
    .from("exam_marks")
    .select("*")
    .eq("student_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(5);
  recentExams = examData || [];

  return { todayClasses, notices, recentExams, profile };
}

export async function getStudentSchedule() {
  const profileData = await getStudentProfile();
  if (!profileData?.profile) return null;
  const batchId = profileData.profile.student_batch?.[0]?.batch_id;
  if (!batchId) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("class_schedule")
    .select("*, teachers(name)")
    .eq("batch_id", batchId)
    .eq("is_active", true)
    .order("day_of_week")
    .order("start_time");

  return data || [];
}

export async function getStudentAttendance() {
  const profileData = await getStudentProfile();
  if (!profileData?.profile) return [];

  const supabase = await createClient();
  const { data: records, error } = await supabase
    .from("attendance_record")
    .select(`
      status,
      attendance_session (
        schedule_id,
        class_schedule (
          teachers (
            name
          )
        )
      )
    `)
    .eq("student_id", profileData.profile.id);

  if (error || !records) {
    console.error("Error fetching attendance:", error?.message);
    return [];
  }

  // Group by "Subject" (using teacher name or "General Class" as a proxy)
  const statsMap = new Map<string, { present: number; total: number }>();

  records.forEach((record: any) => {
    const session = record.attendance_session;
    // @ts-ignore
    const teacherName = session?.class_schedule?.teachers?.name || "General Class";
    
    if (!statsMap.has(teacherName)) {
      statsMap.set(teacherName, { present: 0, total: 0 });
    }

    const stat = statsMap.get(teacherName)!;
    stat.total += 1;
    
    // Consider 'present' and 'late' as attended for percentage purposes
    if (record.status === 'present' || record.status === 'late') {
      stat.present += 1;
    }
  });

  const result = Array.from(statsMap.entries()).map(([subject, stat]) => {
    const percentage = stat.total > 0 ? Math.round((stat.present / stat.total) * 100) : 0;
    return {
      subject,
      present: stat.present,
      total: stat.total,
      percentage
    };
  });

  return result;
}

export async function getAssignments() {
  const profileData = await getStudentProfile();
  if (!profileData?.profile) return null;
  const batchId = profileData.profile.student_batch?.[0]?.batch_id;
  
  const supabase = await createClient();
  // Fetch assignments targeting the batch
  let assignments: any[] = [];
  if (batchId) {
    const { data: batchAssignments } = await supabase
      .from("assignments")
      .select("*")
      .eq("batch_id", batchId)
      .order("due_date", { ascending: true });
    
    if (batchAssignments && batchAssignments.length > 0) {
      // Fetch submissions for this student
      const { data: submissions } = await supabase
        .from("assignment_submissions")
        .select("*")
        .eq("student_id", profileData.profile.id);

      const submissionMap = new Map();
      if (submissions) {
        submissions.forEach(sub => submissionMap.set(sub.assignment_id, sub));
      }

      assignments = batchAssignments.map(a => {
        const sub = submissionMap.get(a.id);
        return {
          id: a.id,
          title: a.title,
          subject: "General", // If assignments have subject_id, map it
          dueDate: new Date(a.due_date).toLocaleDateString(),
          status: sub ? sub.status : "pending",
          marksObtained: sub?.marks_obtained,
          totalMarks: a.total_marks,
          description: a.description
        };
      });
    }
  }

  return assignments;
}

export async function getStudyMaterials() {
  const profileData = await getStudentProfile();
  if (!profileData?.profile) return [];
  const batchId = profileData.profile.student_batch?.[0]?.batch_id;
  if (!batchId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("study_materials")
    .select("*, teachers(name)")
    .eq("batch_id", batchId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching study materials:", error);
  }

  return data || [];
}

export async function getExamResults() {
  const profileData = await getStudentProfile();
  if (!profileData?.profile) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("exam_marks")
    .select("*")
    .eq("student_id", profileData.profile.id)
    .order("created_at", { ascending: false });

  return data || [];
}

export async function getStudentPayments() {
  const profileData = await getStudentProfile();
  if (!profileData?.profile) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("student_payment")
    .select("*")
    .eq("student_id", profileData.profile.id)
    .order("payment_date", { ascending: false });

  return data || [];
}

export async function getNotices() {
  const profileData = await getStudentProfile();
  if (!profileData?.profile) return [];
  const batchId = profileData.profile.student_batch?.[0]?.batch_id;

  const supabase = await createClient();
  const { data } = await supabase
    .from("notices")
    .select("*")
    .or(`target_audience.eq.all,target_audience.eq.students,target_batch_id.eq.${batchId || '00000000-0000-0000-0000-000000000000'}`)
    .order("created_at", { ascending: false });

  return data || [];
}
