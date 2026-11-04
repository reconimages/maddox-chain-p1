import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { createServerSupabase } from '@/lib/auth';
import NewPlaylistButton from '@/components/NewPlaylistButton';
import PlaylistCard from '@/components/PlaylistCard';

export const dynamic = 'force-dynamic';

export default async function PlaylistsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth/login?next=/playlists');

  const supabase = await createServerSupabase();
  const { data: playlists } = await supabase
    .from('playlists')
    .select('id, name, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  // track counts
  const counts: Record<string, number> = {};
  if (playlists && playlists.length) {
    const { data: pt } = await supabase
      .from('playlist_tracks')
      .select('playlist_id')
      .in('playlist_id', playlists.map((p: any) => p.id));
    (pt || []).forEach((r: any) => {
      counts[r.playlist_id] = (counts[r.playlist_id] || 0) + 1;
    });
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your playlists</h1>
        <NewPlaylistButton />
      </div>
      {!playlists || playlists.length === 0 ? (
        <p className="text-muted-foreground">
          No playlists yet. Create one to start collecting tracks.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {playlists.map((p: any) => (
            <PlaylistCard
              key={p.id}
              playlist={{ id: p.id, name: p.name }}
              trackCount={counts[p.id] || 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}