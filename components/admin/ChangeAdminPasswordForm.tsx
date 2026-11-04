'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function ChangeAdminPasswordForm() {
  const router = useRouter();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < 12) {
      toast.error('New password must be at least 12 characters.');
      return;
    }
    if (next !== confirm) {
      toast.error('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current, next, confirm }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(j?.error || 'Failed.');
        return;
      }
      toast.success('Password changed. Please sign in again.');
      router.push('/admin/login');
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cur">Current password</Label>
        <Input id="cur" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="nw">New password (min 12 chars)</Label>
        <Input id="nw" type="password" value={next} onChange={(e) => setNext(e.target.value)} required minLength={12} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cf">Confirm new password</Label>
        <Input id="cf" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={12} />
      </div>
      <Button type="submit" disabled={loading}>{loading ? 'Updating...' : 'Change password'}</Button>
    </form>
  );
}