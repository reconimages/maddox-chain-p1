import { createAdminClient } from '@/lib/supabase/admin';

export async function getCatalogStats() {
  const supabase = createAdminClient();

  const { data: tracks } = await supabase.from('tracks').select('id, duration_seconds, is_vault, album_id');
  const { data: albums } = await supabase.from('albums').select('id');

  const publicTracks = (tracks || []).filter((t: any) => !t.is_vault);
  const vaultTracks = (tracks || []).filter((t: any) => t.is_vault);
  const totalDuration = publicTracks.reduce((s: number, t: any) => s + (t.duration_seconds || 0), 0);

  // Count albums/singles by public track count per album
  const trackCounts: Record<string, number> = {};
  publicTracks.forEach((t: any) => {
    trackCounts[t.album_id] = (trackCounts[t.album_id] || 0) + 1;
  });
  const albumsCount = Object.values(trackCounts).filter((c) => c > 1).length;
  const singlesCount = Object.values(trackCounts).filter((c) => c === 1).length;

  return {
    albums: albumsCount,
    singles: singlesCount,
    publicTracks: publicTracks.length,
    vaultTracks: vaultTracks.length,
    totalDurationSeconds: totalDuration,
  };
}

export async function getUserStats() {
  const supabase = createAdminClient();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: profiles } = await supabase.from('profiles').select('id, created_at');
  const total = profiles?.length || 0;
  const today = (profiles || []).filter((p: any) => p.created_at >= todayStart).length;
  const last7 = (profiles || []).filter((p: any) => p.created_at >= sevenDaysAgo).length;
  const last30 = (profiles || []).filter((p: any) => p.created_at >= thirtyDaysAgo).length;

  // Try auth admin API for provider split
  let google = 0;
  let email = 0;
  let providerAvailable = false;
  try {
    let page = 1;
    const perPage = 1000;
    let hasMore = true;
    while (hasMore) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
      if (error) throw error;
      const users = data?.users || [];
      users.forEach((u: any) => {
        const provider = u.app_metadata?.provider || u.user_metadata?.provider || 'email';
        if (provider === 'google') google++;
        else email++;
      });
      hasMore = users.length === perPage;
      page++;
    }
    providerAvailable = true;
  } catch {
    providerAvailable = false;
  }

  return { total, today, last7, last30, google, email, providerAvailable };
}

export async function getSubscriptionStats() {
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: profiles } = await supabase.from('profiles').select('subscription_status, updated_at, comped_until');

  const counts: Record<string, number> = { active: 0, free: 0, past_due: 0, canceled: 0 };
  (profiles || []).forEach((p: any) => {
    const s = p.subscription_status || 'free';
    if (counts[s] !== undefined) counts[s]++;
  });

  const comped = (profiles || []).filter((p: any) => p.comped_until && new Date(p.comped_until) > new Date()).length;

  const denominator = counts.active + counts.free + counts.past_due + counts.canceled;
  const conversion = denominator > 0 ? Math.round((counts.active / denominator) * 1000) / 10 : 0;

  const churnLast30 = (profiles || []).filter(
    (p: any) => p.subscription_status === 'canceled' && p.updated_at > thirtyDaysAgo
  ).length;

  return {
    active: counts.active,
    free: counts.free,
    pastDue: counts.past_due,
    canceled: counts.canceled,
    comped,
    conversion,
    churnLast30,
  };
}

