import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminRequest } from '@/lib/admin';

export const runtime = 'nodejs';

export async function POST(_req: Request, { params }: { params: Promise<{ userId: string }> }) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { userId } = await params;
  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_subscription_id')
    .eq('id', userId)
    .single();
  if (!profile?.stripe_subscription_id) {
    return NextResponse.json({ error: 'No subscription on file' }, { status: 404 });
  }
  await stripe.subscriptions.cancel(profile.stripe_subscription_id);
  return NextResponse.json({ ok: true });
}