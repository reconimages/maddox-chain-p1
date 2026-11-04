"use client";

import { Play } from "lucide-react";
import { usePlayer } from "@/lib/player-context";

type Track = {
  id: string;
  title: string;
  track_number: number;
  duration_seconds: number;
};

export default function TrackRow({
  track,
  albumTitle,
  albumId,
}: {
  track: Track;
  albumTitle: string;
  albumId: string;
}) {
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const currentTrackId = currentTrack?.id ?? null;  const mm = Math.floor(track.duration_seconds / 60);
  const ss = String(track.duration_seconds % 60).padStart(2, "0");
  const active = currentTrackId === track.id;
  return (
    <button
      onClick={() =>
        playTrack({ id: track.id, title: track.title, albumTitle, albumId })
      }
      className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-accent/50"
    >
      <span className="w-6 text-center text-xs text-muted-foreground">
        {active && isPlaying ? "❚❚" : track.track_number}
      </span>
      <Play className="h-4 w-4 text-muted-foreground" />
      <span className="flex-1 truncate text-sm">{track.title}</span>
      <span className="text-xs text-muted-foreground">
        {mm}:{ss}
      </span>
    </button>
  );
}
