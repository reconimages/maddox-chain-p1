'use server';

import { getAccess } from '@/lib/access';

export async function getMyStatus() {
  const access = await getAccess();
  return { status: access.status };
}