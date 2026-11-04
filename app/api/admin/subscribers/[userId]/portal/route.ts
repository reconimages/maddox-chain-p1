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
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();
  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: 'No subscription on file' }, { status: 404 });
  }
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;
  const portal = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${siteUrl}/admin/subscribers`,
  });
  return NextResponse.json({ url: portal.url });
}