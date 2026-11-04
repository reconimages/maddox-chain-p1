import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminRequest } from '@/lib/admin';
import { logAdminEvent } from '@/lib/admin-log';

const editSchema = z.object({
  title: z.string().min(1).max(200),
  track_number: z.coerce.number().int().positive(),
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const url = new URL(req.url);
  if (url.searchParams.get('dry_run') !== '1') {
    return NextResponse.json({ error: 'dry_run required' }, { status: 400 });
  }
  const supabase = createAdminClient();
  let playlistRefs = 0;
  let likeRefs = 0;
  const { count: pc } = await supabase
    .from('playlist_tracks')
    .select('*', { count: 'exact', head: true })
    .eq('track_id', id);
  playlistRefs = pc ?? 0;
  const { count: lc } = await supabase
    .from('liked_tracks')
    .select('*', { count: 'exact', head: true })
    .eq('track_id', id);
  likeRefs = lc ?? 0;
  return NextResponse.json({ playlist_refs: playlistRefs, like_refs: likeRefs });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const supabase = createAdminClient();

  const body = await req.json().catch(() => ({}));
  const parsed = editSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const { data: track } = await supabase.from('tracks').select('album_id').eq('id', id).single();
  if (!track) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { error } = await supabase
    .from('tracks')
    .update({ title: parsed.data.title, track_number: parsed.data.track_number })
    .eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAdminEvent({ event_type: 'edit', track_id: id, album_id: track.album_id, metadata: { changed_fields: ['title', 'track_number'] } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  if (!body?.confirm) {
    return NextResponse.json({ error: 'confirm required' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: track } = await supabase.from('tracks').select('id, album_id, storage_path').eq('id', id).single();
  if (!track) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let playlistRefs = 0;
  let likeRefs = 0;
  const { count: pc } = await supabase.from('playlist_tracks').select('*', { count: 'exact', head: true }).eq('track_id', id);
  playlistRefs = pc ?? 0;
  const { count: lc } = await supabase.from('liked_tracks').select('*', { count: 'exact', head: true }).eq('track_id', id);
  likeRefs = lc ?? 0;

  // delete audio object
  if (track.storage_path) {
    try { await supabase.storage.from('audio').remove([track.storage_path]); } catch {}
  }

  // delete track row (cascades playlist_tracks, liked_tracks)
  const { error } = await supabase.from('tracks').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAdminEvent({ event_type: 'delete', track_id: id, album_id: track.album_id, metadata: { playlist_refs: playlistRefs, like_refs: likeRefs } });
  return NextResponse.json({ ok: true });
}