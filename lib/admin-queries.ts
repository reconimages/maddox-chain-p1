import { createAdminClient } from '@/lib/supabase/admin';

export async function getAdminStats() {
  const supabase = createAdminClient();
  const { data: albums } = await supabase.from('albums').select('id');
  const { data: tracks } = await supabase.from('tracks').select('id, duration_seconds, album_id');

  const albumCount = albums?.length || 0;
  // singles = albums with exactly 1 track
  const trackCounts: Record<string, number> = {};
  (tracks || []).forEach((t: any) => {
    trackCounts[t.album_id] = (trackCounts[t.album_id] || 0) + 1;
  });
  const singles = Object.values(trackCounts).filter((c) => c === 1).length;
  const albumsOnly = albumCount - singles;
  const totalDuration = (tracks || []).reduce((s: number, t: any) => s + (t.duration_seconds || 0), 0);

  return {
    albums: albumsOnly,
    singles,
    tracks: tracks?.length || 0,
    totalDurationSeconds: totalDuration,
  };
}

export async function getRecentEvents(limit = 10) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('admin_events')
    .select('id, event_type, album_id, track_id, metadata, created_at, albums(title)')
    .order('created_at', { ascending: false })
    .limit(limit);
  return data || [];
}