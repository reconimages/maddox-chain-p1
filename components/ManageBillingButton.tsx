'use client';

import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function ManageBillingButton() {
  const router = useRouter();

  async function onClick() {
    const res = await fetch('/api/stripe/portal', { method: 'POST' });
    const j = await res.json().catch(() => ({}));
    if (res.status === 401) {
      router.push('/auth/login?next=/profile');
      return;
    }
    if (res.status === 400) {
      toast.error('No subscription on file.');
      return;
    }
    if (j?.url) {
      window.location.href = j.url;
      return;
    }
    toast.error(j?.error || 'Failed.');
  }

  return <Button onClick={onClick}>Manage billing</Button>;
}