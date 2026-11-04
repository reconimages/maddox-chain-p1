import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TRANSPARENT_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ albumId: string }> }
) {
  const { albumId } = await params;
  const supabase = await createClient();
  const { data: album, error } = await supabase
    .from("albums")
    .select("cover_path")
    .eq("id", albumId)
    .single();

  if (error || !album || !album.cover_path) {
    return new NextResponse(TRANSPARENT_PNG, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=300",
      },
    });
  }

  const { data, error: signErr } = await supabase.storage
    .from("covers")
    .createSignedUrl(album.cover_path, 600);

  if (signErr || !data?.signedUrl) {
    return new NextResponse(TRANSPARENT_PNG, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=300",
      },
    });
  }

  const res = NextResponse.redirect(data.signedUrl, 307);
  res.headers.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  return res;
}
