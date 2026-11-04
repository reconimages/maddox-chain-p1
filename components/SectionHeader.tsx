export default function SectionHeader({
  title,
  subtitle,
  count,
}: {
  title: string;
  subtitle?: string;
  count?: number;
}) {
  return (
    <div className="flex items-baseline justify-between mb-4 mt-12">
      <div>
        <h2 className="text-xl md:text-2xl font-bold uppercase tracking-wide text-zinc-100">
          {title}
        </h2>
        {subtitle && <p className="text-sm text-zinc-500 mt-1">{subtitle}</p>}
      </div>
      {count !== undefined && (
        <span className="text-xs text-zinc-500 font-mono">
          {count} {count === 1 ? 'release' : 'releases'}
        </span>
      )}
    </div>
  );
}