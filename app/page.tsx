import { getAccess } from '@/lib/access';
import { createClient } from '@/lib/supabase/server';
import HeroSection from '@/components/HeroSection';
import SectionHeader from '@/components/SectionHeader';
import EmptyState from '@/components/EmptyState';
import AlbumCard from '@/components/AlbumCard';
import Link from 'next/link';
import CheckoutPoller from '@/components/CheckoutPoller';

type AlbumRow = {
  id: string;
  title: string;
  release_year: number;
  created_at: string;
  public_track_count: number;
  vault_track_count: number;
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const supabase = await createClient();
  const { data: raw } = await supabase
    .from('albums')
    .select('id, title, release_year, created_at, tracks(is_vault)')
    .order('release_year', { ascending: false })
    .order('created_at', { ascending: false });

  const allAlbums = (raw || []).map((a: any) => {
    const ts = a.tracks || [];
    return {
      id: a.id,
      title: a.title,
      release_year: a.release_year,
      created_at: a.created_at,
      public_track_count: ts.filter((t: any) => !t.is_vault).length,
      vault_track_count: ts.filter((t: any) => t.is_vault).length,
    };
  });

  const publicAlbums = allAlbums.filter((a) => a.public_track_count > 0);
  const vaultAlbums = allAlbums.filter((a) => a.vault_track_count > 0 && a.public_track_count === 0);

  const albums = publicAlbums.filter((r) => r.public_track_count > 1);
  const singles = publicAlbums.filter((r) => r.public_track_count === 1);
  const newAlbums = albums.slice(0, 6);
  const newSingles = singles.slice(0, 6);

  const sp = await searchParams;
  const access = await getAccess();
  const showJoinCTA = !access.hasFullAccess;
  const showCheckoutBanner = sp?.checkout === 'success' && !!access.user && !access.hasFullAccess;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {showCheckoutBanner && (
        <div className="mb-6 rounded-md border border-border bg-muted p-4 text-sm">
          Payment received. Activating your account…
          <CheckoutPoller />
        </div>
      )}

      <HeroSection showJoinCTA={showJoinCTA} />

      <SectionHeader title="New Albums" subtitle="Latest full-length releases" count={newAlbums.length} />
      {newAlbums.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {newAlbums.map((a) => (
            <AlbumCard key={a.id} album={{ id: a.id, title: a.title, release_year: a.release_year }} />
          ))}
        </div>
      ) : (
        <EmptyState message="No albums yet. Check back soon." />
      )}

      <SectionHeader title="New Singles" subtitle="Latest single tracks" count={newSingles.length} />
      {newSingles.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {newSingles.map((a) => (
            <AlbumCard key={a.id} album={{ id: a.id, title: a.title, release_year: a.release_year }} />
          ))}
        </div>
      ) : (
        <EmptyState message="No singles yet. Check back soon." />
      )}

      {vaultAlbums.length > 0 && (
        <section className="mt-12">
          <SectionHeader title="VIP Vault" subtitle="Unreleased tracks. Subscribers only." count={vaultAlbums.length} />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
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