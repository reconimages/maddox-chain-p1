import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminRequest } from '@/lib/admin';
import { logAdminEvent } from '@/lib/admin-log';

const editSchema = z.object({
  title: z.string().min(1).max(200),
  release_year: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1),
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const url = new URL(req.url);
  if (url.searchParams.get('dry_run') !== '1') {
    return NextResponse.json({ error: 'dry_run required' }, { status: 400 });
  }
  const supabase = createAdminClient();
  const { data: tracks } = await supabase.from('tracks').select('id').eq('album_id', id);
  const trackIds = (tracks || []).map((t: any) => t.id);
  let playlistRefs = 0;
  let likeRefs = 0;
  if (trackIds.length) {
    const { count: pc } = await supabase
      .from('playlist_tracks')
      .select('*', { count: 'exact', head: true })
      .in('track_id', trackIds);
    playlistRefs = pc ?? 0;
    const { count: lc } = await supabase
      .from('liked_tracks')
      .select('*', { count: 'exact', head: true })
      .in('track_id', trackIds);
    likeRefs = lc ?? 0;
  }
  return NextResponse.json({ playlist_refs: playlistRefs, like_refs: likeRefs });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const supabase = createAdminClient();

  const formData = await req.formData();
  const title = formData.get('title');
  const release_year = formData.get('release_year');
  const cover = formData.get('cover');
  const coverFile = cover instanceof File && cover.size > 0 ? cover : null;

  const parsed = editSchema.safeParse({ title, release_year });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const { data: album } = await supabase.from('albums').select('cover_path').eq('id', id).single();
  if (!album) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const changed: string[] = [];
  const update: any = { title: parsed.data.title, release_year: parsed.data.release_year };
  changed.push('title', 'release_year');

  let oldCoverPath: string | null = album.cover_path;
  if (coverFile) {
    const ext = (coverFile.name.split('.').pop() || 'jpg').toLowerCase();
    const cpath = `covers/${id}.${ext}`;
    const buf = Buffer.from(await coverFile.arrayBuffer());
    const { error: upErr } = await supabase.storage.from('covers').upload(cpath, buf, {
      contentType: coverFile.type || 'image/jpeg',
      upsert: true,
    });
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
    update.cover_path = cpath;
    changed.push('cover');
  }

  const { error } = await supabase.from('albums').update(update).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // delete old cover object if replaced
  if (coverFile && oldCoverPath && oldCoverPath !== update.cover_path) {
    try { await supabase.storage.from('covers').remove([oldCoverPath]); } catch {}
  }

  await logAdminEvent({ event_type: 'edit', album_id: id, metadata: { changed_fields: changed } });
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
  const { data: album } = await supabase.from('albums').select('cover_path').eq('id', id).single();
  if (!album) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: tracks } = await supabase.from('tracks').select('id, storage_path').eq('album_id', id);
  const trackIds = (tracks || []).map((t: any) => t.id);
  const audioPaths = (tracks || []).map((t: any) => t.storage_path).filter(Boolean);

  // impact counts
  let playlistRefs = 0;
  let likeRefs = 0;
  if (trackIds.length) {
    const { count: pc } = await supabase.from('playlist_tracks').select('*', { count: 'exact', head: true }).in('track_id', trackIds);
    playlistRefs = pc ?? 0;
    const { count: lc } = await supabase.from('liked_tracks').select('*', { count: 'exact', head: true }).in('track_id', trackIds);
    likeRefs = lc ?? 0;
  }

  // delete storage objects first
  if (audioPaths.length) {
    try { await supabase.storage.from('audio').remove(audioPaths); } catch {}
  }
  if (album.cover_path) {
    try { await supabase.storage.from('covers').remove([album.cover_path]); } catch {}
  }

  // delete album row (cascades tracks, playlist_tracks, liked_tracks)
  const { error } = await supabase.from('albums').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAdminEvent({
    event_type: 'delete',
    album_id: id,
    metadata: { deleted_track_count: trackIds.length, playlist_refs: playlistRefs, like_refs: likeRefs },
  });

  return NextResponse.json({ ok: true });
}