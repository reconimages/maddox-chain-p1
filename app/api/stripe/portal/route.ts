import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createServerSupabase, getSessionUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  const supabase = await createServerSupabase();
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: 'No subscription on file' }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;
  const portal = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${siteUrl}/profile`,
  });

  return NextResponse.json({ url: portal.url });
}