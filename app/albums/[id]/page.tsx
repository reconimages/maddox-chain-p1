import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import TrackRow from "@/components/TrackRow";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: album } = await supabase
    .from("albums")
    .select("*")
    .eq("id", id)
    .single();
  if (!album) notFound();

  const { data: tracks } = await supabase
    .from("tracks")
    .select("*")
    .eq("album_id", id)
    .eq("is_vault", false)
    .order("track_number", { ascending: true });

  if (!tracks || tracks.length === 0) notFound();

  const user = await getSessionUser();
  const isSignedIn = !!user;

  // liked set
  const likedSet = new Set<string>();
  const trackIds = (tracks || []).map((t: any) => t.id);
  if (user && trackIds.length) {
    const { data: likes } = await supabase
      .from("liked_tracks")
      .select("track_id")
      .eq("user_id", user.id)
      .in("track_id", trackIds);
    (likes || []).forEach((l: any) => likedSet.add(l.track_id));
  }

  // playlists
  let playlists: { id: string; name: string }[] = [];
  if (user) {
    const { data: pls } = await supabase
      .from("playlists")
      .select("id, name")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    playlists = pls || [];
  }

  const totalSeconds = (tracks || []).reduce(
    (s: number, t: any) => s + (t.duration_seconds || 0),
    0
  );
  const mm = Math.floor(totalSeconds / 60);
  const ss = String(totalSeconds % 60).padStart(2, "0");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="aspect-square w-full max-w-xs overflow-hidden rounded-md bg-muted">
          <img
            src={`/api/covers/${album.id}`}
            alt={album.title}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex flex-col justify-end">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {album.is_single ? "Single" : "Album"}
          </p>
          <h1 className="text-3xl font-bold">{album.title}</h1>
          <p className="text-sm text-muted-foreground">
            {album.release_year} · {(tracks || []).length} tracks · {mm}:{ss}
          </p>
        </div>
      </div>

      <div className="mt-8 space-y-1">
        {(tracks || []).map((t: any) => (
          <TrackRow
            key={t.id}
            track={{
              id: t.id,
              title: t.title,
              track_number: t.track_number,
              duration_seconds: t.duration_seconds,
            }}
            albumTitle={album.title}
            albumId={album.id}
            isSignedIn={isSignedIn}
            initialLiked={likedSet.has(t.id)}
            playlists={playlists}
            queue={tracks || []}
          />
        ))}
      </div>
    </div>
  );
}