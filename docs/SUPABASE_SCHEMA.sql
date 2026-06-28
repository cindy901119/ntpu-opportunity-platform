-- 北大機會雷達 v0.3-A Supabase schema
-- 目的：先讓前端讀取 published competitions，不做登入、不做使用者資料表。

create extension if not exists pgcrypto;

create table if not exists public.competitions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  organizer text,
  source_url text,
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
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.competitions add column if not exists source_name text;
alter table public.competitions add column if not exists source_type text;
alter table public.competitions add column if not exists source_posted_date date;
alter table public.competitions add column if not exists source_fetched_at timestamptz;
alter table public.competitions add column if not exists source_content_hash text;
alter table public.competitions add column if not exists source_item_key text;
alter table public.competitions add column if not exists series_key text;
alter table public.competitions add column if not exists instance_key text;
alter table public.competitions add column if not exists skill_tags text[] not null default '{}';
alter table public.competitions add column if not exists first_stage_deliverables text[] not null default '{}';
alter table public.competitions add column if not exists participation_text text;
alter table public.competitions add column if not exists schedule jsonb not null default '[]'::jsonb;
alter table public.competitions add column if not exists judging_text text;

create unique index if not exists competitions_source_item_key_idx
on public.competitions (source_item_key)
where source_item_key is not null;

create index if not exists competitions_source_content_hash_idx
on public.competitions (source_content_hash)
where source_content_hash is not null;

create index if not exists competitions_series_instance_idx
on public.competitions (series_key, instance_key)
where series_key is not null and instance_key is not null;

alter table public.competitions enable row level security;

drop policy if exists "published competitions are readable" on public.competitions;
create policy "published competitions are readable"
on public.competitions
for select
to anon
using (status = 'published');

insert into public.competitions (
  title,
  organizer,
  source_url,
  deadline,
  opportunity_type,
  topic_areas,
  category_tags,
  skill_tags,
  submission_types,
  first_stage_deliverables,
  eligibility_text,
  school_limit,
  department_limit,
  grade_limit,
  prize_text,
  reward_types,
  max_prize_amount,
  summary,
  special_notes,
  participation_text,
  schedule,
  judging_text,
  status
) values
(
  'AI 校園創新應用競賽',
  '未來創新基金會',
  'https://example.com/ai-campus-guide',
  '2026-07-15',
  '比賽',
  array['科技／程式','創業／新創'],
  array['AI','校園生活','創業'],
  array['企劃','簡報','程式'],
  array['企劃書','簡報','程式／Demo'],
  array['10 頁內企劃書','作品簡報','可附 Demo 連結'],
  '大專院校在學學生可參加，不限科系，可個人或 1–4 人團隊報名。',
  '大專院校',
  '不限',
  '大一、大二、大三、大四、碩一、碩二',
  '最高獎金 100,000 元',
  array['獎金','曝光'],
  100000,
  '鼓勵學生提出能改善校園服務或學習體驗的 AI 應用方案。',
  array['入圍後需到現場簡報。','Demo 可加分，但初賽不強制提交。'],
  '個人或 1–4 人團隊',
  '[{"date":"7/15","label":"報名與初賽資料繳交截止"},{"date":"8/1","label":"公布決賽入圍名單"},{"date":"8/20","label":"現場決賽簡報"}]'::jsonb,
  '創新性、可行性、使用者價值、簡報表現',
  'published'
),
(
  '北大學生自主學習獎學金',
  '國立臺北大學學務處',
  'https://example.com/ntpu-scholarship',
  '2026-07-22',
  '獎學金',
  array['不限／不適用'],
  array['校園生活'],
  array['寫作','企劃'],
  array['申請表','證明文件'],
  array['申請表','自主學習計畫','歷年成績單'],
  '國立臺北大學在學學生可申請，需提出自主學習計畫。',
  '國立臺北大學',
  '不限',
  '大一、大二、大三、大四、碩一、碩二',
  '獎學金 20,000 元',
  array['獎學金'],
  20000,
  '支持北大學生自主學習、專題探索與作品累積。',
  array['需附成績單與在學證明。','獲獎後需提交學習成果摘要。'],
  '個人申請',
  '[{"date":"7/22","label":"申請截止"},{"date":"8/15","label":"審查結果公告"}]'::jsonb,
  null,
  'published'
),
(
  '學生創業原型補助',
  '校園創業支持中心',
  'https://example.com/startup-prototype',
  '2026-09-18',
  '補助／計畫',
  array['創業／新創','科技／程式','商業／企劃'],
  array['創業','AI','金融'],
  array['企劃','程式','設計'],
  array['企劃書','程式／Demo','簡報'],
  array['原型計畫書','Demo 截圖或連結','預算表'],
  '資格公告未完整列明，建議報名前確認官方簡章。',
  '需確認',
  null,
  null,
  '最高補助 60,000 元',
  array['補助','實體資源'],
  60000,
  '協助學生將產品構想做成可展示的初版原型。',
  array['補助款需依核定用途支用。','期末需提交成果展示資料。'],
  '個人或團隊',
  '[{"date":"9/18","label":"申請截止"}]'::jsonb,
  null,
  'published'
);
