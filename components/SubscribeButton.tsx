'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function SubscribeButton({
  interval,
  label,
}: {
  interval: 'month' | 'year';
  label: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interval }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.status === 401) {
        toast.error('Please sign in.');
        router.push('/auth/login?next=/subscribe');
        return;
      }
      if (res.status === 409) {
        toast.error('You are already subscribed.');
        router.push('/');
        return;
      }
      if (j?.url) {
        window.location.href = j.url;
        return;
      }
      toast.error(j?.error || 'Checkout failed.');
    } catch (e: any) {
      toast.error(e?.message || 'Checkout failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={onClick} disabled={loading} className="w-full">
      {loading ? 'Redirecting...' : label}
    </Button>
  );
}