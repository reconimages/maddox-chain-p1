import { StatCard } from './StatCard';

function fmtDur(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function VaultSection({ data }: { data: any }) {
  return (
    <section>
      <h2 className="text-xl font-bold uppercase tracking-wide text-zinc-100 mb-4">Vault</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Vault Albums" value={data.vaultAlbums.toLocaleString()} />
        <StatCard label="Vault Tracks" value={data.vaultTracks.toLocaleString()} />
        <StatCard label="Vault Duration" value={fmtDur(data.vaultDurationSeconds)} />
        <StatCard label="Vault Tracks Liked" value={data.vaultLikes.toLocaleString()} />
      </div>
    </section>
  );
}