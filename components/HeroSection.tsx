export default function HeroSection({ showJoinCTA }: { showJoinCTA: boolean }) {
  return (
    <div className="py-16 md:py-24 max-w-[720px]">
      <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight bg-gradient-to-r from-red-500 via-orange-400 to-amber-300 bg-clip-text text-transparent">
        MADDOX CHAIN
      </h1>
      <p className="text-lg md:text-xl text-zinc-300 mt-4 leading-relaxed">
        The official home of Maddox Chain. Stream the full catalog — albums,
        singles, and unreleased material that never reaches streaming
        services.
      </p>
      <p className="text-base text-zinc-400 mt-3 leading-relaxed">
        Free members get 30-second previews of every track. VIP members
        unlock full playback, the complete discography, and exclusive vault
        tracks with one subscription.
      </p>
      <div className="flex flex-wrap gap-3 mt-8">
        {showJoinCTA && (
          <a
            href="/subscribe"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-amber-400 to-orange-400 text-black font-bold text-sm uppercase tracking-wider hover:brightness-110 transition"
          >
            Join VIP — £5.99/mo
          </a>
        )}
        <a
          href="#catalog"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-zinc-700 text-zinc-200 font-semibold text-sm hover:bg-zinc-900 transition"
        >
          Explore the catalog
        </a>
      </div>
    </div>
  );
}