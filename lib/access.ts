import { cache } from 'react';
import { createServerSupabase, getSessionUser } from '@/lib/auth';
import { isAdminRequest } from '@/lib/admin';

export type Access = {
  user: { id: string; email: string | null } | null;
  isAdmin: boolean;
  status: 'free' | 'active' | 'past_due' | 'canceled' | null;
  hasFullAccess: boolean;
};

export const getAccess = cache(async (): Promise<Access> => {
  const isAdmin = await isAdminRequest();
  const user = await getSessionUser();
  if (!user) {
    return { user: null, isAdmin, status: isAdmin ? 'active' : null, hasFullAccess: isAdmin };
  }
  // Admin always has full access and active status, regardless of subscription
  if (isAdmin) {
    return {
      user: { id: user.id, email: user.email ?? null },
      isAdmin: true,
      status: 'active',
      hasFullAccess: true,
    };
  }
  const supabase = await createServerSupabase();
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('id', user.id)
    .single();
  const status = (profile?.subscription_status ?? 'free') as Access['status'];
  return {
    user: { id: user.id, email: user.email ?? null },
    isAdmin: false,
    status,
    hasFullAccess: status === 'active',
  };
});