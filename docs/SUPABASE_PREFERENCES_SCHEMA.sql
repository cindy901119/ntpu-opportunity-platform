-- 北大機會雷達 v0.5-D Supabase user_preferences schema
-- 執行前請先完成 docs/SUPABASE_AUTH_SCHEMA.sql。
-- 本檔只建立雲端偏好同步，不建立提醒、Email、n8n 或 Gemini 流程。

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_preferences add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.user_preferences add column if not exists preferences jsonb not null default '{}'::jsonb;
alter table public.user_preferences add column if not exists created_at timestamptz not null default now();
alter table public.user_preferences add column if not exists updated_at timestamptz not null default now();

alter table public.user_preferences enable row level security;

drop policy if exists "users can read own preferences" on public.user_preferences;
create policy "users can read own preferences"
on public.user_preferences
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "users can insert own preferences" on public.user_preferences;
create policy "users can insert own preferences"
on public.user_preferences
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "users can update own preferences" on public.user_preferences;
create policy "users can update own preferences"
on public.user_preferences
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
