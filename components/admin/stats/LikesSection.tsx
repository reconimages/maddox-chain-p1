import { StatCard } from './StatCard';

function Table({ title, rows, emptyMsg, countLabel }: { title: string; rows: { title: string; album: string; count: number }[]; emptyMsg: string; countLabel: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <h3 className="text-sm font-semibold text-zinc-200 mb-3">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-zinc-500">{emptyMsg}</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-left text-zinc-500">
              <th className="py-1 pr-2">Title</th>
              <th className="py-1 pr-2">Album</th>
              <th className="py-1 text-right">{countLabel}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-zinc-800/50">
                <td className="py-1 pr-2 truncate max-w-[180px]">{r.title}</td>
                <td className="py-1 pr-2 truncate max-w-[180px] text-zinc-400">{r.album}</td>
                <td className="py-1 text-right">{r.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export function LikesSection({ data }: { data: any }) {
  return (
    <section>
      <h2 className="text-xl font-bold uppercase tracking-wide text-zinc-100 mb-4">Likes & Playlists</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        <StatCard label="Total Likes" value={data.totalLikes.toLocaleString()} />
        <StatCard label="Total Playlists" value={data.totalPlaylists.toLocaleString()} />
        <StatCard label="Avg Playlist Size" value={data.avgPlaylistSize} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Table title="Top Liked Tracks" rows={data.topLikedTracks} emptyMsg="No likes yet." countLabel="Likes" />
        <Table title="Most Playlisted" rows={data.topPlaylistedTracks} emptyMsg="No playlists yet." countLabel="Playlists" />
      </div>
    </section>
  );
}