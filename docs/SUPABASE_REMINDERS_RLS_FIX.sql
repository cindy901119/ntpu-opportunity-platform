-- 北大機會雷達 reminder/log RLS fix
-- Use this if test emails are sent but the UI says database records failed to update.

alter table public.reminder_settings enable row level security;
alter table public.notification_logs enable row level security;

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
