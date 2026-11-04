import { redirect } from 'next/navigation';
import { isAdminRequest } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminStats, getRecentEvents } from '@/lib/admin-queries';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminOverviewPage() {
  if (!(await isAdminRequest())) redirect('/admin/login');

  const stats = await getAdminStats();
  const events = await getRecentEvents(10);

  function fmtDuration(sec: number) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  function relTime(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Overview</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Catalog</p>
          <p className="mt-2 text-3xl font-bold">{stats.albums}</p>
          <p className="text-xs text-muted-foreground">albums</p>
          <p className="mt-1 text-xl font-semibold">{stats.singles}</p>
          <p className="text-xs text-muted-foreground">singles</p>
          <p className="mt-1 text-xl font-semibold">{stats.tracks}</p>
          <p className="text-xs text-muted-foreground">tracks</p>
          <p className="mt-1 text-xl font-semibold">{fmtDuration(stats.totalDurationSeconds)}</p>
          <p className="text-xs text-muted-foreground">total duration</p>
        </div>

        <div className="rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Recent activity</p>
          <ul className="mt-2 space-y-2 text-sm">
            {events.length === 0 && <li className="text-muted-foreground">No activity yet.</li>}
            {events.map((e: any) => (
              <li key={e.id} className="flex justify-between gap-2">
                <span className="truncate">
                  {e.event_type}
                  {e.albums?.title ? ` — ${e.albums.title}` : ''}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{relTime(e.created_at)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Quick actions</p>
          <div className="mt-2 flex flex-col gap-2">
            <Link href="/admin/upload" className="rounded-md bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Upload music
            </Link>
            <Link href="/admin/albums" className="rounded-md border border-input px-3 py-2 text-center text-sm hover:bg-accent">
              Manage albums
            </Link>
            <Link href="/" className="rounded-md border border-input px-3 py-2 text-center text-sm hover:bg-accent">
              View public site
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}