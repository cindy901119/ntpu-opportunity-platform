-- 北大機會雷達 v0.5-B Supabase saved_competitions schema
-- 執行前請先完成 docs/SUPABASE_AUTH_SCHEMA.sql。
-- 本檔只建立雲端收藏，不建立提醒、Email、n8n 或 Gemini 流程。

create table if not exists public.saved_competitions (
  user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, opportunity_id)
);

alter table public.saved_competitions add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.saved_competitions add column if not exists opportunity_id text;
alter table public.saved_competitions add column if not exists created_at timestamptz not null default now();

alter table public.saved_competitions enable row level security;

drop policy if exists "users can read own saved competitions" on public.saved_competitions;
create policy "users can read own saved competitions"
on public.saved_competitions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "users can insert own saved competitions" on public.saved_competitions;
create policy "users can insert own saved competitions"
on public.saved_competitions
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "users can delete own saved competitions" on public.saved_competitions;
create policy "users can delete own saved competitions"
on public.saved_competitions
for delete
to authenticated
using (auth.uid() = user_id);
