import Link from 'next/link';

export default function PlaylistCard({
  playlist,
  trackCount,
}: {
  playlist: { id: string; name: string };
  trackCount: number;
}) {
  const initial = (playlist.name.charAt(0) || '?').toUpperCase();
  return (
    <Link href={`/playlists/${playlist.id}`} className="group block">
      <div className="aspect-square w-full overflow-hidden rounded-md bg-zinc-800 flex items-center justify-center">
        <span className="text-5xl font-bold text-amber-500">{initial}</span>
      </div>
      <div className="mt-2">
        <p className="truncate text-sm font-medium">{playlist.name}</p>
        <p className="text-xs text-muted-foreground">{trackCount} tracks</p>
      </div>
    </Link>
  );
}