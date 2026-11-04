import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/auth";

export async function POST(req: Request) {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", req.url));
}
