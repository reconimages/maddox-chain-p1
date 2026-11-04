import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminRequest } from '@/lib/admin';
import { logAdminEvent } from '@/lib/admin-log';
import { revalidatePath } from 'next/cache';

const schema = z.object({
  action: z.enum(['grant', 'revoke']),
  until: z.string().optional(),
  note: z.string().max(200).optional(),
});

function isUuid(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

export async function POST(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { userId } = await params;
  if (!isUuid(userId)) return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid input' }, { status: 400 });

  const { action, note } = parsed.data;
  const supabase = createAdminClient();

  if (action === 'grant') {
    const until = parsed.data.until;
    if (!until) return NextResponse.json({ error: 'until required' }, { status: 400 });
    const untilDate = new Date(until);
    if (isNaN(untilDate.getTime())) return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
    const now = new Date();
    const minDate = new Date(now.getTime() + 60000);
    const maxDate = new Date(now.getTime() + 10 * 365 * 24 * 60 * 60 * 1000);
    if (untilDate < minDate) return NextResponse.json({ error: 'Date must be in the future' }, { status: 400 });
    if (untilDate > maxDate) return NextResponse.json({ error: 'Date must be within 10 years' }, { status: 400 });
    if (note && note.length > 200) return NextResponse.json({ error: 'Note too long' }, { status: 400 });

    const { data, error } = await supabase
      .from('profiles')
      .update({
        comped_until: untilDate.toISOString(),
        comped_at: now.toISOString(),
        comped_by_note: note || null,
        updated_at: now.toISOString(),
      })
      .eq('id', userId)
      .select('id');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data || data.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    await logAdminEvent({
      event_type: 'edit',
      metadata: { action: 'comp_grant', user_id: userId, until: untilDate.toISOString(), note: note ?? null },
    });

    revalidatePath('/admin/subscribers');
    revalidatePath('/profile');
    return NextResponse.json({ ok: true, comped_until: untilDate.toISOString() });
  }

  if (action === 'revoke') {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        comped_until: null,
        comped_at: null,
        comped_by_note: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select('id');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data || data.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    await logAdminEvent({
      event_type: 'edit',
      metadata: { action: 'comp_revoke', user_id: userId },
    });

    revalidatePath('/admin/subscribers');
    revalidatePath('/profile');
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}