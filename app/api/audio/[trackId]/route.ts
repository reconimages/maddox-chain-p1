import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ trackId: string }> }
) {
  const { trackId } = await params;
  const supabase = await createClient();
  const { data: track, error } = await supabase
    .from("tracks")
    .select("storage_path")
    .eq("id", trackId)
    .single();

  if (error || !track) {
    return new NextResponse("Not found", { status: 404 });
  }

  const { data, error: signErr } = await supabase.storage
    .from("audio")
    .createSignedUrl(track.storage_path, 3600);

  if (signErr || !data?.signedUrl) {
    return new NextResponse("Not found", { status: 404 });
  }

  return NextResponse.redirect(data.signedUrl, 307);
}
