-- 北大機會雷達 saved competitions schema/RLS fix
-- Use this if the UI says cloud saved sync failed but local saved items are preserved.

create table if not exists public.saved_competitions (
  user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, opportunity_id)
);

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
