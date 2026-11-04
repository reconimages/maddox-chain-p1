import { cache } from 'react';
import { createServerSupabase, getSessionUser } from '@/lib/auth';
import { isAdminRequest } from '@/lib/admin';

export type Access = {
  user: { id: string; email: string | null } | null;
  isAdmin: boolean;
  status: 'free' | 'active' | 'past_due' | 'canceled' | null;
  isComped: boolean;
  compedUntil: string | null;
  hasFullAccess: boolean;
};

export const getAccess = cache(async (): Promise<Access> => {
  const isAdmin = await isAdminRequest();
  const user = await getSessionUser();
  if (!user) {
    return { user: null, isAdmin, status: null, isComped: false, compedUntil: null, hasFullAccess: isAdmin };
  }
  // Admin always has full access and active status
  if (isAdmin) {
    return {
      user: { id: user.id, email: user.email ?? null },
      isAdmin: true,
      status: 'active',
      isComped: false,
      compedUntil: null,
      hasFullAccess: true,
    };
  }
  const supabase = await createServerSupabase();
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, comped_until')
    .eq('id', user.id)
    .single();

  const status = (profile?.subscription_status ?? 'free') as Access['status'];
  const compedUntil = profile?.comped_until ?? null;
  const isComped = compedUntil !== null && new Date(compedUntil) > new Date();

  return {
    user: { id: user.id, email: user.email ?? null },
    isAdmin: false,
    status,
    isComped,
    compedUntil,
    hasFullAccess: status === 'active' || isComped,
  };
});