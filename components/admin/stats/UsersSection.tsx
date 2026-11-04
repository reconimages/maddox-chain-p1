import { StatCard } from './StatCard';

export function UsersSection({ data }: { data: any }) {
  return (
    <section>
      <h2 className="text-xl font-bold uppercase tracking-wide text-zinc-100 mb-4">Users</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Users" value={data.total.toLocaleString()} />
        <StatCard label="New Today" value={data.today.toLocaleString()} />
        <StatCard label="New Last 7d" value={data.last7.toLocaleString()} />
        <StatCard label="New Last 30d" value={data.last30.toLocaleString()} />
        {data.providerAvailable && (
          <StatCard label="Google / Email" value={`${data.google} / ${data.email}`} subtext="provider split" />
        )}
      </div>
      {!data.providerAvailable && (
        <p className="text-xs text-zinc-500 mt-2">Provider split not available (auth admin API unavailable).</p>
      )}
    </section>
  );
}