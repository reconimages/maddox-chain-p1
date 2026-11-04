import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { isAdminRequest } from '@/lib/admin';
import Link from 'next/link';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const isAdminPage = h.get('x-admin-page') !== 'login';

  if (!isAdminPage) {
    return <>{children}</>;
  }

  if (!(await isAdminRequest())) redirect('/admin/login');

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-3 space-y-2">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-sm font-bold tracking-widest text-transparent uppercase">
              MADDOX CHAIN / ADMIN
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">View site</Link>
              <form action="/api/admin/logout" method="post">
                <button type="submit" className="rounded-md px-3 py-1.5 text-sm hover:bg-accent">Sign out</button>
              </form>
            </div>
          </div>
          <nav className="flex items-center gap-1 overflow-x-auto -mx-4 px-4">
            <Link href="/admin" className="rounded-md px-3 py-1.5 text-sm hover:bg-accent whitespace-nowrap">Overview</Link>
            <Link href="/admin/stats" className="rounded-md px-3 py-1.5 text-sm hover:bg-accent whitespace-nowrap">Stats</Link>
            <Link href="/admin/upload" className="rounded-md px-3 py-1.5 text-sm hover:bg-accent whitespace-nowrap">Upload</Link>
            <Link href="/admin/albums" className="rounded-md px-3 py-1.5 text-sm hover:bg-accent whitespace-nowrap">Albums</Link>
            <Link href="/admin/tracks" className="rounded-md px-3 py-1.5 text-sm hover:bg-accent whitespace-nowrap">Tracks</Link>
            <Link href="/admin/subscribers" className="rounded-md px-3 py-1.5 text-sm hover:bg-accent whitespace-nowrap">Subscribers</Link>
            <Link href="/admin/account" className="rounded-md px-3 py-1.5 text-sm hover:bg-accent whitespace-nowrap">Account</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}