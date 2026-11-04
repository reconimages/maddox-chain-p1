import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabase, getSessionUser } from '@/lib/auth';
import { getAccess } from '@/lib/access';
import { createAdminClient } from '@/lib/supabase/admin';

const schema = z.object({ trackId: z.string().uuid() });

const buckets = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 30;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || now > entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

function clientIp(req: Request): string {
  const h = req.headers.get('x-forwarded-for');
  return h ? h.split(',')[0].trim() : 'unknown';
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid trackId' }, { status: 400 });
  }
  const { trackId } = parsed.data;

  const user = await getSessionUser();
  const access = await getAccess();

  const supabase = await createServerSupabase();
  const { data: track } = await supabase
    .from('tracks')
    .select('id, is_vault')
    .eq('id', trackId)
    .maybeSingle();
  if (!track) {
    return NextResponse.json({ error: 'Track not found' }, { status: 404 });
  }

  const key = user ? `user:${user.id}` : `ip:${clientIp(req)}`;
  if (isRateLimited(key)) {
    return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
  }

  const admin = createAdminClient();
  await admin.from('play_events').insert({
    user_id: user?.id ?? null,
    track_id: track.id,
    is_vault: track.is_vault,
    was_paid: access.hasFullAccess,
  });

  return NextResponse.json({ ok: true });
}

export const runtime = 'nodejs';