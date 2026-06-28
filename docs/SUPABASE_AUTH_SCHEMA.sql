-- 北大機會雷達 v0.5-A Supabase Auth + profiles schema
-- 執行前請先確認 Supabase Auth 已啟用 Google provider。
-- 本檔只建立 profiles，不建立雲端收藏、提醒、Email 或 n8n 流程。

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  school text not null default '國立臺北大學',
  major_department text not null default '金融系',
  grade text not null default '大三',
  double_major_department text,
  minor_department text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists school text not null default '國立臺北大學';
alter table public.profiles add column if not exists major_department text not null default '金融系';
alter table public.profiles add column if not exists grade text not null default '大三';
alter table public.profiles add column if not exists double_major_department text;
alter table public.profiles add column if not exists minor_department text;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

alter table public.profiles enable row level security;

drop policy if exists "users can read own profile" on public.profiles;
create policy "users can read own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "users can insert own profile" on public.profiles;
create policy "users can insert own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "users can update own profile" on public.profiles;
create policy "users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);
