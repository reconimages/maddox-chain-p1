import AlbumCard from "@/components/AlbumCard";
import { createClient } from "@/lib/supabase/server";

type AlbumRow = {
  id: string;
  title: string;
  release_year: number;
  created_at: string;
  tracks: { count: number }[];
};

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("albums")
    .select("id,title,release_year,created_at,tracks(count)")
    .order("created_at", { ascending: false });

  const albums = (data || []) as AlbumRow[];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-8">
        <h1 className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-3xl font-bold tracking-widest text-transparent uppercase">
          MADDOX CHAIN
        </h1>
      </header>
      {albums.length === 0 ? (
        <p className="text-muted-foreground">No albums yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {albums.map((a) => (
            <AlbumCard key={a.id} album={{ id: a.id, title: a.title, release_year: a.release_year }} />
          ))}
        </div>
      )}
    </div>
  );
}
