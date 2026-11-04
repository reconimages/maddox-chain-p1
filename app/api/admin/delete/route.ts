import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminRequest } from "@/lib/admin";

export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const albumId = body?.albumId;
  if (!albumId) {
    return NextResponse.json({ error: "albumId required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: album } = await supabase
    .from("albums")
    .select("cover_path")
    .eq("id", albumId)
    .single();
  const { data: tracks } = await supabase
    .from("tracks")
    .select("storage_path")
    .eq("album_id", albumId);

  // delete audio objects
  const audioPaths = (tracks || []).map((t: any) => t.storage_path).filter(Boolean);
  if (audioPaths.length) {
    try { await supabase.storage.from("audio").remove(audioPaths); } catch {}
  }
  // delete cover
  if (album?.cover_path) {
    try { await supabase.storage.from("covers").remove([album.cover_path]); } catch {}
  }
  // delete album row (cascade tracks)
  const { error } = await supabase.from("albums").delete().eq("id", albumId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
