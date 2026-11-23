-- ============================================================================
-- SUPABASE STORAGE SETUP: PRIVATE 'trade-charts' BUCKET & RLS POLICIES
-- Paste and run this single script in your Supabase SQL Editor.
-- Path format enforced: <user_id>/<yyyy-mm-dd>/<trade_id>-<slot>-<timestamp>.webp
-- ============================================================================

-- 1. Create the private storage bucket "trade-charts" (public: false, max 10MB)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'trade-charts',
  'trade-charts',
  false,
  10485760,
  array['image/webp', 'image/png', 'image/jpeg']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/webp', 'image/png', 'image/jpeg'];

-- 2. Clean up existing policies if re-running this script
drop policy if exists "trade_charts_select_own" on storage.objects;
drop policy if exists "trade_charts_insert_own" on storage.objects;
drop policy if exists "trade_charts_update_own" on storage.objects;
drop policy if exists "trade_charts_delete_own" on storage.objects;

-- 3. Row-Level Security policies on storage.objects (authenticated owner only, no anonymous access)
create policy "trade_charts_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'trade-charts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "trade_charts_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'trade-charts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "trade_charts_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'trade-charts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'trade-charts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "trade_charts_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'trade-charts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
