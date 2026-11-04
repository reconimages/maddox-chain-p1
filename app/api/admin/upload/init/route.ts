import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminRequest } from "@/lib/admin";

const ALLOWED_AUDIO = ["mp3", "wav", "m4a", "ogg", "flac"];
const ALLOWED_COVER = ["jpg", "jpeg", "png", "webp"];

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
  mode: z.enum(["Album", "Single"]),
  title: z.string().min(1),
  year: z.coerce.number().int().min(1900).max(2100),
  coverName: z.string().nullable().optional(),
  audioNames: z.array(z.string().min(1)).min(1),
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
    const { mode, title, year, coverName, audioNames } = parsed.data;

    if (coverName && !ALLOWED_COVER.includes(extOf(coverName))) {
      return NextResponse.json({ error: "Cover must be jpg/jpeg/png/webp." }, { status: 400 });
    }
    for (const n of audioNames) {
      if (!ALLOWED_AUDIO.includes(extOf(n))) {
        return NextResponse.json({ error: `Unsupported audio type: ${n}` }, { status: 400 });
      }
    }

    const albumId = crypto.randomUUID();

    let coverPath: string | null = null;
    if (coverName) {
      const ext = extOf(coverName);
      coverPath = `covers/${albumId}.${ext}`;
    }

    const audio = audioNames.map((name, i) => {
      const tn = trackNumberFromFilename(name, i + 1);
      const ttitle = mode === "Single" ? title : trackTitleFromFilename(name);
      const ext = extOf(name);
      const spath = `audio/${albumId}/${String(tn).padStart(2, "0")}-${slug(ttitle)}.${ext}`;
      return { name, title: ttitle, track_number: tn, path: spath };
    });

    return NextResponse.json({
      albumId,
      coverPath,
      audio,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Init failed" }, { status: 500 });
  }
}
