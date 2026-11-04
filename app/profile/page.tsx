import { redirect } from "next/navigation";
import { getSessionUser, getProfile } from "@/lib/auth";
import { getAccess } from "@/lib/access";
import ChangePasswordCard from "@/components/ChangePasswordCard";
import SignOutButton from "@/components/SignOutButton";
import ManageBillingButton from "@/components/ManageBillingButton";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login?next=/profile");
  const profile = await getProfile();
  const access = await getAccess();

  let billingCard = null;
  if (access.status === 'active') {
    billingCard = (
      <div className="rounded-md border border-border p-4 space-y-2">
        <p className="text-sm font-medium">Billing</p>
        <p className="text-sm text-muted-foreground">You are a VIP member.</p>
        <ManageBillingButton />
      </div>
    );
  } else if (access.isComped) {
    billingCard = (
      <div className="rounded-md border border-border p-4 space-y-2">
        <p className="text-sm font-medium">Billing</p>
        <p className="text-sm text-muted-foreground">
          You have complimentary VIP access until {access.compedUntil ? new Date(access.compedUntil).toLocaleDateString() : '—'}.
          You have not been charged. Access will end on this date unless you subscribe.
        </p>
        <Link href="/subscribe" className="text-primary underline text-sm">Subscribe</Link>
      </div>
    );
  } else if (access.status === 'past_due') {
    billingCard = (
      <div className="rounded-md border border-amber-500/50 bg-amber-500/10 p-4 space-y-2">
        <p className="text-sm font-medium text-amber-200">Payment past due.</p>
        <ManageBillingButton />
      </div>
    );
  } else if (access.status === 'canceled') {
    billingCard = (
      <div className="rounded-md border border-border p-4 space-y-2">
        <p className="text-sm text-muted-foreground">Your subscription was canceled.</p>
        <Link href="/subscribe" className="text-primary underline text-sm">Resubscribe</Link>
      </div>
    );
  } else {
    billingCard = (
      <div className="rounded-md border border-border p-4 space-y-2">
        <p className="text-sm text-muted-foreground">Free account.</p>
        <Link href="/subscribe" className="text-primary underline text-sm">Subscribe</Link>
      </div>
    );
  }

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
      {billingCard}
      <ChangePasswordCard email={profile?.email ?? user.email ?? ""} />
      <SignOutButton />
    </div>
  );
}
