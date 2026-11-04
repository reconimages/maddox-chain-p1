import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PlayerProvider } from "@/lib/player-context";
import PlayerBar from "@/components/PlayerBar";
import { Toaster } from "@/components/ui/sonner";
import { isAdminRequest } from "@/lib/admin";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Maddox Chain",
  description: "Maddox Chain",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const isAdmin = await isAdminRequest();
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className="bg-background text-foreground antialiased">
        <PlayerProvider>
          <div className="flex min-h-screen flex-col md:flex-row">
            <header className="border-b border-border p-4 md:hidden">
              <p className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-lg font-bold tracking-widest text-transparent uppercase">
                MADDOX CHAIN
              </p>
            </header>
            <aside className="hidden w-60 shrink-0 border-r border-border md:block">
              <div className="p-4">
                <p className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-lg font-bold tracking-widest text-transparent uppercase">
                  MADDOX CHAIN
                </p>
              </div>
              <nav className="space-y-1 px-2">
                <a href="/" className="block rounded-md px-3 py-2 text-sm hover:bg-accent">
                  Home
                </a>
                <a href="/" className="block rounded-md px-3 py-2 text-sm hover:bg-accent">
                  Albums
                </a>
                {isAdmin && (
                  <a href="/admin" className="block rounded-md px-3 py-2 text-sm hover:bg-accent">
                    Admin
                  </a>
                )}
              </nav>
            </aside>
            <main className="flex-1 pb-24">{children}</main>
          </div>
          <PlayerBar />
          <Toaster />
        </PlayerProvider>
      </body>
    </html>
  );
}
