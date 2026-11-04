import { redirect, notFound } from 'next/navigation';
import { isAdminRequest } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import EditTrackForm from '@/components/admin/EditTrackForm';

export const dynamic = 'force-dynamic';

export default async function EditTrackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isAdminRequest())) redirect('/admin/login');
  const { id } = await params;
  const supabase = createAdminClient();
  const { data: track } = await supabase.from('tracks').select('*').eq('id', id).single();
  if (!track) notFound();
  return <EditTrackForm track={track} />;
}