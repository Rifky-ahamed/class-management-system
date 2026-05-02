import { getAssignments } from "@/features/student/student.service";
import AssignmentsClient from "./assignments-client";
import { redirect } from "next/navigation";

export default async function AssignmentsPage() {
  const assignments = await getAssignments();

  if (assignments === null) {
    redirect("/auth/login");
  }

  return <AssignmentsClient initialAssignments={assignments} />;
}
