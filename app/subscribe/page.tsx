import { redirect } from 'next/navigation';
import { getAccess } from '@/lib/access';
import SubscribeButton from '@/components/SubscribeButton';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function SubscribePage() {
  const access = await getAccess();
  if (access.hasFullAccess) redirect('/');

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-center text-3xl font-bold">Join Maddox Chain VIP</h1>

      {access.user && access.status === 'past_due' && (
        <div className="mb-6 rounded-md border border-amber-500/50 bg-amber-500/10 p-4 text-sm text-amber-200">
          Your payment is past due. Update your payment method in the Customer Portal to keep full access.
        </div>
      )}
      {access.user && access.status === 'canceled' && (
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Your subscription was canceled. Resubscribe below to regain full access.
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Monthly */}
        <div className="rounded-xl border border-border p-6">
          <h2 className="text-xl font-bold">Monthly</h2>
          <p className="mt-2 text-4xl font-bold">$5.99</p>
          <p className="text-sm text-muted-foreground">PER MONTH</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>Full catalog</li>
            <li>Unreleased vault access</li>
            <li>Cancel anytime</li>
          </ul>
          <div className="mt-6">
            <SubscribeButton interval="month" label="Subscribe Monthly" />
          </div>
        </div>

        {/* Yearly */}
        <div className="rounded-xl border border-primary p-6 relative">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
            BEST VALUE
          </span>
          <h2 className="text-xl font-bold">Yearly</h2>
          <p className="mt-2 text-4xl font-bold">$50</p>
          <p className="text-sm text-muted-foreground">PER YEAR · SAVE 30%</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>Full catalog</li>
            <li>Unreleased vault access</li>
            <li>Cancel anytime</li>
          </ul>
          <div className="mt-6">
            <SubscribeButton interval="year" label="Subscribe Yearly" />
          </div>
        </div>
      </div>

      {!access.user && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already a member? <a href="/auth/login?next=/subscribe" className="text-primary underline">Sign in</a>
        </p>
      )}

      {access.user && (access.status === 'past_due') && (
        <div className="mt-6 text-center">
          <form action="/api/stripe/portal" method="post">
            <Button type="submit" variant="outline">Manage billing</Button>
          </form>
        </div>
      )}
    </div>
  );
}