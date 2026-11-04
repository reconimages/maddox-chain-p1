import { redirect } from 'next/navigation';
import { isAdminRequest } from '@/lib/admin';
import Link from 'next/link';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdminRequest())) redirect('/admin/login');

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <p className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-sm font-bold tracking-widest text-transparent uppercase">
            MADDOX CHAIN / ADMIN
          </p>
          <nav className="flex items-center gap-1 overflow-x-auto">
            <Link href="/admin" className="rounded-md px-3 py-1.5 text-sm hover:bg-accent">Overview</Link>
            <Link href="/admin/upload" className="rounded-md px-3 py-1.5 text-sm hover:bg-accent">Upload</Link>
            <Link href="/admin/albums" className="rounded-md px-3 py-1.5 text-sm hover:bg-accent">Albums</Link>
            <Link href="/admin/tracks" className="rounded-md px-3 py-1.5 text-sm hover:bg-accent">Tracks</Link>
            <Link href="/admin/account" className="rounded-md px-3 py-1.5 text-sm hover:bg-accent">Account</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">View site</Link>
            <form action="/api/admin/logout" method="post">
              <button type="submit" className="rounded-md px-3 py-1.5 text-sm hover:bg-accent">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}