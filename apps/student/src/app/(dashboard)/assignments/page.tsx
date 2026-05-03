import { getAssignments, getStudentProfile } from "@/features/student/student.service";
import AssignmentsClient from "./assignments-client";
import { redirect } from "next/navigation";

export default async function AssignmentsPage() {
  const assignments = await getAssignments();
  const profileData = await getStudentProfile();

  if (assignments === null || !profileData?.profile?.id) {
    redirect("/auth/login");
  }

  return <AssignmentsClient initialAssignments={assignments} studentId={profileData.profile.id} />;
}
