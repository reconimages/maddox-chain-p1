"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function Sidebar({
  email,
  isAdmin,
}: {
  email: string | null;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="space-y-1 px-2">
      <Link
        href="/"
        className="block rounded-md px-3 py-2 text-sm hover:bg-accent"
        onClick={() => setOpen(false)}
      >
        Home
      </Link>
      <Link
        href="/albums"
        className="block rounded-md px-3 py-2 text-sm hover:bg-accent"
        onClick={() => setOpen(false)}
      >
        Albums
      </Link>
      <Link
        href="/singles"
        className="block rounded-md px-3 py-2 text-sm hover:bg-accent"
        onClick={() => setOpen(false)}
      >
        Singles
      </Link>
      {isAdmin && (
        <Link
          href="/admin"
          className="block rounded-md px-3 py-2 text-sm hover:bg-accent"
          onClick={() => setOpen(false)}
        >
          Admin
        </Link>
      )}
    </nav>
  );

  const footer = email ? (
    <div className="space-y-2 border-t border-border p-4">
      <p className="truncate text-xs text-muted-foreground">{email}</p>
      <Link
        href="/profile"
        className="block rounded-md px-3 py-2 text-sm hover:bg-accent"
        onClick={() => setOpen(false)}
      >
        Profile
      </Link>
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
        >
          Sign out
        </button>
      </form>
    </div>
  ) : (
    <div className="border-t border-border p-4">
      <Link
        href="/auth/login"
        className="block rounded-md bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90"
        onClick={() => setOpen(false)}
      >
        Sign In
      </Link>
    </div>
  );

  return (
    <>
      {/* Mobile top header */}
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between border-b border-border bg-background p-4 md:hidden">
        <p className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-lg font-bold tracking-widest text-transparent uppercase">
          MADDOX CHAIN
        </p>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="rounded-md p-2 hover:bg-accent"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 bg-background border-r border-border">
            <div className="flex items-center justify-between p-4">
              <p className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-lg font-bold tracking-widest text-transparent uppercase">
                MADDOX CHAIN
              </p>
              <button onClick={() => setOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
            {footer}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-border md:block">
        <div className="p-4">
          <p className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-lg font-bold tracking-widest text-transparent uppercase">
            MADDOX CHAIN
          </p>
        </div>
        {nav}
        <div className="mt-auto">{footer}</div>
      </aside>
    </>
  );
}
