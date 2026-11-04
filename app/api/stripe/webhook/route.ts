import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'missing signature' }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const setStatusForCustomer = async (customerId: string, status: 'active' | 'past_due' | 'canceled' | 'free', subscriptionId?: string) => {
    const update: Record<string, unknown> = {
      subscription_status: status,
      updated_at: new Date().toISOString(),
    };
    if (subscriptionId) update.stripe_subscription_id = subscriptionId;
    await supabase.from('profiles').update(update).eq('stripe_customer_id', customerId);
  };

  function mapStripeStatus(s: Stripe.Subscription.Status): 'active' | 'past_due' | 'canceled' | 'free' {
    switch (s) {
      case 'active':
      case 'trialing':
        return 'active';
      case 'past_due':
      case 'unpaid':
        return 'past_due';
      case 'canceled':
      case 'incomplete_expired':
        return 'canceled';
      default:
        return 'free';
    }
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
        const userId = session.client_reference_id;
        if (!customerId || !userId) break;
        await supabase.from('profiles').update({
          stripe_customer_id: customerId,
          subscription_status: 'active',
          updated_at: new Date().toISOString(),
        }).eq('id', userId);
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
        const mapped = mapStripeStatus(sub.status);
        await setStatusForCustomer(customerId, mapped, sub.id);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
        await setStatusForCustomer(customerId, 'canceled', sub.id);
        break;
      }
      case 'invoice.payment_failed': {
        const inv = event.data.object as Stripe.Invoice;
        const customerId = typeof inv.customer === 'string' ? inv.customer : inv.customer?.id;
        if (customerId) await setStatusForCustomer(customerId, 'past_due');
        break;
      }
      case 'invoice.payment_succeeded': {
        const inv = event.data.object as Stripe.Invoice;
        const customerId = typeof inv.customer === 'string' ? inv.customer : inv.customer?.id;
        if (customerId) await setStatusForCustomer(customerId, 'active');
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error('webhook handler error', err);
  }

  return NextResponse.json({ received: true });
}