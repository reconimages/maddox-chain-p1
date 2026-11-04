import { StatCard } from './StatCard';

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function ActivitySection({ data }: { data: any }) {
  return (
    <section>
      <h2 className="text-xl font-bold uppercase tracking-wide text-zinc-100 mb-4">Admin Activity</h2>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <StatCard label="Uploads 30d" value={data.uploads30.toLocaleString()} />
        <StatCard label="Deletes 30d" value={data.deletes30.toLocaleString()} />
        <StatCard label="Edits 30d" value={data.edits30.toLocaleString()} />
      </div>
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <h3 className="text-sm font-semibold text-zinc-200 mb-3">Recent Events</h3>
        {data.recentEvents.length === 0 ? (
          <p className="text-sm text-zinc-500">No admin activity yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-zinc-500">
                <th className="py-1 pr-2">Time</th>
                <th className="py-1 pr-2">Type</th>
                <th className="py-1">Summary</th>
              </tr>
            </thead>
            <tbody>
              {data.recentEvents.map((e: any) => (
                <tr key={e.id} className="border-b border-zinc-800/50">
                  <td className="py-1 pr-2 text-xs text-zinc-500">{relTime(e.created_at)}</td>
                  <td className="py-1 pr-2">{e.event_type}</td>
                  <td className="py-1 truncate max-w-[300px]">{e.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}