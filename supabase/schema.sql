-- ============================================================================
-- DAILY TRADING TRACKER — SUPABASE TABLES & ROW LEVEL SECURITY (RLS) SCRIPT
-- Applied to project: mmohmuksokqreujzluik (trading-journal)
-- ============================================================================

-- 1. Table: settings
create table if not exists public.settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 2. Table: days
create table if not exists public.days (
  user_id uuid not null references auth.users(id) on delete cascade,
  date text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

-- 3. Enable Row Level Security (RLS) on both tables
alter table public.settings enable row level security;
alter table public.days enable row level security;

-- 4. RLS Policies for public.settings (Signed-in user can only access their own row)
create policy "Users can select own settings"
  on public.settings
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own settings"
  on public.settings
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own settings"
  on public.settings
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own settings"
  on public.settings
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- 5. RLS Policies for public.days (Signed-in user can only access their own rows)
create policy "Users can select own days"
  on public.days
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own days"
  on public.days
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own days"
  on public.days
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own days"
  on public.days
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
