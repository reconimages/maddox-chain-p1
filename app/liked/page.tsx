import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { createServerSupabase } from '@/lib/auth';
import { getAccess } from '@/lib/access';
import TrackRow from '@/components/TrackRow';
import LikeButton from '@/components/LikeButton';

export const dynamic = 'force-dynamic';

export default async function LikedPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth/login?next=/liked');

  const access = await getAccess();
  const supabase = await createServerSupabase();
  const { data: likes } = await supabase
    .from('liked_tracks')
    .select('track_id, created_at, tracks(id, title, duration_seconds, album_id, albums(title), is_vault)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const { data: playlists } = await supabase
    .from('playlists')
    .select('id, name')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  let tracks = (likes || []).map((l: any) => l.tracks).filter(Boolean);
  const hiddenVaultCount = tracks.filter((t: any) => t.is_vault && !access.hasFullAccess).length;
  if (!access.hasFullAccess) {
    tracks = tracks.filter((t: any) => !t.is_vault);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">Liked songs</h1>
      <p className="mb-6 text-sm text-muted-foreground">{tracks.length} tracks</p>
      {hiddenVaultCount > 0 && (
        <p className="mb-4 text-sm text-muted-foreground">
          {hiddenVaultCount} vault track(s) are hidden because your subscription is inactive.{' '}
          <a href="/subscribe" className="text-primary underline">Resubscribe</a>
        </p>
      )}
      {tracks.length === 0 ? (
        <p className="text-muted-foreground">
          No liked songs yet. Tap the heart on any track to add it here.{' '}
          <a href="/" className="text-primary underline">Browse</a>
        </p>
      ) : (
        <div className="space-y-1">
          {tracks.map((t: any, idx: number) => (
            <TrackRow
              key={t.id}
              track={{ id: t.id, title: t.title, track_number: 0, duration_seconds: t.duration_seconds }}
              albumTitle={t.albums?.title ?? ''}
              albumId={t.album_id}
              isSignedIn={true}
              initialLiked={true}
              playlists={playlists || []}
              queue={tracks}
            />
          ))}
        </div>
      )}
    </div>
  );
}