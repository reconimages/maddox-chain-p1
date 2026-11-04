import { createClient } from "@/lib/supabase/server";
import AlbumCard from "@/components/AlbumCard";

export const dynamic = "force-dynamic";

export default async function AlbumsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("albums")
    .select("id,title,release_year,created_at,tracks(count)")
    .eq("is_single", false)
    .order("created_at", { ascending: false });

  const albums = data || [];
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold tracking-widest">ALBUMS</h1>
      {albums.length === 0 ? (
        <p className="text-muted-foreground">No albums yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {albums.map((a: any) => (
            <AlbumCard key={a.id} album={{ id: a.id, title: a.title, release_year: a.release_year }} />
          ))}
        </div>
      )}
    </div>
  );
}
