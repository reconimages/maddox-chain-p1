import { redirect, notFound } from 'next/navigation';
import { getAccess } from '@/lib/access';
import { createClient } from '@/lib/supabase/server';
import TrackRow from '@/components/TrackRow';
import PlayAllButton from '@/components/PlayAllButton';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: album } = await supabase.from('albums').select('title').eq('id', id).single();
  if (!album) return {};
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  return {
    title: `${album.title} — Maddox Chain VIP Vault`,
    description: 'VIP Vault exclusive content on Maddox Chain.',
    robots: { index: false, follow: false },
    openGraph: {
      title: album.title,
      description: 'VIP Vault exclusive content on Maddox Chain.',
      type: 'music.album',
      url: `${siteUrl}/vault/${id}`,
      siteName: 'Maddox Chain',
      images: [{ url: `${siteUrl}/api/og/album/${id}`, width: 1200, height: 630, alt: album.title }],
    },
  };
}

export default async function VaultAlbumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const access = await getAccess();
  if (!access.hasFullAccess) redirect('/vault');

  const supabase = await createClient();
  const { data: album } = await supabase
    .from('albums')
    .select('*')
    .eq('id', id)
    .single();
  if (!album) notFound();

  const { data: tracks } = await supabase
    .from('tracks')
    .select('*')
    .eq('album_id', id)
    .eq('is_vault', true)
    .order('track_number', { ascending: true });

  if (!tracks || tracks.length === 0) notFound();

  const user = access.user;
  const likedSet = new Set<string>();
  const trackIds = tracks.map((t: any) => t.id);
  if (user && trackIds.length) {
    const { data: likes } = await supabase
      .from('liked_tracks')
      .select('track_id')
      .eq('user_id', user.id)
      .in('track_id', trackIds);
    (likes || []).forEach((l: any) => likedSet.add(l.track_id));
  }

  let playlists: { id: string; name: string }[] = [];
  if (user) {
    const { data: pls } = await supabase
      .from('playlists')
      .select('id, name')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    playlists = pls || [];
  }

  const totalSeconds = tracks.reduce((s: number, t: any) => s + (t.duration_seconds || 0), 0);
  const mm = Math.floor(totalSeconds / 60);
  const ss = String(totalSeconds % 60).padStart(2, '0');

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="aspect-square w-full max-w-xs overflow-hidden rounded-md bg-muted">
          <img src={`/api/covers/${album.id}`} alt={album.title} className="h-full w-full object-cover" />
        </div>
        <div className="flex flex-col justify-end">
          <p className="text-xs uppercase tracking-widest text-amber-500">VAULT</p>
          <h1 className="text-3xl font-bold">{album.title}</h1>
          <p className="text-sm text-muted-foreground">
            {album.release_year} · {tracks.length} tracks · {mm}:{ss}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <PlayAllButton tracks={tracks} />
      </div>

      <div className="mt-8 space-y-1">
        {tracks.map((t: any) => (
          <TrackRow
            key={t.id}
            track={{ id: t.id, title: t.title, track_number: t.track_number, duration_seconds: t.duration_seconds }}
            albumTitle={album.title}
            albumId={album.id}
            isSignedIn={!!user}
            initialLiked={likedSet.has(t.id)}
            playlists={playlists}
            queue={tracks}
          />
        ))}
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        Vault content is for VIP members only. Please do not share or redistribute.
      </p>
    </div>
  );
}