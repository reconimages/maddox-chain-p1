import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function TrackShortRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: track } = await supabase
    .from('tracks')
    .select('id, album_id, is_vault')
    .eq('id', id)
    .single();

  if (!track) notFound();
  if (track.is_vault) redirect('/vault');
  redirect(`/albums/${track.album_id}?track=${track.id}&share=1`);
}