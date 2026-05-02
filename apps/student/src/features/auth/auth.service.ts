import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const checkStudentAccess = async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return user;
};

export { checkStudentAccess };