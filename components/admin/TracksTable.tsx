'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import ConfirmDeleteDialog from '@/components/admin/ConfirmDeleteDialog';
import { toast } from 'sonner';

type Track = {
  id: string;
  title: string;
  track_number: number;
  duration_seconds: number;
  storage_path: string;
  album_id: string;
  albums: { id: string; title: string } | null;
};

function fmtDur(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function TracksTable({
  tracks,
  albums,
  selectedAlbum,
}: {
  tracks: Track[];
  albums: { id: string; title: string }[];
  selectedAlbum: string;
}) {
  const router = useRouter();
  const [albumFilter, setAlbumFilter] = useState(selectedAlbum);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'album' | 'title' | 'duration'>('album');
  const [deleteTarget, setDeleteTarget] = useState<Track | null>(null);
  const [deleteInfo, setDeleteInfo] = useState<{ playlist_refs: number; like_refs: number } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    let r = tracks.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()));
    if (albumFilter) r = r.filter((t) => t.album_id === albumFilter);
    if (sort === 'title') r = [...r].sort((a, b) => a.title.localeCompare(b.title));
    if (sort === 'duration') r = [...r].sort((a, b) => b.duration_seconds - a.duration_seconds);
    return r;
  }, [tracks, search, albumFilter, sort]);

  async function openDelete(track: Track) {
    const res = await fetch(`/api/admin/tracks/${track.id}?dry_run=1`);
    const j = await res.json().catch(() => ({}));
    setDeleteInfo({ playlist_refs: j.playlist_refs ?? 0, like_refs: j.like_refs ?? 0 });
    setDeleteTarget(track);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/tracks/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(j?.error || 'Delete failed.');
        return;
      }
      toast.success('Deleted.');
      setDeleteTarget(null);
      setDeleteInfo(null);
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Delete failed.');
    } finally {
      setDeleting(false);
    }
  }

  function handleAlbumFilter(val: string) {
    setAlbumFilter(val);
    if (val) {
      router.push(`/admin/tracks?album=${val}`);
    } else {
      router.push('/admin/tracks');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <select
          value={albumFilter}
          onChange={(e) => handleAlbumFilter(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">All albums</option>
          {albums.map((a) => (
            <option key={a.id} value={a.id}>{a.title}</option>
          ))}
        </select>
        <Input
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as any)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="album">Album order</option>
          <option value="title">Title A-Z</option>
          <option value="duration">Duration</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground">No tracks found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2">Cover</th>
                <th className="py-2">Album</th>
                <th className="py-2">#</th>
                <th className="py-2">Title</th>
                <th className="py-2">Duration</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b">
                  <td className="py-2">
                    <img src={`/api/covers/${t.album_id}`} alt="" className="h-8 w-8 rounded object-cover" />
                  </td>
                  <td className="py-2">
                    <Link href={`/admin/tracks?album=${t.album_id}`} className="hover:underline">
                      {t.albums?.title ?? ''}
                    </Link>
                  </td>
                  <td className="py-2">{t.track_number}</td>
                  <td className="py-2">{t.title}</td>
                  <td className="py-2">{fmtDur(t.duration_seconds)}</td>
                  <td className="py-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/tracks/${t.id}/edit`}>Edit</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openDelete(t)}>
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) { setDeleteTarget(null); setDeleteInfo(null); } }}
        title={`Delete ${deleteTarget?.title}?`}
        description={
          deleteInfo
            ? `This track is referenced in ${deleteInfo.playlist_refs} playlist(s) and liked ${deleteInfo.like_refs} time(s). Deleting will remove those references.`
            : 'Loading impact...'
        }
        onConfirm={confirmDelete}
      />
    </div>
  );
}