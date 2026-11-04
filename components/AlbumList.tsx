"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function AlbumList({ albums }: { albums: any[] }) {
  const router = useRouter();
  const [target, setTarget] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function confirmDelete() {
    if (!target) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/admin/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ albumId: target.id }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(j?.error || "Delete failed.");
      } else {
        toast.success("Deleted.");
        setTarget(null);
        router.refresh();
      }
    } catch (e: any) {
      toast.error(e?.message || "Delete failed.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="py-2">Cover</th>
              <th className="py-2">Title</th>
              <th className="py-2">Year</th>
              <th className="py-2">Tracks</th>
              <th className="py-2">Created</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {albums.map((a) => {
              const count = Array.isArray(a.tracks) ? a.tracks[0]?.count ?? 0 : 0;
              return (
                <tr key={a.id} className="border-b">
                  <td className="py-2">
                    <img
                      src={`/api/covers/${a.id}`}
                      alt={a.title}
                      className="h-10 w-10 rounded object-cover"
                    />
                  </td>
                  <td className="py-2">{a.title}</td>
                  <td className="py-2">{a.release_year}</td>
                  <td className="py-2">{count}</td>
                  <td className="py-2 text-xs text-muted-foreground">
                    {new Date(a.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setTarget(a)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {target?.title}?</DialogTitle>
            <DialogDescription>
              This removes the album, its tracks, and its uploaded files.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
