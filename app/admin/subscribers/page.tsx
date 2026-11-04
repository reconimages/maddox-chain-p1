import { redirect } from 'next/navigation';
import { isAdminRequest } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import SubscribersTable from '@/components/admin/SubscribersTable';

export const dynamic = 'force-dynamic';

export default async function AdminSubscribersPage() {
  if (!(await isAdminRequest())) redirect('/admin/login');

  const supabase = createAdminClient();
  const { data: rows } = await supabase
    .from('profiles')
    .select('id, email, created_at, subscription_status, stripe_customer_id, stripe_subscription_id, updated_at, comped_until, comped_by_note')
    .order('created_at', { ascending: false });

  const { count: compedCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .not('comped_until', 'is', null)
    .gt('comped_until', new Date().toISOString());

  const enriched = (rows || []).map((r: any) => ({
    id: r.id,
    email: r.email,
    created_at: r.created_at,
    subscription_status: r.subscription_status,
    stripeLinked: !!r.stripe_customer_id,
    updated_at: r.updated_at,
    comped_until: r.comped_until,
    comped_by_note: r.comped_by_note,
  }));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Subscribers</h1>
      <SubscribersTable rows={enriched} compedCount={compedCount ?? 0} />
    </div>
  );
}