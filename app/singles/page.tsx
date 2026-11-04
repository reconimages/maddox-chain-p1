import { createClient } from "@/lib/supabase/server";
import AlbumCard from "@/components/AlbumCard";

export const dynamic = "force-dynamic";

export default async function SinglesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("albums")
    .select("id,title,release_year,created_at,tracks(count)")
    .eq("is_single", true)
    .order("created_at", { ascending: false });

  const singles = data || [];
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold tracking-widest">SINGLES</h1>
      {singles.length === 0 ? (
        <p className="text-muted-foreground">No singles yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {singles.map((s: any) => (
            <AlbumCard key={s.id} album={{ id: s.id, title: s.title, release_year: s.release_year }} />
          ))}
        </div>
      )}
    </div>
  );
}
