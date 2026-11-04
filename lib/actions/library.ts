'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabase, getSessionUser } from '@/lib/auth';

export async function toggleLike(trackId: string) {
  const user = await getSessionUser();
  if (!user) return { error: 'unauthorized' };
  const supabase = await createServerSupabase();
  const { data: existing } = await supabase
    .from('liked_tracks')
    .select('track_id')
    .eq('user_id', user.id)
    .eq('track_id', trackId)
    .maybeSingle();
  if (existing) {
    await supabase.from('liked_tracks')
      .delete()
      .eq('user_id', user.id).eq('track_id', trackId);
  } else {
    await supabase.from('liked_tracks')
      .insert({ user_id: user.id, track_id: trackId });
  }
  revalidatePath('/liked');
  return { ok: true };
}

export async function createPlaylist(name: string) {
  const user = await getSessionUser();
  if (!user) return { error: 'unauthorized' };
  const trimmed = name.trim();
  if (!trimmed) return { error: 'Name required' };
  if (trimmed.length > 80) return { error: 'Name too long' };
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('playlists')
    .insert({ user_id: user.id, name: trimmed })
    .select('id').single();
  if (error) return { error: error.message };
  revalidatePath('/playlists');
  return { ok: true, id: data.id };
}

export async function deletePlaylist(playlistId: string) {
  const user = await getSessionUser();
  if (!user) return { error: 'unauthorized' };
  const supabase = await createServerSupabase();
  await supabase.from('playlists').delete()
    .eq('id', playlistId).eq('user_id', user.id);
  revalidatePath('/playlists');
  return { ok: true };
}

export async function addTrackToPlaylist(playlistId: string, trackId: string) {
  const user = await getSessionUser();
  if (!user) return { error: 'unauthorized' };
  const supabase = await createServerSupabase();
  const { data: pl } = await supabase
    .from('playlists').select('id').eq('id', playlistId)
    .eq('user_id', user.id).maybeSingle();
  if (!pl) return { error: 'Playlist not found' };
  const { data: existing } = await supabase
    .from('playlist_tracks').select('track_id')
    .eq('playlist_id', playlistId).eq('track_id', trackId).maybeSingle();
  if (existing) return { ok: true };
  const { data: maxRow } = await supabase
    .from('playlist_tracks').select('position')
    .eq('playlist_id', playlistId)
    .order('position', { ascending: false }).limit(1).maybeSingle();
  const nextPos = (maxRow?.position ?? -1) + 1;
  const { error } = await supabase.from('playlist_tracks')
    .insert({ playlist_id: playlistId, track_id: trackId, position: nextPos });
  if (error) return { error: error.message };
  revalidatePath(`/playlists/${playlistId}`);
  return { ok: true };
}

export async function removeTrackFromPlaylist(playlistId: string, trackId: string) {
  const user = await getSessionUser();
  if (!user) return { error: 'unauthorized' };
  const supabase = await createServerSupabase();
  const { data: pl } = await supabase
    .from('playlists').select('id').eq('id', playlistId)
    .eq('user_id', user.id).maybeSingle();
  if (!pl) return { error: 'Playlist not found' };
  await supabase.from('playlist_tracks').delete()
    .eq('playlist_id', playlistId).eq('track_id', trackId);
  const { data: remaining } = await supabase
    .from('playlist_tracks').select('track_id')
    .eq('playlist_id', playlistId).order('position');
  if (remaining) {
    for (let i = 0; i < remaining.length; i++) {
      await supabase.from('playlist_tracks')
        .update({ position: i })
        .eq('playlist_id', playlistId)
        .eq('track_id', remaining[i].track_id);
    }
  }
  revalidatePath(`/playlists/${playlistId}`);
  return { ok: true };
}

export async function moveTrack(playlistId: string, trackId: string, direction: 'up' | 'down') {
  const user = await getSessionUser();
  if (!user) return { error: 'unauthorized' };
  const supabase = await createServerSupabase();
  const { data: rows } = await supabase
    .from('playlist_tracks').select('track_id, position')
    .eq('playlist_id', playlistId).order('position');
  if (!rows) return { error: 'Not found' };
  const idx = rows.findIndex((r: any) => r.track_id === trackId);
  if (idx < 0) return { error: 'Not found' };
  const swapWith = direction === 'up' ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= rows.length) return { ok: true };
  const a = rows[idx], b = rows[swapWith];
  await supabase.from('playlist_tracks').update({ position: b.position })
    .eq('playlist_id', playlistId).eq('track_id', a.track_id);
  await supabase.from('playlist_tracks').update({ position: a.position })
    .eq('playlist_id', playlistId).eq('track_id', b.track_id);
  revalidatePath(`/playlists/${playlistId}`);
  return { ok: true };
}