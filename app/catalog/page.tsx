import { createClient } from '@/lib/supabase/server';
import CatalogView from '@/components/CatalogView';

export const dynamic = 'force-dynamic';

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const sp = await searchParams;
  const initialType =
    sp?.type === 'album' || sp?.type === 'single' ? sp.type : 'all';

  const supabase = await createClient();
  const { data } = await supabase
    .from('albums')
    .select('id, title, release_year, created_at, tracks(is_vault)')
    .order('release_year', { ascending: false })
    .order('created_at', { ascending: false });

  const albums = (data || [])
    .map((a: any) => {
      const ts = a.tracks || [];
      return {
        id: a.id,
        title: a.title,
        release_year: a.release_year,
        created_at: a.created_at,
        public_track_count: ts.filter((t: any) => !t.is_vault).length,
      };
    })
    .filter((a: any) => a.public_track_count > 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="py-6">
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-zinc-100">
          Full Catalog
        </h1>
        <p className="text-base text-zinc-400 mt-2 max-w-2xl">
          Every Maddox Chain release in one place. Albums and singles,
          newest first. Full playback requires a VIP subscription; free
          accounts get 30-second previews of every track.
        </p>
      </div>
      <CatalogView albums={albums} initialType={initialType} />
    </div>
  );
}