import { StatCard } from './StatCard';

export function PlaysSection({ data }: { data: any }) {
  return (
    <section>
      <h2 className="text-xl font-bold uppercase tracking-wide text-zinc-100 mb-4">Plays</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatCard label="Total Plays" value={data.totalAllTime.toLocaleString()} />
        <StatCard label="Last 30 Days" value={data.total30.toLocaleString()} />
        <StatCard label="Last 7 Days" value={data.total7.toLocaleString()} />
        <StatCard label="Paid %" value={`${data.paidPercent}%`} subtext={`${data.paidAllTime} paid / ${data.freeAllTime} free`} />
      </div>

      {/* By user type */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 mb-4">
        <h3 className="text-sm font-semibold text-zinc-200 mb-3">By User Type</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-left text-zinc-500">
              <th className="py-1">Type</th>
              <th className="py-1 text-right">Plays</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-zinc-800/50">
              <td className="py-1">Anonymous</td>
              <td className="py-1 text-right">{data.byUserType.anonymous.toLocaleString()}</td>
            </tr>
            <tr className="border-b border-zinc-800/50">
              <td className="py-1">Signed-in Free</td>
              <td className="py-1 text-right">{data.byUserType.signed_in_free.toLocaleString()}</td>
            </tr>
            <tr>
              <td className="py-1">Paid</td>
              <td className="py-1 text-right">{data.byUserType.paid.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Per day table */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 mb-4">
        <h3 className="text-sm font-semibold text-zinc-200 mb-3">Plays Per Day (Last 30 Days)</h3>
        {data.perDay30.length === 0 ? (
          <p className="text-sm text-zinc-500">No play events yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-zinc-500">
                <th className="py-1">Date</th>
                <th className="py-1 text-right">Plays</th>
              </tr>
            </thead>
            <tbody>
              {data.perDay30.slice().reverse().map((d: any) => (
                <tr key={d.date} className="border-b border-zinc-800/50">
                  <td className="py-1">{d.date}</td>
                  <td className="py-1 text-right">{d.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Top tracks */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 mb-4">
        <h3 className="text-sm font-semibold text-zinc-200 mb-3">Top 20 Most Played Tracks</h3>
        {data.topTracks.length === 0 ? (
          <p className="text-sm text-zinc-500">No play events yet. Data starts collecting from this deploy. Play a track and refresh this page to see it appear.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-zinc-500">
                <th className="py-1">#</th>
                <th className="py-1">Title</th>
                <th className="py-1">Album</th>
                <th className="py-1 text-right">Plays</th>
                <th className="py-1 text-right">Listeners</th>
              </tr>
            </thead>
            <tbody>
              {data.topTracks.map((t: any, i: number) => (
                <tr key={t.id} className="border-b border-zinc-800/50">
                  <td className="py-1">{i + 1}</td>
                  <td className="py-1 truncate max-w-[180px]">{t.title}</td>
                  <td className="py-1 truncate max-w-[180px] text-zinc-400">{t.album_title}</td>
                  <td className="py-1 text-right">{t.plays}</td>
                  <td className="py-1 text-right">{t.unique_listeners}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Top vault tracks */}
      {data.topVaultTracks.length > 0 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <h3 className="text-sm font-semibold text-zinc-200 mb-3">Top 10 Most Played Vault Tracks</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-zinc-500">
                <th className="py-1">#</th>
                <th className="py-1">Title</th>
                <th className="py-1">Album</th>
                <th className="py-1 text-right">Plays</th>
                <th className="py-1 text-right">Listeners</th>
              </tr>
            </thead>
            <tbody>
              {data.topVaultTracks.map((t: any, i: number) => (
                <tr key={t.id} className="border-b border-zinc-800/50">
                  <td className="py-1">{i + 1}</td>
                  <td className="py-1 truncate max-w-[180px]">{t.title}</td>
                  <td className="py-1 truncate max-w-[180px] text-zinc-400">{t.album_title}</td>
                  <td className="py-1 text-right">{t.plays}</td>
                  <td className="py-1 text-right">{t.unique_listeners}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}