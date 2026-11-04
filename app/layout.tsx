import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PlayerProvider } from "@/lib/player-context";
import PlayerBar from "@/components/PlayerBar";
import { Toaster } from "@/components/ui/sonner";
import { isAdminRequest } from "@/lib/admin";
import { getSessionUser } from "@/lib/auth";
import { getAccess } from "@/lib/access";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Maddox Chain",
  description: "Maddox Chain",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const access = await getAccess();
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className="bg-background text-foreground antialiased">
        <PlayerProvider hasFullAccess={access.hasFullAccess}>
          <div className="flex min-h-screen flex-col md:flex-row">
            <Sidebar
              email={access.user?.email ?? null}
              isAdmin={access.isAdmin}
              hasFullAccess={access.hasFullAccess}
              status={access.status}
              isComped={access.isComped}
              compedUntil={access.compedUntil}
            />
            <main className="flex-1 pb-24 pt-12 md:pt-0">{children}</main>
          </div>
          <PlayerBar />
          <Toaster />
        </PlayerProvider>
      </body>
    </html>
  );
}