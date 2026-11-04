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

type Row = {
  id: string;
  title: string;
  release_year: number;
  cover_path: string | null;
  created_at: string;
  track_count: number;
  total_duration: number;
  is_vault: boolean;
};

function fmtDur(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function AlbumsTable({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'albums' | 'singles'>('all');
  const [vaultFilter, setVaultFilter] = useState<'all' | 'public' | 'vault'>('all');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'title' | 'tracks'>('newest');
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
  const [deleteInfo, setDeleteInfo] = useState<{ playlist_refs: number; like_refs: number } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    let r = rows.filter((row) =>
      row.title.toLowerCase().includes(search.toLowerCase())
    );
    if (filter === 'albums') r = r.filter((row) => row.track_count >= 2);
    if (filter === 'singles') r = r.filter((row) => row.track_count === 1);
    if (vaultFilter === 'public') r = r.filter((row) => !row.is_vault);
    if (vaultFilter === 'vault') r = r.filter((row) => row.is_vault);
    if (sort === 'newest') r = [...r].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    if (sort === 'oldest') r = [...r].sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    if (sort === 'title') r = [...r].sort((a, b) => a.title.localeCompare(b.title));
    if (sort === 'tracks') r = [...r].sort((a, b) => b.track_count - a.track_count);
    return r;
  }, [rows, search, filter, vaultFilter, sort]);

  async function openDelete(row: Row) {
    // dry run: get impact counts
    const res = await fetch(`/api/admin/albums/${row.id}?dry_run=1`);
    const j = await res.json().catch(() => ({}));
    setDeleteInfo({ playlist_refs: j.playlist_refs ?? 0, like_refs: j.like_refs ?? 0 });
    setDeleteTarget(row);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/albums/${deleteTarget.id}`, {
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">All</option>
          <option value="albums">Albums</option>
          <option value="singles">Singles</option>
        </select>
        <select
          value={vaultFilter}
          onChange={(e) => setVaultFilter(e.target.value as any)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">All categories</option>
          <option value="public">Public</option>
          <option value="vault">Vault</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as any)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="title">Title A-Z</option>
          <option value="tracks">Most tracks</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground">No music yet. Upload your first track or album.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2">Cover</th>
                <th className="py-2">Title</th>
                <th className="py-2">Type</th>
                <th className="py-2">Year</th>
                <th className="py-2">Tracks</th>
                <th className="py-2">Duration</th>
                <th className="py-2">Created</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-b">
                  <td className="py-2">
                    <img src={`/api/covers/${row.id}`} alt="" className="h-10 w-10 rounded object-cover" />
                  </td>
                  <td className="py-2">
                    {row.title}
                    {row.is_vault && (
                      <span className="ml-2 rounded bg-amber-500/20 px-1.5 py-0.5 text-xs font-bold text-amber-500">
                        VAULT
                      </span>
                    )}
                  </td>
                  <td className="py-2">{row.track_count === 1 ? 'Single' : 'Album'}</td>
                  <td className="py-2">{row.release_year}</td>
                  <td className="py-2">{row.track_count}</td>
                  <td className="py-2">{fmtDur(row.total_duration)}</td>
                  <td className="py-2 text-xs text-muted-foreground">
                    {new Date(row.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/tracks?album=${row.id}`}>View tracks</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/albums/${row.id}/edit`}>Edit</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openDelete(row)}>
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
            ? `This album has ${deleteTarget?.track_count} track(s). It is referenced in ${deleteInfo.playlist_refs} playlist(s) and liked ${deleteInfo.like_refs} time(s). Deleting will remove those references and the uploaded files.`
            : 'Loading impact...'
        }
        onConfirm={confirmDelete}
      />
    </div>
  );
}