export async function getLikesAndPlaylistsStats() {
  const supabase = createAdminClient();

  const { count: totalLikes } = await supabase
    .from('liked_tracks')
    .select('*', { count: 'exact', head: true });

  const { count: totalPlaylists } = await supabase
    .from('playlists')
    .select('*', { count: 'exact', head: true });

  const { count: totalPlaylistTracks } = await supabase
    .from('playlist_tracks')
    .select('*', { count: 'exact', head: true });

  const avgPlaylistSize = totalPlaylists && totalPlaylists > 0
    ? Math.round(((totalPlaylistTracks || 0) / totalPlaylists) * 10) / 10
    : 0;

  // Top liked tracks
  const { data: likedRows } = await supabase
    .from('liked_tracks')
    .select('track_id, tracks(id, title, album_id, albums(title))');

  const likeCounts: Record<string, { title: string; album: string; count: number }> = {};
  (likedRows || []).forEach((r: any) => {
    const t = r.tracks;
    if (!t) return;
    if (!likeCounts[t.id]) {
      likeCounts[t.id] = { title: t.title, album: t.albums?.title || '', count: 0 };
    }
    likeCounts[t.id].count++;
  });
  const topLikedTracks = Object.entries(likeCounts)
    .map(([id, v]) => ({ id, title: v.title, album: v.album, count: v.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Top playlisted tracks
  const { data: playlistRows } = await supabase
    .from('playlist_tracks')
    .select('track_id, tracks(id, title, album_id, albums(title))');

  const plCounts: Record<string, { title: string; album: string; count: number }> = {};
  (playlistRows || []).forEach((r: any) => {
    const t = r.tracks;
    if (!t) return;
    if (!plCounts[t.id]) {
      plCounts[t.id] = { title: t.title, album: t.albums?.title || '', count: 0 };
    }
    plCounts[t.id].count++;
  });
  const topPlaylistedTracks = Object.entries(plCounts)
    .map(([id, v]) => ({ id, title: v.title, album: v.album, count: v.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalLikes: totalLikes || 0,
    topLikedTracks,
    totalPlaylists: totalPlaylists || 0,
    avgPlaylistSize,
    topPlaylistedTracks,
  };
}

export async function getAdminActivityStats() {
  const supabase = createAdminClient();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: events } = await supabase
    .from('admin_events')
    .select('id, event_type, album_id, track_id, metadata, created_at, albums(title)')
    .order('created_at', { ascending: false });

  const recent = (events || []).slice(0, 10);
  const last30 = (events || []).filter((e: any) => e.created_at > thirtyDaysAgo);

  const uploads30 = last30.filter((e: any) => e.event_type === 'upload').length;
  const deletes30 = last30.filter((e: any) => e.event_type === 'delete').length;
  const edits30 = last30.filter((e: any) => e.event_type === 'edit').length;

  return {
    uploads30,
    deletes30,
    edits30,
    recentEvents: recent.map((e: any) => ({
      id: e.id,
      event_type: e.event_type,
      created_at: e.created_at,
      summary: e.albums?.title
        ? `${e.event_type}: ${e.albums.title}`
        : e.event_type,
      metadata: e.metadata,
    })),
  };
}

export async function getPlayStats() {
  const supabase = createAdminClient();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Total counts
  const { count: totalAllTime } = await supabase
    .from('play_events')
    .select('*', { count: 'exact', head: true });
  const { count: total30 } = await supabase
    .from('play_events')
    .select('*', { count: 'exact', head: true })
    .gte('played_at', thirtyDaysAgo);
  const { count: total7 } = await supabase
    .from('play_events')
    .select('*', { count: 'exact', head: true })
    .gte('played_at', sevenDaysAgo);

  // Paid vs free
  const { count: paidAllTime } = await supabase
    .from('play_events')
    .select('*', { count: 'exact', head: true })
    .eq('was_paid', true);
  const { count: freeAllTime } = await supabase
    .from('play_events')
    .select('*', { count: 'exact', head: true })
    .eq('was_paid', false);

  const paidPercent = (totalAllTime || 0) > 0
    ? Math.round(((paidAllTime || 0) / (totalAllTime || 1)) * 1000) / 10
    : 0;

  // Per day for last 30 days
  const { data: recentEvents } = await supabase
    .from('play_events')
    .select('played_at')
    .gte('played_at', thirtyDaysAgo);

  const perDayMap: Record<string, number> = {};
  (recentEvents || []).forEach((e: any) => {
    const date = new Date(e.played_at).toISOString().slice(0, 10);
    perDayMap[date] = (perDayMap[date] || 0) + 1;
  });
  const perDay30 = Object.entries(perDayMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Top tracks
  const { data: allEvents } = await supabase
    .from('play_events')
    .select('track_id, user_id, is_vault');

  const trackCounts: Record<string, { plays: number; users: Set<string | null> }> = {};
  (allEvents || []).forEach((e: any) => {
    if (!trackCounts[e.track_id]) {
      trackCounts[e.track_id] = { plays: 0, users: new Set() };
    }
    trackCounts[e.track_id].plays++;
    if (e.user_id) trackCounts[e.track_id].users.add(e.user_id);
  });

  // Fetch track details
  const trackIds = Object.keys(trackCounts);
  let trackDetails: Record<string, { title: string; album_title: string; is_vault: boolean }> = {};
  if (trackIds.length > 0) {
    const { data: tracks } = await supabase
      .from('tracks')
      .select('id, title, is_vault, album_id, albums(title)')
      .in('id', trackIds);
    (tracks || []).forEach((t: any) => {
      trackDetails[t.id] = { title: t.title, album_title: t.albums?.title || '', is_vault: t.is_vault };
    });
  }

  const topTracks = Object.entries(trackCounts)
    .map(([id, v]) => ({
      id,
      title: trackDetails[id]?.title || 'Unknown',
      album_title: trackDetails[id]?.album_title || '',
      is_vault: trackDetails[id]?.is_vault || false,
      plays: v.plays,
      unique_listeners: v.users.size,
    }))
    .sort((a, b) => b.plays - a.plays)
    .slice(0, 20);

  const topVaultTracks = topTracks.filter((t) => t.is_vault).slice(0, 10);

  // By user type
  const anonymous = (allEvents || []).filter((e: any) => e.user_id === null).length;
  const signedInFree = (allEvents || []).filter((e: any) => e.user_id !== null && !e.was_paid).length;
  const paid = (allEvents || []).filter((e: any) => e.was_paid).length;

  return {
    totalAllTime: totalAllTime || 0,
    total30: total30 || 0,
    total7: total7 || 0,
    paidAllTime: paidAllTime || 0,
    freeAllTime: freeAllTime || 0,
    paidPercent,
    perDay30,
    topTracks,
    topVaultTracks,
    byUserType: { anonymous, signed_in_free: signedInFree, paid },
  };
}

export async function getVaultStats() {
  const supabase = createAdminClient();

  const { data: tracks } = await supabase.from('tracks').select('id, is_vault, duration_seconds, album_id');
  const vaultTracks = (tracks || []).filter((t: any) => t.is_vault);
  const vaultAlbumIds = new Set(vaultTracks.map((t: any) => t.album_id));
  const vaultDuration = vaultTracks.reduce((s: number, t: any) => s + (t.duration_seconds || 0), 0);

  const { count: vaultLikes } = await supabase
    .from('liked_tracks')
    .select('*, tracks!inner(is_vault)', { count: 'exact', head: true })
    .eq('tracks.is_vault', true);

  return {
    vaultAlbums: vaultAlbumIds.size,
    vaultTracks: vaultTracks.length,
    vaultDurationSeconds: vaultDuration,
    vaultLikes: vaultLikes || 0,
  };
}