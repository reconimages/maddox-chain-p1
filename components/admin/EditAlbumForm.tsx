'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function EditAlbumForm({ album }: { album: any }) {
  const router = useRouter();
  const [title, setTitle] = useState(album.title);
  const [year, setYear] = useState(String(album.release_year));
  const [cover, setCover] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('title', title.trim());
      fd.append('release_year', year);
      if (cover) fd.append('cover', cover);

      const res = await fetch(`/api/admin/albums/${album.id}`, {
        method: 'PUT',
        body: fd,
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(j?.error || 'Update failed.');
        return;
      }
      toast.success('Album updated.');
      router.push('/admin/albums');
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Update failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-lg space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="year">Release year</Label>
        <Input id="year" type="number" value={year} onChange={(e) => setYear(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cover">Cover image (optional, replaces current)</Label>
        <Input id="cover" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setCover(e.target.files?.[0] || null)} />
        {album.cover_path && <p className="text-xs text-muted-foreground">Current cover will be kept if no new file.</p>}
      </div>
      <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save changes'}</Button>
    </form>
  );
}