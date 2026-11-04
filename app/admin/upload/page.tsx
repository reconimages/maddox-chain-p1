import { redirect } from 'next/navigation';
import { isAdminRequest } from '@/lib/admin';
import UploadForm from '@/components/UploadForm';

export const dynamic = 'force-dynamic';

export default async function AdminUploadPage() {
  if (!(await isAdminRequest())) redirect('/admin/login');
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Upload</h1>
      <UploadForm />
    </div>
  );
}