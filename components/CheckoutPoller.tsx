'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getMyStatus } from '@/lib/actions/status';

export default function CheckoutPoller() {
  const router = useRouter();

  useEffect(() => {
    let stopped = false;
    const start = Date.now();
    const interval = setInterval(async () => {
      if (stopped) return;
      if (Date.now() - start > 15000) {
        stopped = true;
        clearInterval(interval);
        return;
      }
      try {
        const res = await getMyStatus();
        if (res?.status === 'active') {
          stopped = true;
          clearInterval(interval);
          router.refresh();
        }
      } catch {
        // ignore
      }
    }, 2000);

    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, [router]);

  return null;
}