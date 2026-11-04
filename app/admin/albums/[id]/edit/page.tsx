import { redirect, notFound } from 'next/navigation';
import { isAdminRequest } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import EditAlbumForm from '@/components/admin/EditAlbumForm';

export const dynamic = 'force-dynamic';

export default async function EditAlbumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isAdminRequest())) redirect('/admin/login');
  const { id } = await params;
  const supabase = createAdminClient();
  const { data: album } = await supabase.from('albums').select('*').eq('id', id).single();
  if (!album) notFound();
  return <EditAlbumForm album={album} />;
}