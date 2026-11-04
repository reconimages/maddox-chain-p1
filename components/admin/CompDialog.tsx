'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

function addMonths(date: Date, months: number): string {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function addYears(date: Date, years: number): string {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().slice(0, 10);
}

export default function CompDialog({
  userId,
  userEmail,
  currentComp,
  currentNote,
  onClose,
}: {
  userId: string;
  userEmail: string;
  currentComp: string | null;
  currentNote?: string | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const today = new Date();
  const defaultDate = addMonths(today, 1);

  const [date, setDate] = useState(currentComp ? currentComp.slice(0, 10) : defaultDate);
  const [note, setNote] = useState(currentNote || '');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'grant' | 'view'>(currentComp && new Date(currentComp) > new Date() ? 'view' : 'grant');

  const isActiveComp = currentComp !== null && new Date(currentComp) > new Date();
  const isExpiredComp = currentComp !== null && new Date(currentComp) <= new Date();

  async function grant() {
    setLoading(true);
    try {
      const until = new Date(date + 'T23:59:59Z').toISOString();
      const res = await fetch(`/api/admin/subscribers/${userId}/comp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'grant', until, note: note.trim() || undefined }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(j?.error || 'Failed.');
        return;
      }
      toast.success(`VIP granted until ${date}.`);
      onClose();
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Failed.');
    } finally {
      setLoading(false);
    }
  }

  async function revoke() {
    if (!confirm('This user will lose VIP access immediately unless they have an active Stripe subscription. Continue?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/subscribers/${userId}/comp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revoke' }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(j?.error || 'Failed.');
        return;
      }
      toast.success('Comp revoked.');
      onClose();
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>VIP access for {userEmail}</DialogTitle>
          <DialogDescription>
            {isActiveComp
              ? `This user has complimentary VIP access until ${currentComp!.slice(0, 10)}.`
              : isExpiredComp
              ? `This user's comp expired on ${currentComp!.slice(0, 10)}.`
              : 'Grant complimentary VIP access. This bypasses Stripe — the user is not charged. Access expires on the date you choose.'}
          </DialogDescription>
        </DialogHeader>

        {currentNote && isActiveComp && (
          <p className="text-xs text-muted-foreground">Note: {currentNote}</p>
        )}

        {mode === 'view' && isActiveComp ? (
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setMode('grant')}>Change expiry</Button>
            <Button variant="destructive" onClick={revoke} disabled={loading}>
              {loading ? 'Revoking...' : 'Revoke comp'}
            </Button>
          </DialogFooter>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setDate(addMonths(today, 1))}>1 month</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setDate(addMonths(today, 3))}>3 months</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setDate(addMonths(today, 6))}>6 months</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setDate(addYears(today, 1))}>1 year</Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="comp-date">Grant VIP until</Label>
              <Input id="comp-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comp-note">Note (optional)</Label>
              <Input id="comp-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="Reason (optional, admin only)" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
              <Button onClick={grant} disabled={loading}>
                {loading ? 'Granting...' : `Grant VIP until ${date}`}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}