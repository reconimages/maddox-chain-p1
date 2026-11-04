-- Phase 4 migration (Maddox Chain): allow client-side uploads via anon key
-- Required for resumable (TUS) uploads of large files (70MB+).
-- Buckets remain PRIVATE (public=false); only upload/list/delete via RLS.

-- Allow anon to upload (insert) objects
do $$ begin
  create policy "audio insert" on storage.objects
    for insert with check (bucket_id = 'audio');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "covers insert" on storage.objects
    for insert with check (bucket_id = 'covers');
exception when duplicate_object then null; end $$;

-- Allow anon to update (upsert) objects
do $$ begin
  create policy "audio update" on storage.objects
    for update using (bucket_id = 'audio')
    with check (bucket_id = 'audio');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "covers update" on storage.objects
    for update using (bucket_id = 'covers')
    with check (bucket_id = 'covers');
exception when duplicate_object then null; end $$;

-- Allow anon to delete objects (for cleanup)
do $$ begin
  create policy "audio delete" on storage.objects
    for delete using (bucket_id = 'audio');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "covers delete" on storage.objects
    for delete using (bucket_id = 'covers');
exception when duplicate_object then null; end $$;
