import { redirect } from 'next/navigation';
import { isAdminRequest } from '@/lib/admin';
import ChangeAdminPasswordForm from '@/components/admin/ChangeAdminPasswordForm';

export const dynamic = 'force-dynamic';

export default async function AdminAccountPage() {
  if (!(await isAdminRequest())) redirect('/admin/login');
  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Account</h1>
      <ChangeAdminPasswordForm />
      <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
        Admin session cookie valid for 8 hours from sign-in. Sign out at the top right to end it immediately.
        <br /><br />
        Changing your password here takes effect immediately. You do not need to redeploy. The ADMIN_PASSWORD environment variable becomes a bootstrap value only; the password you set here is authoritative.
      </div>
    </div>
  );
}