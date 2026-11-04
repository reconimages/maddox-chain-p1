import Link from "next/link";

type Album = {
  id: string;
  title: string;
  release_year: number;
};

export default function AlbumCard({
  album,
  href,
  badge,
}: {
  album: Album;
  href?: string;
  badge?: string;
}) {
  return (
    <Link href={href || `/albums/${album.id}`} className="group block relative">
      <div className="aspect-square w-full overflow-hidden rounded-md bg-muted">
        <img
          src={`/api/covers/${album.id}`}
          alt={album.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
        {badge && (
          <span className="absolute top-2 right-2 rounded-full bg-amber-500/80 px-2 py-0.5 text-xs font-bold text-black">
            {badge}
          </span>
        )}
      </div>
      <div className="mt-2">
        <p className="truncate text-sm font-medium">{album.title}</p>
        <p className="text-xs text-muted-foreground">{album.release_year}</p>
      </div>
    </Link>
  );
}
