"use client";

import { useRef, useState } from "react";

function audioContentType(name: string, fallback: string): string {
  const ext = (name.split(".").pop() || "").toLowerCase();
  const map: Record<string, string> = {
    mp3: "audio/mpeg",
    wav: "audio/wav",
    m4a: "audio/mp4",
    ogg: "audio/ogg",
    flac: "audio/flac",
  };
  return map[ext] || fallback || "application/octet-stream";
}

function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    const url = URL.createObjectURL(file);
    const timer = setTimeout(() => {
      URL.revokeObjectURL(url);
      resolve(0);
    }, 8000);
    audio.onloadedmetadata = () => {
      clearTimeout(timer);
      const d = isFinite(audio.duration) ? Math.round(audio.duration) : 0;
      URL.revokeObjectURL(url);
      resolve(d);
    };
    audio.onerror = () => {
      clearTimeout(timer);
      URL.revokeObjectURL(url);
      resolve(0);
    };
    audio.src = url;
  });
}
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function UploadForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"Album" | "Single">("Album");
  const [title, setTitle] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [cover, setCover] = useState<File | null>(null);
  const [audio, setAudio] = useState<File[]>([]);
  const [progress, setProgress] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    if (!audio.length) {
      toast.error("At least one audio file is required.");
      return;
    }
    setLoading(true);
    try {
      // 1. Init: get signed upload URLs
      setProgress("Preparing upload...");
      const initRes = await fetch("/api/admin/upload/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          title: title.trim(),
          year,
          coverName: cover?.name,
          audioNames: audio.map((f) => f.name),
        }),
      });
      const init = await initRes.json().catch(() => ({}));
      if (!initRes.ok) {
        toast.error(init?.error || "Upload failed.");
        return;
      }

      const supabase = createClient();

      // 2. Upload cover directly to Supabase (auto-resumable for large files)
      let coverPath: string | null = null;
      if (cover && init.coverPath) {
        setProgress("Uploading cover...");
        const { error } = await supabase.storage
          .from("covers")
          .upload(init.coverPath, cover, {
            contentType: audioContentType(cover.name, cover.type),
            upsert: true,
          });
        if (error) throw new Error(error.message);
        coverPath = init.coverPath;
      }

      // Compute durations client-side from the audio files
      const durations: number[] = await Promise.all(
        audio.map((f) => getAudioDuration(f))
      );

      // 3. Upload audio files directly to Supabase (auto-resumable for large files)
      const tracks: { title: string; track_number: number; duration_seconds: number; storage_path: string }[] = [];
      for (let i = 0; i < audio.length; i++) {
        const f = audio[i];
        const a = init.audio[i];
        setProgress(`Uploading ${i + 1} of ${audio.length}...`);
        const { error } = await supabase.storage
          .from("audio")
          .upload(a.path, f, {
            contentType: audioContentType(f.name, f.type),
            upsert: true,
          });
        if (error) throw new Error(error.message);
        tracks.push({ title: a.title, track_number: a.track_number, duration_seconds: durations[i] || 0, storage_path: a.path });
      }

      // 4. Finish: insert DB rows
      setProgress("Finalizing...");
      const finishRes = await fetch("/api/admin/upload/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          albumId: init.albumId,
          mode,
          title: title.trim(),
          year,
          coverPath,
          tracks,
        }),
      });
      const fin = await finishRes.json().catch(() => ({}));
      if (!finishRes.ok) {
        toast.error(fin?.error || "Upload failed.");
        return;
      }

      toast.success(`Uploaded: ${title.trim()}`);
      setTitle("");
      setCover(null);
      setAudio([]);
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "Upload failed.");
    } finally {
      setLoading(false);
      setProgress("");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Label>Mode</Label>
        <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="mt-1">
          <TabsList>
            <TabsTrigger value="Album">Album</TabsTrigger>
            <TabsTrigger value="Single">Single</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">{mode === "Album" ? "Album title" : "Track title"}</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="year">Release year</Label>
        <Input id="year" type="number" value={year} onChange={(e) => setYear(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cover">Cover image</Label>
        <Input
          id="cover"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setCover(e.target.files?.[0] || null)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="audio">Audio files</Label>
        <Input
          ref={fileRef}
          id="audio"
          type="file"
          accept="audio/mpeg,audio/wav,audio/mp4,audio/ogg,audio/flac,.mp3,.wav,.m4a,.ogg,.flac"
          multiple
          onChange={(e) => setAudio(Array.from(e.target.files || []))}
        />
        {audio.length > 0 && (
          <p className="text-sm text-muted-foreground">{audio.length} file(s) selected</p>
        )}
      </div>
      {progress && <p className="text-sm text-muted-foreground">{progress}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Uploading..." : "Upload"}
      </Button>
    </form>
  );
}
