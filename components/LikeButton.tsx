'use client';

import { useState, useTransition } from 'react';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { toggleLike } from '@/lib/actions/library';

export default function LikeButton({
  trackId,
  initialLiked,
  isSignedIn,
}: {
  trackId: string;
  initialLiked: boolean;
  isSignedIn: boolean;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!isSignedIn) {
      toast('Sign in to like songs');
      return;
    }
    const next = !liked;
    setLiked(next);
    startTransition(async () => {
      const res = await toggleLike(trackId);
      if (res?.error) {
        setLiked(!next);
        toast.error(res.error);
      }
    });
  }

  return (
    <button
      onClick={onClick}
      disabled={pending}
      aria-label={liked ? 'Unlike' : 'Like'}
      className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent disabled:opacity-50"
    >
      <Heart
        className={`h-4 w-4 ${liked ? 'fill-amber-500 text-amber-500' : 'text-zinc-400'}`}
      />
    </button>
  );
}