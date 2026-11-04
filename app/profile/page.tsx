import { redirect } from "next/navigation";
import { getSessionUser, getProfile } from "@/lib/auth";
import ChangePasswordCard from "@/components/ChangePasswordCard";
import SignOutButton from "@/components/SignOutButton";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login?next=/profile");
  const profile = await getProfile();
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Your profile</h1>
      <div className="space-y-2 rounded-md border border-border p-4">
        <p className="text-sm">
          <span className="text-muted-foreground">Email:</span> {profile?.email ?? user.email}
        </p>
        <p className="text-sm">
          <span className="text-muted-foreground">Member since:</span>{" "}
          {profile?.created_at
            ? new Date(profile.created_at).toLocaleDateString()
            : "—"}
        </p>
      </div>
      <ChangePasswordCard email={profile?.email ?? user.email ?? ""} />
      <SignOutButton />
    </div>
  );
}
