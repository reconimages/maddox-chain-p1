import { Music2, AudioLines } from 'lucide-react';

function StreamingLink({ href, name, icon }: { href: string; name: string; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Listen to Maddox Chain on ${name} (opens in a new tab)`}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900/50 text-zinc-300 text-sm font-medium hover:border-zinc-700 hover:text-white hover:bg-zinc-900 transition"
    >
      <span aria-hidden="true" className="w-4 h-4 flex items-center justify-center">
        {icon}
      </span>
      <span>{name}</span>
    </a>
  );
}

function SpotifyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="w-4 h-4">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.52 17.34c-.24.36-.66.48-1.02.24-2.82-1.74-6.36-2.1-10.56-1.14-.42.12-.78-.18-.9-.54-.12-.42.18-.78.54-.9 4.56-1.02 8.52-.6 11.64 1.32.42.18.48.66.3 1.02zm1.44-3.18c-.3.42-.84.6-1.26.3-3.24-1.98-8.16-2.58-11.94-1.38-.48.12-1.02-.12-1.14-.6-.12-.48.12-1.02.6-1.14 4.38-1.32 9.78-.66 13.5 1.62.36.18.54.78.24 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.3c-.54.18-1.14-.18-1.32-.72-.18-.54.18-1.14.72-1.32 4.26-1.26 11.28-1.02 15.72 1.62.48.3.66.96.36 1.44-.3.36-.96.54-1.44.24z" />
    </svg>
  );
}

export default function StreamingLinks() {
  return (
    <section aria-label="Also streaming on" className="mt-4">
      <p className="text-xs uppercase tracking-widest text-zinc-500 mb-3">
        Also streaming on
      </p>
      <div className="flex flex-wrap gap-3">
        <StreamingLink href="https://open.spotify.com/artist/7ppocQQMtcAh0RSJ3HPFe7" name="Spotify" icon={<SpotifyIcon />} />
        <StreamingLink href="https://music.apple.com/us/artist/maddox-chain/1896651470" name="Apple Music" icon={<Music2 className="w-4 h-4" />} />
        <StreamingLink href="https://www.youtube.com/channel/UClkaOIrbvOLOAV0pgOqohbw" name="YouTube" icon={<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="w-4 h-4"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>} />
        <StreamingLink href="https://www.soundon.global/bio/maddoxchain" name="SoundOn" icon={<AudioLines className="w-4 h-4" />} />
      </div>
    </section>
  );
}