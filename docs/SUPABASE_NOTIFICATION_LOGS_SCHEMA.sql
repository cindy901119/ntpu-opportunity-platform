-- 北大機會雷達 v0.6-B notification logs schema
-- 目的：記錄測試信與正式提醒寄送結果，避免同一提醒重複寄送。
-- 執行前請先完成 docs/SUPABASE_AUTH_SCHEMA.sql 與 docs/SUPABASE_REMINDERS_SCHEMA.sql。

create extension if not exists pgcrypto;

create table if not exists public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id text,
  notification_type text not null check (notification_type in ('email_test', 'deadline_reminder')),
  reminder_days_before integer,
  scheduled_for date,
  sent_to text not null,
  provider text not null default 'gmail_api',
  provider_message_id text,
  status text not null check (status in ('sent', 'failed', 'skipped')),
  error_message text,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.notification_logs add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.notification_logs add column if not exists opportunity_id text;
alter table public.notification_logs add column if not exists notification_type text;
alter table public.notification_logs add column if not exists reminder_days_before integer;
alter table public.notification_logs add column if not exists scheduled_for date;
alter table public.notification_logs add column if not exists sent_to text;
alter table public.notification_logs add column if not exists provider text not null default 'gmail_api';
alter table public.notification_logs add column if not exists provider_message_id text;
alter table public.notification_logs add column if not exists status text;
alter table public.notification_logs add column if not exists error_message text;
alter table public.notification_logs add column if not exists sent_at timestamptz not null default now();
alter table public.notification_logs add column if not exists created_at timestamptz not null default now();

create index if not exists notification_logs_user_idx
on public.notification_logs (user_id, sent_at desc);

create unique index if not exists notification_logs_deadline_once_idx
on public.notification_logs (user_id, opportunity_id, notification_type, reminder_days_before, scheduled_for)
where notification_type = 'deadline_reminder' and status = 'sent';

alter table public.notification_logs enable row level security;

drop policy if exists "users can read own notification logs" on public.notification_logs;
create policy "users can read own notification logs"
on public.notification_logs
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "users can insert own notification logs" on public.notification_logs;
create policy "users can insert own notification logs"
on public.notification_logs
for insert
to authenticated
with check (auth.uid() = user_id);

