import { NextResponse } from "next/server";
import { z } from "zod";
import { parseBuffer } from "music-metadata";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminRequest } from "@/lib/admin";
import { logAdminEvent } from "@/lib/admin-log";

const ALLOWED_AUDIO = ["mp3", "wav", "m4a", "ogg", "flac"];
const ALLOWED_COVER = ["jpg", "jpeg", "png", "webp"];
const MAX_AUDIO_BYTES = 4 * 1024 * 1024; // 4 MB (Vercel body limit ~4.5 MB)
const MAX_COVER_BYTES = 2 * 1024 * 1024; // 2 MB

function extOf(name: string) {
  return (name.split(".").pop() || "").toLowerCase();
}

function slug(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "track";
}

function trackTitleFromFilename(name: string) {
  const base = name.replace(/\.[^.]+$/, "");
  const m = base.match(/^(\d+)\s*[-. ]\s*(.*)$/);
  const rest = m ? m[2] : base;
  return rest.trim() || base;
}

function trackNumberFromFilename(name: string, fallback: number) {
  const base = name.replace(/\.[^.]+$/, "");
  const m = base.match(/^(\d+)\s*[-. ]\s*/);
  return m ? parseInt(m[1], 10) : fallback;
}

const bodySchema = z.object({
  mode: z.enum(["Album", "Single", "Vault"]),
  title: z.string().min(1),
  year: z.coerce.number().int().min(1900).max(2100),
});

export async function POST(req: Request) {
  try {
    if (!(await isAdminRequest())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const mode = formData.get("mode");
    const title = formData.get("title");
    const year = formData.get("year");
    const parsed = bodySchema.safeParse({ mode, title, year });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }
    const { mode: m, title: albumTitle, year: releaseYear } = parsed.data;

    const cover = formData.get("cover");
    const coverFile = cover instanceof File ? cover : null;
    const audioFiles: File[] = [];
    for (const [key, val] of formData.entries()) {
      if (key === "audio" && val instanceof File) audioFiles.push(val);
    }

    if (!audioFiles.length) {
      return NextResponse.json({ error: "At least one audio file is required." }, { status: 400 });
    }
    if (coverFile && !ALLOWED_COVER.includes(extOf(coverFile.name))) {
      return NextResponse.json({ error: "Cover must be jpg/jpeg/png/webp." }, { status: 400 });
    }
    if (coverFile && coverFile.size > MAX_COVER_BYTES) {
      return NextResponse.json({ error: `Cover too large (max 2 MB). Yours is ${(coverFile.size / 1024 / 1024).toFixed(1)} MB.` }, { status: 400 });
    }
    for (const f of audioFiles) {
      if (!ALLOWED_AUDIO.includes(extOf(f.name))) {
        return NextResponse.json({ error: `Unsupported audio type: ${f.name}` }, { status: 400 });
      }
      if (f.size > MAX_AUDIO_BYTES) {
        return NextResponse.json({ error: `Audio file too large (max 4 MB): ${f.name}` }, { status: 400 });
      }
    }

    const albumId = crypto.randomUUID();
    const supabase = createAdminClient();
    const uploadedAudio: string[] = [];
    let uploadedCover: string | null = null;

    try {
      let coverPath: string | null = null;
      if (coverFile) {
        const ext = extOf(coverFile.name);
        const cpath = `covers/${albumId}.${ext}`;
        const buf = Buffer.from(await coverFile.arrayBuffer());
        const { error: upErr } = await supabase.storage
          .from("covers")
          .upload(cpath, buf, { contentType: coverFile.type || "image/jpeg", upsert: true });
        if (upErr) throw new Error(upErr.message);
        coverPath = cpath;
        uploadedCover = cpath;
      }

      const tracks: { title: string; track_number: number; duration_seconds: number; storage_path: string; is_vault: boolean }[] = [];
      for (let i = 0; i < audioFiles.length; i++) {
        const f = audioFiles[i];
        const buf = Buffer.from(await f.arrayBuffer());
        let duration = 0;
        try {
          const meta = await parseBuffer(buf);
          duration = Math.round(meta.format.duration || 0);
        } catch {
          duration = 0;
        }
        const tn = trackNumberFromFilename(f.name, i + 1);
        const ttitle = m === "Single" && title ? String(title) : trackTitleFromFilename(f.name);
        const ext = extOf(f.name);
        const prefix = m === "Vault" ? "vault-audio" : "audio";
        const spath = `${prefix}/${albumId}/${String(tn).padStart(2, "0")}-${slug(ttitle)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("audio")
          .upload(spath, buf, { contentType: f.type || "audio/mpeg", upsert: true });
        if (upErr) throw new Error(upErr.message);
        uploadedAudio.push(spath);
        tracks.push({ title: ttitle, track_number: tn, duration_seconds: duration, storage_path: spath, is_vault: m === "Vault" });
      }

      const finalAlbumTitle = m === "Single" ? String(title) : albumTitle;

      const { data: albumRow, error: albumErr } = await supabase
        .from("albums")
        .insert({ id: albumId, title: finalAlbumTitle, release_year: releaseYear, cover_path: coverPath })
        .select()
        .single();
      if (albumErr) throw new Error(albumErr.message);

      const rows = tracks.map((t) => ({
        album_id: albumRow.id,
        title: t.title,
        track_number: t.track_number,
        duration_seconds: t.duration_seconds,
        storage_path: t.storage_path,
        is_vault: t.is_vault ?? false,
      }));
      const { error: tracksErr } = await supabase.from("tracks").insert(rows);
      if (tracksErr) throw new Error(tracksErr.message);

      await logAdminEvent({ event_type: 'upload', album_id: albumRow.id, metadata: { track_count: tracks.length, mode: m } });
      return NextResponse.json({ albumId: albumRow.id });
    } catch (e: any) {
      try {
        if (uploadedCover) await supabase.storage.from("covers").remove([uploadedCover]);
        if (uploadedAudio.length) await supabase.storage.from("audio").remove(uploadedAudio);
        await supabase.from("albums").delete().eq("id", albumId);
      } catch {}
      return NextResponse.json({ error: e?.message || "Upload failed" }, { status: 500 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Upload failed (outer)" }, { status: 500 });
  }
}
