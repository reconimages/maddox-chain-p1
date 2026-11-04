import { StatCard } from './StatCard';

function fmtDur(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function CatalogSection({ data }: { data: any }) {
  return (
    <section>
      <h2 className="text-xl font-bold uppercase tracking-wide text-zinc-100 mb-4">Catalog</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Albums" value={data.albums.toLocaleString()} />
        <StatCard label="Singles" value={data.singles.toLocaleString()} />
        <StatCard label="Public Tracks" value={data.publicTracks.toLocaleString()} />
        <StatCard label="Vault Tracks" value={data.vaultTracks.toLocaleString()} />
        <StatCard label="Total Duration" value={fmtDur(data.totalDurationSeconds)} />
      </div>
    </section>
  );
}