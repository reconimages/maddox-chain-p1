import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AlbumShortRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: album } = await supabase
    .from('albums')
    .select('id')
    .eq('id', id)
    .single();

  if (!album) notFound();

  // Check if vault album (all tracks vault)
  const { data: tracks } = await supabase
    .from('tracks')
    .select('is_vault')
    .eq('album_id', id);

  const isVault = (tracks || []).length > 0 && (tracks || []).every((t: any) => t.is_vault);
  if (isVault) redirect(`/vault/${id}`);
  redirect(`/albums/${id}?share=1`);
}