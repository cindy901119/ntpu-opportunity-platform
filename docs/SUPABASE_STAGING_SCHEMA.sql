-- 北大機會雷達 C0.3 staging schema
-- 目的：建立 raw announcements、raw files 與 draft competitions 暫存層。
-- 注意：本檔不會讓 crawler、Gemini 或 draft 自動發布到前台。

create extension if not exists pgcrypto;

create table if not exists public.raw_announcements (
  id uuid primary key default gen_random_uuid(),
  source_key text not null,
  source_name text not null,
  source_type text not null default 'school_public_page',
  source_url text not null,
  source_item_key text not null,
  source_title text not null,
  source_posted_date date,
  source_fetched_at timestamptz not null default now(),
  source_content_hash text not null,
  raw_text text not null,
  raw_html text,
  detected_keywords text[] not null default '{}',
  excluded_reason text,
  status text not null default 'new' check (status in ('new', 'possible_opportunity', 'not_relevant', 'duplicate', 'needs_review', 'converted')),
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.raw_announcements add column if not exists source_key text;
alter table public.raw_announcements add column if not exists source_name text;
alter table public.raw_announcements add column if not exists source_type text not null default 'school_public_page';
alter table public.raw_announcements add column if not exists source_url text;
alter table public.raw_announcements add column if not exists source_item_key text;
alter table public.raw_announcements add column if not exists source_title text;
alter table public.raw_announcements add column if not exists source_posted_date date;
alter table public.raw_announcements add column if not exists source_fetched_at timestamptz not null default now();
alter table public.raw_announcements add column if not exists source_content_hash text;
alter table public.raw_announcements add column if not exists raw_text text;
alter table public.raw_announcements add column if not exists raw_html text;
alter table public.raw_announcements add column if not exists detected_keywords text[] not null default '{}';
alter table public.raw_announcements add column if not exists excluded_reason text;
alter table public.raw_announcements add column if not exists status text not null default 'new';
alter table public.raw_announcements add column if not exists review_notes text;
alter table public.raw_announcements add column if not exists created_at timestamptz not null default now();
alter table public.raw_announcements add column if not exists updated_at timestamptz not null default now();

create unique index if not exists raw_announcements_source_item_key_idx
on public.raw_announcements (source_item_key);

create index if not exists raw_announcements_content_hash_idx
on public.raw_announcements (source_content_hash);

create index if not exists raw_announcements_status_idx
on public.raw_announcements (status);

create table if not exists public.raw_announcement_files (
  id uuid primary key default gen_random_uuid(),
  raw_announcement_id uuid references public.raw_announcements(id) on delete cascade,
  source_url text not null,
  file_name text,
  mime_type text,
  file_hash text,
  storage_path text,
  extracted_text text,
  fetched_at timestamptz not null default now(),
  expires_at timestamptz,
  status text not null default 'cached' check (status in ('cached', 'text_extracted', 'failed', 'deleted')),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.raw_announcement_files add column if not exists raw_announcement_id uuid references public.raw_announcements(id) on delete cascade;
alter table public.raw_announcement_files add column if not exists source_url text;
alter table public.raw_announcement_files add column if not exists file_name text;
alter table public.raw_announcement_files add column if not exists mime_type text;
alter table public.raw_announcement_files add column if not exists file_hash text;
alter table public.raw_announcement_files add column if not exists storage_path text;
alter table public.raw_announcement_files add column if not exists extracted_text text;
alter table public.raw_announcement_files add column if not exists fetched_at timestamptz not null default now();
alter table public.raw_announcement_files add column if not exists expires_at timestamptz;
alter table public.raw_announcement_files add column if not exists status text not null default 'cached';
alter table public.raw_announcement_files add column if not exists error_message text;
alter table public.raw_announcement_files add column if not exists created_at timestamptz not null default now();
alter table public.raw_announcement_files add column if not exists updated_at timestamptz not null default now();

create index if not exists raw_announcement_files_raw_idx
on public.raw_announcement_files (raw_announcement_id);

create index if not exists raw_announcement_files_hash_idx
on public.raw_announcement_files (file_hash)
where file_hash is not null;

create index if not exists raw_announcement_files_expiry_idx
on public.raw_announcement_files (expires_at)
where expires_at is not null and status <> 'deleted';

create table if not exists public.draft_competitions (
  id uuid primary key default gen_random_uuid(),
  raw_announcement_id uuid references public.raw_announcements(id) on delete set null,
  title text not null,
  organizer text,
  source_url text not null,
  source_name text,
  source_type text,
  source_posted_date date,
  source_fetched_at timestamptz,
  source_content_hash text,
  source_item_key text,
  series_key text,
  instance_key text,
  deadline date,
  opportunity_type text not null check (opportunity_type in ('比賽', '獎學金', '補助／計畫', '其他')),
  topic_areas text[] not null default '{}',
  category_tags text[] not null default '{}',
  skill_tags text[] not null default '{}',
  submission_types text[] not null default '{}',
  first_stage_deliverables text[] not null default '{}',
  eligibility_text text,
  school_limit text,
  department_limit text,
  grade_limit text,
  prize_text text,
  reward_types text[] not null default '{}',
  max_prize_amount integer,
  summary text,
  special_notes text[] not null default '{}',
  participation_text text,
  schedule jsonb not null default '[]'::jsonb,
  judging_text text,
  draft_status text not null default 'needs_review' check (draft_status in ('needs_review', 'ready_to_publish', 'published', 'rejected')),
  reviewer_notes text,
  published_competition_id uuid references public.competitions(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.draft_competitions add column if not exists raw_announcement_id uuid references public.raw_announcements(id) on delete set null;
alter table public.draft_competitions add column if not exists draft_status text not null default 'needs_review';
alter table public.draft_competitions add column if not exists reviewer_notes text;
alter table public.draft_competitions add column if not exists published_competition_id uuid references public.competitions(id) on delete set null;

create index if not exists draft_competitions_raw_announcement_idx
on public.draft_competitions (raw_announcement_id);

create index if not exists draft_competitions_draft_status_idx
on public.draft_competitions (draft_status);

create index if not exists draft_competitions_source_item_key_idx
on public.draft_competitions (source_item_key)
where source_item_key is not null;

alter table public.raw_announcements enable row level security;
alter table public.raw_announcement_files enable row level security;
alter table public.draft_competitions enable row level security;

-- C0.3 先不開放 anon 讀取 staging 資料。
-- 團隊可先在 Supabase console 或 service-role 環境操作。
drop policy if exists "raw announcements are not public" on public.raw_announcements;
drop policy if exists "raw announcement files are not public" on public.raw_announcement_files;
drop policy if exists "draft competitions are not public" on public.draft_competitions;
