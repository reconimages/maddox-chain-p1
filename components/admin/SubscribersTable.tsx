'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

type Row = {
  id: string;
  email: string;
  created_at: string;
  subscription_status: string;
  stripeLinked: boolean;
  updated_at: string;
};

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const statusColor: Record<string, string> = {
  active: 'text-green-500',
  free: 'text-zinc-400',
  past_due: 'text-amber-500',
  canceled: 'text-red-500',
};

export default function SubscribersTable({ rows }: { rows: Row[] }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [manageTarget, setManageTarget] = useState<Row | null>(null);
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    let r = rows.filter((r) => r.email.toLowerCase().includes(search.toLowerCase()));
    if (filter !== 'all') r = r.filter((r) => r.subscription_status === filter);
    return r;
  }, [rows, search, filter]);

  const counts = {
    total: rows.length,
    active: rows.filter((r) => r.subscription_status === 'active').length,
    free: rows.filter((r) => r.subscription_status === 'free').length,
    past_due: rows.filter((r) => r.subscription_status === 'past_due').length,
    canceled: rows.filter((r) => r.subscription_status === 'canceled').length,
  };

  async function openPortal() {
    if (!manageTarget) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/subscribers/${manageTarget.id}/portal`, { method: 'POST' });
      const j = await res.json().catch(() => ({}));
      if (j?.url) window.location.href = j.url;
      else toast.error(j?.error || 'Failed.');
    } catch (e: any) {
      toast.error(e?.message || 'Failed.');
    } finally {
      setLoading(false);
    }
  }

  async function cancelSub() {
    if (!manageTarget) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/subscribers/${manageTarget.id}/cancel`, { method: 'POST' });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(j?.error || 'Failed.');
        return;
      }
      toast.success('Cancellation requested. Status will update via webhook.');
      setManageTarget(null);
    } catch (e: any) {
      toast.error(e?.message || 'Failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <div className="rounded-md border border-border p-3 text-center">
          <p className="text-2xl font-bold">{counts.total}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        <div className="rounded-md border border-border p-3 text-center">
          <p className="text-2xl font-bold text-green-500">{counts.active}</p>
          <p className="text-xs text-muted-foreground">Paid</p>
        </div>
        <div className="rounded-md border border-border p-3 text-center">
          <p className="text-2xl font-bold">{counts.free}</p>
          <p className="text-xs text-muted-foreground">Free</p>
        </div>
        <div className="rounded-md border border-border p-3 text-center">
          <p className="text-2xl font-bold text-amber-500">{counts.past_due}</p>
          <p className="text-xs text-muted-foreground">Past Due</p>
        </div>
        <div className="rounded-md border border-border p-3 text-center">
          <p className="text-2xl font-bold text-red-500">{counts.canceled}</p>
          <p className="text-xs text-muted-foreground">Canceled</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">All</option>
          <option value="active">Paid</option>
          <option value="free">Free</option>
          <option value="past_due">Past Due</option>
          <option value="canceled">Canceled</option>
        </select>
        <Input
          placeholder="Search by email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="py-2">Email</th>
              <th className="py-2">Joined</th>
              <th className="py-2">Status</th>
              <th className="py-2">Stripe</th>
              <th className="py-2">Updated</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="py-2">{r.email}</td>
                <td className="py-2 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                <td className={`py-2 font-medium ${statusColor[r.subscription_status] || ''}`}>
                  {r.subscription_status}
                </td>
                <td className="py-2">{r.stripeLinked ? 'Linked' : '—'}</td>
                <td className="py-2 text-xs text-muted-foreground">{relTime(r.updated_at)}</td>
                <td className="py-2">
                  {(r.subscription_status === 'active' || r.subscription_status === 'past_due') && (
                    <Button size="sm" variant="outline" onClick={() => setManageTarget(r)}>
                      Manage
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Manage dialog */}
      <Dialog open={!!manageTarget} onOpenChange={(o) => !o && setManageTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage {manageTarget?.email}</DialogTitle>
            <DialogDescription>Choose an action.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={openPortal} disabled={loading}>
              Open Stripe portal
            </Button>
            <Button variant="destructive" onClick={cancelSub} disabled={loading}>
              {loading ? 'Canceling...' : 'Cancel subscription'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}