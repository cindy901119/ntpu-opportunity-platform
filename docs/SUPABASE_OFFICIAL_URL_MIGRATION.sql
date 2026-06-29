-- Add official_url for the real organizer guide/application page.
-- source_url remains the discovery/source announcement URL, such as NTPU email/bulletin announcements.

alter table public.competitions
add column if not exists official_url text;
