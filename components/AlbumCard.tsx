import Link from "next/link";

type Album = {
  id: string;
  title: string;
  release_year: number;
};

export default function AlbumCard({ album }: { album: Album }) {
  return (
    <Link href={`/albums/${album.id}`} className="group block">
      <div className="aspect-square w-full overflow-hidden rounded-md bg-muted">
        <img
          src={`/api/covers/${album.id}`}
          alt={album.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
      </div>
      <div className="mt-2">
        <p className="truncate text-sm font-medium">{album.title}</p>
        <p className="text-xs text-muted-foreground">{album.release_year}</p>
      </div>
    </Link>
  );
}
