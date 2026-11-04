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
    return { user: null, isAdmin, status: null, hasFullAccess: isAdmin };
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
    isAdmin,
    status,
    hasFullAccess: isAdmin || status === 'active',
  };
});