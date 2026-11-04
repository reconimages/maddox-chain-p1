import { redirect } from "next/navigation";
import { isAdminRequest } from "@/lib/admin";
import AdminDashboard from "@/components/AdminDashboard";

export default async function AdminPage() {
  if (!(await isAdminRequest())) redirect("/admin/login");
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data: albums } = await supabase
    .from("albums")
    .select("id,title,release_year,created_at,tracks(count)")
    .order("created_at", { ascending: false });
  return <AdminDashboard albums={(albums || []) as any} />;
}
