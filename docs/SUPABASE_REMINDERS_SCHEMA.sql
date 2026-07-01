-- 北大機會雷達 reminders schema
-- Run after docs/SUPABASE_AUTH_SCHEMA.sql and docs/SUPABASE_SCHEMA.sql.

create extension if not exists pgcrypto;

create table if not exists public.reminder_settings (
  user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id uuid not null references public.competitions(id) on delete cascade,
  remind_enabled boolean not null default false,
  remind_days_before integer[] not null default array[30, 14],
  preferred_send_time time not null default '09:00',
  notification_email text,
  email_verified boolean not null default false,
  email_test_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, opportunity_id)
);

alter table public.reminder_settings add column if not exists remind_enabled boolean not null default false;
alter table public.reminder_settings add column if not exists remind_days_before integer[] not null default array[30, 14];
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

create table if not exists public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  opportunity_id uuid references public.competitions(id) on delete set null,
  notification_type text not null,
  sent_to text,
  provider text,
  provider_message_id text,
  status text not null default 'pending',
  lead_days integer,
  error_message text,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.notification_logs add column if not exists lead_days integer;
alter table public.notification_logs add column if not exists error_message text;

create index if not exists notification_logs_user_opportunity_idx
on public.notification_logs (user_id, opportunity_id, notification_type, lead_days, sent_at desc);

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
