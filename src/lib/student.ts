// Student identity comes from the RLS-protected profiles table — never browser storage.
import { supabase } from "@/integrations/supabase/client";

export type StudentInfo = { name: string; cls: string };

export async function getStudentInfo(): Promise<StudentInfo> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { name: "Student", cls: "5" };
  const { data } = await supabase
    .from("profiles")
    .select("full_name, class_level")
    .eq("id", auth.user.id)
    .maybeSingle();
  return {
    name: data?.full_name || "Student",
    cls: String(data?.class_level ?? 5),
  };
}
