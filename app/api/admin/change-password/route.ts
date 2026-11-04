import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isAdminRequest, verifyAdminPassword, setAdminPassword } from '@/lib/admin';
import { logAdminEvent } from '@/lib/admin-log';

const schema = z.object({
  current: z.string().min(1),
  next: z.string().min(12).max(200),
  confirm: z.string().min(12).max(200),
}).refine((d) => d.next === d.confirm, { message: 'Passwords do not match' });

export async function POST(req: Request) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid input' }, { status: 400 });
  }

  const ok = await verifyAdminPassword(parsed.data.current);
  if (!ok) {
    return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 });
  }

  await setAdminPassword(parsed.data.next);
  await logAdminEvent({ event_type: 'edit', metadata: { action: 'password_changed' } });

  const res = NextResponse.json({ ok: true, re_login: true });
  res.cookies.set('admin_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}