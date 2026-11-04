import { redirect } from 'next/navigation';
import { isAdminRequest } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import AlbumsTable from '@/components/admin/AlbumsTable';

export const dynamic = 'force-dynamic';

export default async function AdminAlbumsPage() {
  if (!(await isAdminRequest())) redirect('/admin/login');

  const supabase = createAdminClient();
  const { data: albums } = await supabase
    .from('albums')
    .select('id, title, release_year, cover_path, created_at')
    .order('created_at', { ascending: false });

  const rows = (albums || []).map((a: any) => ({
    ...a,
    tracks: [] as any[],
  }));

  // fetch track counts + durations per album
  const { data: tracks } = await supabase
    .from('tracks')
    .select('album_id, duration_seconds, is_vault');
  const counts: Record<string, number> = {};
  const durations: Record<string, number> = {};
  const vaultCounts: Record<string, number> = {};
  (tracks || []).forEach((t: any) => {
    counts[t.album_id] = (counts[t.album_id] || 0) + 1;
    durations[t.album_id] = (durations[t.album_id] || 0) + (t.duration_seconds || 0);
    if (t.is_vault) vaultCounts[t.album_id] = (vaultCounts[t.album_id] || 0) + 1;
  });

  const enriched = (albums || []).map((a: any) => {
    const tc = counts[a.id] || 0;
    const vc = vaultCounts[a.id] || 0;
    return {
      id: a.id,
      title: a.title,
      release_year: a.release_year,
      cover_path: a.cover_path,
      created_at: a.created_at,
      track_count: tc,
      total_duration: durations[a.id] || 0,
      is_vault: tc > 0 && vc === tc,
    };
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Albums</h1>
      <AlbumsTable rows={enriched} />
    </div>
  );
}