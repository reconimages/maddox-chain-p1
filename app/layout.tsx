import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PlayerProvider } from "@/lib/player-context";
import PlayerBar from "@/components/PlayerBar";
import { Toaster } from "@/components/ui/sonner";
import { isAdminRequest } from "@/lib/admin";
import { getSessionUser } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Maddox Chain",
  description: "Maddox Chain",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [isAdmin, user] = await Promise.all([isAdminRequest(), getSessionUser()]);
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className="bg-background text-foreground antialiased">
        <PlayerProvider>
          <div className="flex min-h-screen flex-col md:flex-row">
            <Sidebar email={user?.email ?? null} isAdmin={isAdmin} />
            <main className="flex-1 pb-24 pt-16 md:pt-0">{children}</main>
          </div>
          <PlayerBar />
          <Toaster />
        </PlayerProvider>
      </body>
    </html>
  );
}
