"use client";

import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import UploadForm from "@/components/UploadForm";
import AlbumList from "@/components/AlbumList";

export default function AdminDashboard({ albums }: { albums: any[] }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-widest">ADMIN</h1>
        <Button variant="outline" size="sm" onClick={logout}>
          Logout
        </Button>
      </div>
      <Tabs defaultValue="upload">
        <TabsList>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="manage">Manage</TabsTrigger>
        </TabsList>
        <TabsContent value="upload" className="mt-4">
          <UploadForm />
        </TabsContent>
        <TabsContent value="manage" className="mt-4">
          <AlbumList albums={albums} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
