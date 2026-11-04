import AlbumCard from "@/components/AlbumCard";
import { createClient } from "@/lib/supabase/server";
import { getAccess } from "@/lib/access";
import CheckoutPoller from "@/components/CheckoutPoller";
import Link from "next/link";

type AlbumRow = {
  id: string;
  title: string;
  release_year: number;
  created_at: string;
  tracks: { count: number; is_vault: boolean }[];
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("albums")
    .select("id,title,release_year,created_at,tracks(is_vault)")
    .order("created_at", { ascending: false });

  const allAlbums = (data || []) as AlbumRow[];

  // An album is "vault" if all its tracks are vault (or it has vault tracks and no public ones)
  const publicAlbums = allAlbums.filter((a) => {
    const ts = a.tracks || [];
    if (ts.length === 0) return true;
    return !ts.every((t) => t.is_vault);
  });
  const vaultAlbums = allAlbums.filter((a) => {
    const ts = a.tracks || [];
    return ts.length > 0 && ts.every((t) => t.is_vault);
  });

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
      {publicAlbums.length === 0 ? (
        <p className="text-muted-foreground">No albums yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {publicAlbums.map((a) => (
            <AlbumCard key={a.id} album={{ id: a.id, title: a.title, release_year: a.release_year }} />
          ))}
        </div>
      )}

      {vaultAlbums.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-bold tracking-widest text-amber-500">VIP VAULT — TEASER</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {vaultAlbums.map((a) => (
              <Link
                key={a.id}
                href={access.hasFullAccess ? `/vault/${a.id}` : (access.user ? '/subscribe' : '/auth/login?next=/subscribe')}
                className="group block relative"
              >
                <div className="aspect-square w-full overflow-hidden rounded-md bg-muted relative">
                  <img
                    src={`/api/covers/${a.id}`}
                    alt={a.title}
                    loading="lazy"
                    className="h-full w-full object-cover opacity-60"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-amber-500">VAULT</span>
                  </div>
                  <div className="absolute top-2 right-2">
                    <span className="text-lg">🔒</span>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="truncate text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.release_year}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}