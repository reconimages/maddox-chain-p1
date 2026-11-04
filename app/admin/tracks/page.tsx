import { redirect } from 'next/navigation';
import { isAdminRequest } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import TracksTable from '@/components/admin/TracksTable';

export const dynamic = 'force-dynamic';

export default async function AdminTracksPage({
  searchParams,
}: {
  searchParams: Promise<{ album?: string }>;
}) {
  if (!(await isAdminRequest())) redirect('/admin/login');
  const { album } = await searchParams;

  const supabase = createAdminClient();
  const { data: albums } = await supabase
    .from('albums')
    .select('id, title')
    .order('created_at', { ascending: false });

  let query = supabase
    .from('tracks')
    .select('id, title, track_number, duration_seconds, storage_path, album_id, albums(id, title)')
    .order('track_number', { ascending: true });
  if (album) query = query.eq('album_id', album);

  const { data: tracks } = await query;

  const rawTracks = tracks || [];
  const trackRows = rawTracks.map((t: any) => ({
    id: t.id,
    title: t.title,
    track_number: t.track_number,
    duration_seconds: t.duration_seconds,
    storage_path: t.storage_path,
    album_id: t.album_id,
    albums: Array.isArray(t.albums) ? t.albums[0] ?? null : t.albums,
  }));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Tracks</h1>
      <TracksTable
        tracks={trackRows}
        albums={albums || []}
        selectedAlbum={album || ''}
      />
    </div>
  );
}