"use client";

import { useEffect, useRef, useState } from "react";
import { usePlayer } from "@/lib/player-context";
import { toast } from "sonner";
import { trackPlay } from "@/lib/play-tracker";
import { Play, Pause, Volume2, VolumeX, SkipForward, SkipBack, Shuffle, Repeat, Repeat1 } from "lucide-react";

function fmt(s: number) {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = String(Math.floor(s % 60)).padStart(2, "0");
  return `${m}:${sec}`;
}

export default function PlayerBar() {
  const { currentTrack, isPlaying, setIsPlaying, currentTime, setCurrentTime, duration, setDuration, hasFullAccess, queue, shuffle, repeat, next, prev, toggleShuffle, toggleRepeat } =
    usePlayer();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = muted ? 0 : volume;
  }, [volume, muted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    audio.src = `/api/audio/${currentTrack.id}`;
    audio.load();
    if (isPlaying) {
      audio.play().catch(() => {});
    }
    trackPlay(currentTrack.id);
  }, [currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.play().catch(() => {});
    else audio.pause();
  }, [isPlaying]);

  function handleEnded() {
    if (repeat === "one") {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
      return;
    }
    next();
  }

  return (
    <>
      {showPrompt && !hasFullAccess && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-md border border-border bg-background px-4 py-2 text-sm shadow-lg">
          Preview ended.{' '}
          <a href="/subscribe" className="text-primary underline">Subscribe to continue</a>
          <button onClick={() => setShowPrompt(false)} className="ml-2 text-muted-foreground">✕</button>
        </div>
      )}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur">
        <audio
          ref={audioRef}
          onTimeUpdate={(e) => {
            const t = (e.target as HTMLAudioElement).currentTime;
            setCurrentTime(t);
            if (!hasFullAccess && t >= 30) {
              const audio = e.target as HTMLAudioElement;
              audio.pause();
              audio.currentTime = 30;
              setIsPlaying(false);
              setShowPrompt(true);
            }
          }}
          onLoadedMetadata={(e) => setDuration((e.target as HTMLAudioElement).duration)}
          onError={() => {
            const audio = audioRef.current;
            if (audio) {
              audio.pause();
              audio.removeAttribute('src');
              audio.load();
            }
            setIsPlaying(false);
            toast.error('This track requires an active VIP subscription.', {
              action: { label: 'Upgrade', onClick: () => { window.location.href = '/subscribe'; } },
            });
          }}
          onEnded={handleEnded}
        />
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-muted">
            {currentTrack ? (
              <img
                src={`/api/covers/${currentTrack.albumId}`}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            {currentTrack ? (
              <>
                <p className="truncate text-sm font-medium">{currentTrack.title}</p>
                <p className="truncate text-xs text-muted-foreground">{currentTrack.albumTitle}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Nothing playing</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleShuffle}
              disabled={!currentTrack}
              className={`flex h-8 w-8 items-center justify-center rounded-md ${shuffle ? 'text-primary' : 'text-muted-foreground'} hover:text-foreground disabled:opacity-40`}
              aria-label="Shuffle"
            >
              <Shuffle className="h-4 w-4" />
            </button>
            <button
              onClick={prev}
              disabled={!currentTrack || queue.length <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground disabled:opacity-40"
              aria-label="Previous"
            >
              <SkipBack className="h-4 w-4" />
            </button>
            <button
              onClick={() => currentTrack && setIsPlaying(!isPlaying)}
              disabled={!currentTrack}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button
              onClick={next}
              disabled={!currentTrack || queue.length <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground disabled:opacity-40"
              aria-label="Next"
            >
              <SkipForward className="h-4 w-4" />
            </button>
            <button
              onClick={toggleRepeat}
              disabled={!currentTrack}
              className={`flex h-8 w-8 items-center justify-center rounded-md ${repeat !== 'off' ? 'text-primary' : 'text-muted-foreground'} hover:text-foreground disabled:opacity-40`}
              aria-label="Repeat"
            >
              {repeat === 'one' ? <Repeat1 className="h-4 w-4" /> : <Repeat className="h-4 w-4" />}
            </button>
          </div>
          <div className="hidden w-48 items-center gap-2 sm:flex">
            <span className="text-xs text-muted-foreground">{fmt(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              onChange={(e) => {
                const v = Number(e.target.value);
                setCurrentTime(v);
                if (audioRef.current) audioRef.current.currentTime = v;
              }}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground">{fmt(duration)}</span>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <button
              onClick={() => setMuted(!muted)}
              className="text-muted-foreground hover:text-foreground"
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : volume}
              onChange={(e) => {
                setVolume(Number(e.target.value));
                setMuted(false);
              }}
              className="w-20"
            />
          </div>
        </div>
      </div>
    </>
  );
}