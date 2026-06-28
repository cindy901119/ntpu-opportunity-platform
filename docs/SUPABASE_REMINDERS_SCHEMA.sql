-- 北大機會雷達 v0.6-A Supabase reminder settings schema
-- 執行前請先完成 docs/SUPABASE_AUTH_SCHEMA.sql。
-- 本檔只建立提醒設定資料模型，不寄 Email、不接 n8n、不接 Gemini。

create table if not exists public.reminder_settings (
  user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id text not null,
  remind_enabled boolean not null default true,
  remind_days_before integer[] not null default '{30,14}',
  preferred_send_time time not null default '09:00',
  notification_email text,
  email_verified boolean not null default false,
  email_test_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, opportunity_id)
);

alter table public.reminder_settings add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.reminder_settings add column if not exists opportunity_id text;
alter table public.reminder_settings add column if not exists remind_enabled boolean not null default true;
alter table public.reminder_settings add column if not exists remind_days_before integer[] not null default '{30,14}';
alter table public.reminder_settings add column if not exists preferred_send_time time not null default '09:00';
alter table public.reminder_settings add column if not exists notification_email text;
alter table public.reminder_settings add column if not exists email_verified boolean not null default false;
alter table public.reminder_settings add column if not exists email_test_sent_at timestamptz;
alter table public.reminder_settings add column if not exists created_at timestamptz not null default now();
alter table public.reminder_settings add column if not exists updated_at timestamptz not null default now();

alter table public.reminder_settings enable row level security;

drop policy if exists "users can read own reminder settings" on public.reminder_settings;
create policy "users can read own reminder settings"
on public.reminder_settings
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "users can insert own reminder settings" on public.reminder_settings;
create policy "users can insert own reminder settings"
on public.reminder_settings
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "users can update own reminder settings" on public.reminder_settings;
create policy "users can update own reminder settings"
on public.reminder_settings
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users can delete own reminder settings" on public.reminder_settings;
create policy "users can delete own reminder settings"
on public.reminder_settings
for delete
to authenticated
using (auth.uid() = user_id);
