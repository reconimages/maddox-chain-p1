'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function EditTrackForm({ track }: { track: any }) {
  const router = useRouter();
  const [title, setTitle] = useState(track.title);
  const [trackNumber, setTrackNumber] = useState(String(track.track_number));
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tracks/${track.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), track_number: Number(trackNumber) }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(j?.error || 'Update failed.');
        return;
      }
      toast.success('Track updated.');
      router.push('/admin/tracks');
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
        <Label htmlFor="tn">Track number</Label>
        <Input id="tn" type="number" min={1} value={trackNumber} onChange={(e) => setTrackNumber(e.target.value)} required />
      </div>
      <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save changes'}</Button>
    </form>
  );
}