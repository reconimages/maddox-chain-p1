import { redirect, notFound } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { createServerSupabase } from '@/lib/auth';
import { moveTrack, removeTrackFromPlaylist } from '@/lib/actions/library';
import { ChevronUp, ChevronDown, X } from 'lucide-react';
import TrackRow from '@/components/TrackRow';
import DeletePlaylistButton from '@/components/DeletePlaylistButton';
import PlayAllButton from '@/components/PlayAllButton';

export const dynamic = 'force-dynamic';

export default async function PlaylistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect(`/auth/login?next=/playlists/${id}`);

  const supabase = await createServerSupabase();
  const { data: playlist } = await supabase
    .from('playlists')
    .select('id, name, created_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!playlist) notFound();

  const { data: ptRows } = await supabase
    .from('playlist_tracks')
    .select('position, track_id, tracks(id, title, duration_seconds, album_id, albums(title))')
    .eq('playlist_id', id)
    .order('position', { ascending: true });

  const rows = ptRows || [];
  const trackIds = rows.map((r: any) => r.tracks?.id).filter(Boolean);

  // liked set for these tracks
  const likedSet = new Set<string>();
  if (trackIds.length) {
    const { data: likes } = await supabase
      .from('liked_tracks')
      .select('track_id')
      .eq('user_id', user.id)
      .in('track_id', trackIds);
    (likes || []).forEach((l: any) => likedSet.add(l.track_id));
  }

  const { data: playlists } = await supabase
    .from('playlists')
    .select('id, name')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  const tracks = rows.map((r: any) => r.tracks).filter(Boolean);
  const totalSeconds = tracks.reduce((s: number, t: any) => s + (t.duration_seconds || 0), 0);
  const mm = Math.floor(totalSeconds / 60);
  const ss = String(totalSeconds % 60).padStart(2, '0');

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{playlist.name}</h1>
          <p className="text-sm text-muted-foreground">
            {tracks.length} tracks · {mm}:{ss} · created {new Date(playlist.created_at).toLocaleDateString()}
          </p>
        </div>
        <DeletePlaylistButton playlistId={playlist.id} name={playlist.name} />
      </div>

      {tracks.length === 0 ? (
        <p className="text-muted-foreground">
          This playlist is empty. Add tracks from the home page or your liked songs.
        </p>
      ) : (
        <>
          <div className="mb-4">
            <PlayAllButton tracks={tracks} />
          </div>
          <div className="space-y-1">
            {rows.map((r: any, idx: number) => {
              const t = r.tracks;
              if (!t) return null;
              const upDisabled = idx === 0;
              const downDisabled = idx === rows.length - 1;
              return (
                <TrackRow
                  key={t.id}
                  track={{ id: t.id, title: t.title, track_number: idx + 1, duration_seconds: t.duration_seconds }}
                  albumTitle={t.albums?.title ?? ''}
                  albumId={t.album_id}
                  isSignedIn={true}
                  initialLiked={likedSet.has(t.id)}
                  playlists={playlists || []}
                  queue={tracks}
                  rowActions={
                    <>
                      <form action={async () => { 'use server'; await moveTrack(playlist.id, t.id, 'up'); }}>
                        <button type="submit" disabled={upDisabled} className="rounded p-1 hover:bg-accent disabled:opacity-30" aria-label="Move up">
                          <ChevronUp className="h-4 w-4" />
                        </button>
                      </form>
                      <form action={async () => { 'use server'; await moveTrack(playlist.id, t.id, 'down'); }}>
                        <button type="submit" disabled={downDisabled} className="rounded p-1 hover:bg-accent disabled:opacity-30" aria-label="Move down">
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </form>
                      <form action={async () => { 'use server'; await removeTrackFromPlaylist(playlist.id, t.id); }}>
                        <button type="submit" className="rounded p-1 hover:bg-accent text-muted-foreground" aria-label="Remove">
                          <X className="h-4 w-4" />
                        </button>
                      </form>
                    </>
                  }
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}