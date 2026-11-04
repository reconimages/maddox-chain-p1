import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminRequest } from "@/lib/admin";

const bodySchema = z.object({
  albumId: z.string().uuid(),
  mode: z.enum(["Album", "Single"]),
  title: z.string().min(1),
  year: z.coerce.number().int().min(1900).max(2100),
  coverPath: z.string().nullable().optional(),
  tracks: z.array(
    z.object({
      title: z.string().min(1),
      track_number: z.number().int(),
      storage_path: z.string().min(1),
    })
  ).min(1),
});

export async function POST(req: Request) {
  try {
    if (!(await isAdminRequest())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }
    const { albumId, mode, title, year, coverPath, tracks } = parsed.data;

    const supabase = createAdminClient();
    const finalTitle = title;

    const { data: albumRow, error: albumErr } = await supabase
      .from("albums")
      .insert({ id: albumId, title: finalTitle, release_year: year, cover_path: coverPath ?? null })
      .select()
      .single();
    if (albumErr) {
      return NextResponse.json({ error: albumErr.message }, { status: 500 });
    }

    const rows = tracks.map((t) => ({
      album_id: albumRow.id,
      title: t.title,
      track_number: t.track_number,
      duration_seconds: 0,
      storage_path: t.storage_path,
    }));
    const { error: tracksErr } = await supabase.from("tracks").insert(rows);
    if (tracksErr) {
      return NextResponse.json({ error: tracksErr.message }, { status: 500 });
    }

    return NextResponse.json({ albumId: albumRow.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Finish failed" }, { status: 500 });
  }
}
