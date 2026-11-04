import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAccess } from '@/lib/access';
import { createClient } from '@/lib/supabase/server';
import AlbumCard from '@/components/AlbumCard';

export const dynamic = 'force-dynamic';

export default async function VaultPage() {
  const access = await getAccess();

  const supabase = await createClient();

  // Fetch vault albums (albums where all tracks are vault)
  const { data } = await supabase
    .from('albums')
    .select('id,title,release_year,created_at,tracks(is_vault)')
    .order('created_at', { ascending: false });

  const vaultAlbums = (data || []).filter((a: any) => {
    const ts = a.tracks || [];
    return ts.length > 0 && ts.every((t: any) => t.is_vault);
  });

  if (!access.hasFullAccess) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 text-center">
        <h1 className="mb-4 text-3xl font-bold text-amber-500">The VIP Vault</h1>
        <p className="mb-8 text-muted-foreground">
          Unreleased tracks, demos, and B-sides that will never appear on Spotify or Apple Music.
        </p>
        {vaultAlbums.length > 0 && (
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {vaultAlbums.map((a: any) => (
              <div key={a.id} className="relative">
                <div className="aspect-square w-full overflow-hidden rounded-md bg-muted opacity-40">
                  <img src={`/api/covers/${a.id}`} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl">🔒</span>
                </div>
              </div>
            ))}
          </div>
        )}
        <Link
          href={access.user ? '/subscribe' : '/auth/login?next=/subscribe'}
          className="inline-block rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Join to listen
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-amber-500">The VIP Vault</h1>
        <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-500">
          Your access is active
        </span>
      </div>
      {vaultAlbums.length === 0 ? (
        <p className="text-muted-foreground">The vault is empty. New exclusive tracks will appear here.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {vaultAlbums.map((a: any) => (
            <Link key={a.id} href={`/vault/${a.id}`} className="group block">
              <div className="aspect-square w-full overflow-hidden rounded-md bg-muted relative">
                <img src={`/api/covers/${a.id}`} alt={a.title} loading="lazy" className="h-full w-full object-cover" />
                <div className="absolute top-2 right-2">
                  <span className="rounded-full bg-amber-500/80 px-2 py-0.5 text-xs font-bold text-black">VAULT</span>
                </div>
              </div>
              <div className="mt-2">
                <p className="truncate text-sm font-medium">{a.title}</p>
                <p className="text-xs text-muted-foreground">{a.release_year}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
      <p className="mt-8 text-xs text-muted-foreground">
        Vault content is for VIP members only. Please do not share or redistribute.
      </p>
    </div>
  );
}