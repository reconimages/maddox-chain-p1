import { redirect } from 'next/navigation';
import { isAdminRequest } from '@/lib/admin';
import {
  getCatalogStats,
  getUserStats,
  getSubscriptionStats,
  getLikesAndPlaylistsStats,
  getAdminActivityStats,
  getVaultStats,
} from '@/lib/admin-stats';
import { CatalogSection } from '@/components/admin/stats/CatalogSection';
import { UsersSection } from '@/components/admin/stats/UsersSection';
import { SubscriptionsSection } from '@/components/admin/stats/SubscriptionsSection';
import { LikesSection } from '@/components/admin/stats/LikesSection';
import { ActivitySection } from '@/components/admin/stats/ActivitySection';
import { VaultSection } from '@/components/admin/stats/VaultSection';

export const dynamic = 'force-dynamic';

export default async function StatsPage() {
  if (!(await isAdminRequest())) redirect('/admin/login');

  const [catalog, users, subs, likes, activity, vault] = await Promise.all([
    getCatalogStats(),
    getUserStats(),
    getSubscriptionStats(),
    getLikesAndPlaylistsStats(),
    getAdminActivityStats(),
    getVaultStats(),
  ]);

  return (
    <div className="space-y-10 py-6">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight">Stats</h1>
        <p className="text-zinc-500 text-sm mt-1">
          All-time metrics from your catalog, users, and activity. No tracking beyond what the site already stores.
        </p>
      </div>

      <CatalogSection data={catalog} />
      <UsersSection data={users} />
      <SubscriptionsSection data={subs} />
      <LikesSection data={likes} />
      <ActivitySection data={activity} />
      <VaultSection data={vault} />
    </div>
  );
}