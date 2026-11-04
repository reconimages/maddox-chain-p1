import { createAdminClient } from '@/lib/supabase/admin';

export async function logAdminEvent(params: {
  event_type: 'upload' | 'delete' | 'edit';
  album_id?: string | null;
  track_id?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createAdminClient();
  await supabase.from('admin_events').insert({
    event_type: params.event_type,
    album_id: params.album_id ?? null,
    track_id: params.track_id ?? null,
    metadata: params.metadata ?? null,
  });
}