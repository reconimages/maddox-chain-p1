import { StatCard } from './StatCard';

export function SubscriptionsSection({ data }: { data: any }) {
  return (
    <section>
      <h2 className="text-xl font-bold uppercase tracking-wide text-zinc-100 mb-4">Subscriptions</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Active" value={data.active.toLocaleString()} />
        <StatCard label="Free" value={data.free.toLocaleString()} />
        <StatCard label="Past Due" value={data.pastDue.toLocaleString()} />
        <StatCard label="Canceled" value={data.canceled.toLocaleString()} />
        <StatCard label="Comped" value={data.comped.toLocaleString()} />
      </div>
      <div className="mt-3 space-y-1 text-sm text-zinc-400">
        <p>Conversion: {data.conversion}% of registered users are active.</p>
        <p>Churn (last 30 days): {data.churnLast30} cancellations (approximated from profile updated_at).</p>
      </div>
    </section>
  );
}