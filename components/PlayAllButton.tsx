'use client';

import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import { usePlayer } from '@/lib/player-context';

export default function PlayAllButton({
  tracks,
}: {
  tracks: Array<{ id: string; title: string; album_id?: string; albums?: { title: string } }>;
}) {
  const { playTrack } = usePlayer();
  if (!tracks.length) return null;
  return (
    <Button
      onClick={() => {
        const t = tracks[0];
        playTrack({
          id: t.id,
          title: t.title,
          albumTitle: t.albums?.title ?? '',
          albumId: t.album_id ?? '',
        });
      }}
    >
      <Play className="mr-2 h-4 w-4" /> Play all
    </Button>
  );
}