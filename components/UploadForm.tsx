"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

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
    setProgress(`uploading 1 of ${audio.length + (cover ? 1 : 0)}`);
    const fd = new FormData();
    fd.append("mode", mode);
    fd.append("title", title.trim());
    fd.append("year", year);
    if (cover) fd.append("cover", cover);
    for (const f of audio) fd.append("audio", f);

    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(j?.error || "Upload failed.");
      } else {
        toast.success(`Uploaded: ${title.trim()}`);
        setTitle("");
        setCover(null);
        setAudio([]);
        if (fileRef.current) fileRef.current.value = "";
        router.refresh();
      }
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
          <p className="text-xs text-muted-foreground">{audio.length} file(s) selected</p>
        )}
      </div>
      {progress && <p className="text-xs text-muted-foreground">{progress}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Uploading..." : "Upload"}
      </Button>
    </form>
  );
}
