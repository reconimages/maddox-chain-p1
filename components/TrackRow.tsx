'use client';

import { Play } from 'lucide-react';
import { Heart, ListPlus, ChevronUp, ChevronDown, X } from 'lucide-react';
import { usePlayer } from '@/lib/player-context';
import LikeButton from '@/components/LikeButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { addTrackToPlaylist } from '@/lib/actions/library';

type Track = {
  id: string;
  title: string;
  track_number: number;
  duration_seconds: number;
};

type Playlist = { id: string; name: string };

export default function TrackRow({
  track,
  albumTitle,
  albumId,
  isSignedIn = false,
  initialLiked = false,
  playlists,
  rowActions,
}: {
  track: Track;
  albumTitle: string;
  albumId: string;
  isSignedIn?: boolean;
  initialLiked?: boolean;
  playlists?: Playlist[];
  rowActions?: React.ReactNode;
}) {
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const currentTrackId = currentTrack?.id ?? null;
  const mm = Math.floor(track.duration_seconds / 60);
  const ss = String(track.duration_seconds % 60).padStart(2, '0');
  const active = currentTrackId === track.id;

  async function handleAdd(playlistId: string, name: string) {
    const res = await addTrackToPlaylist(playlistId, track.id);
    if (res?.error) toast.error(res.error);
    else toast.success(`Added to ${name}`);
  }

  return (
    <div className="flex w-full items-center gap-3 rounded-md px-2 py-2 hover:bg-accent/50">
      <button
        onClick={() =>
          playTrack({ id: track.id, title: track.title, albumTitle, albumId })
        }
        className="flex flex-1 items-center gap-3 text-left"
      >
        <span className="w-6 text-center text-xs text-muted-foreground">
          {active && isPlaying ? '❚❚' : track.track_number}
        </span>
        <Play className="h-4 w-4 text-muted-foreground" />
        <span className="flex-1 truncate text-sm">{track.title}</span>
        <span className="text-xs text-muted-foreground">
          {mm}:{ss}
        </span>
      </button>
      {isSignedIn && (
        <div className="flex items-center gap-1">
          <LikeButton trackId={track.id} initialLiked={initialLiked} isSignedIn={isSignedIn} />
          {playlists && playlists.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ListPlus className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {playlists.map((p) => (
                  <DropdownMenuItem key={p.id} onClick={() => handleAdd(p.id, p.name)}>
                    {p.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : isSignedIn && playlists ? (
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled title="No playlists yet">
              <ListPlus className="h-4 w-4 opacity-40" />
            </Button>
          ) : null}
        </div>
      )}
      {rowActions && <div className="flex items-center gap-1">{rowActions}</div>}
    </div>
  );
}