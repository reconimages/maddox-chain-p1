'use client';

import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export default function ShareMenu({
  kind,
  id,
  title,
}: {
  kind: 'track' | 'album';
  id: string;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const shortUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/${kind === 'track' ? 't' : 'a'}/${id}`
    : '';

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shortUrl);
      toast.success('Link copied');
    } catch {
      toast.error('Failed to copy');
    }
    setOpen(false);
  }

  function shareX() {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${title} by Maddox Chain`)}&url=${encodeURIComponent(shortUrl)}`,
      '_blank',
      'noopener,noreferrer'
    );
    setOpen(false);
  }

  function shareWhatsApp() {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${title} by Maddox Chain ${shortUrl}`)}`,
      '_blank',
      'noopener,noreferrer'
    );
    setOpen(false);
  }

  function shareFacebook() {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shortUrl)}`,
      '_blank',
      'noopener,noreferrer'
    );
    setOpen(false);
  }

  function shareTelegram() {
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(shortUrl)}&text=${encodeURIComponent(`${title} by Maddox Chain`)}`,
      '_blank',
      'noopener,noreferrer'
    );
    setOpen(false);
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: `${title} by Maddox Chain`, url: shortUrl });
      } catch {
        // user cancelled
      }
    }
    setOpen(false);
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Share">
          <Share2 className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={copyLink}>Copy link</DropdownMenuItem>
        <DropdownMenuItem onClick={shareX}>Share on X</DropdownMenuItem>
        <DropdownMenuItem onClick={shareWhatsApp}>Share on WhatsApp</DropdownMenuItem>
        <DropdownMenuItem onClick={shareFacebook}>Share on Facebook</DropdownMenuItem>
        <DropdownMenuItem onClick={shareTelegram}>Share on Telegram</DropdownMenuItem>
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <DropdownMenuItem onClick={nativeShare}>Share…</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}