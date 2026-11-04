import AlbumCard from "@/components/AlbumCard";
import { createClient } from "@/lib/supabase/server";
import { getAccess } from "@/lib/access";
import CheckoutPoller from "@/components/CheckoutPoller";

type AlbumRow = {
  id: string;
  title: string;
  release_year: number;
  created_at: string;
  tracks: { count: number }[];
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("albums")
    .select("id,title,release_year,created_at,tracks(count)")
    .order("created_at", { ascending: false });

  const albums = (data || []) as AlbumRow[];
  const sp = await searchParams;
  const access = await getAccess();
  const showCheckoutBanner = sp?.checkout === 'success' && !!access.user && !access.hasFullAccess;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {showCheckoutBanner && (
        <div className="mb-6 rounded-md border border-border bg-muted p-4 text-sm">
          Payment received. Activating your account…
          <CheckoutPoller />
        </div>
      )}
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
