-- Scholarship visibility check.
-- Run this in Supabase SQL Editor if scholarships are not visible on /opportunities.

select
  status,
  count(*) as count
from public.competitions
where opportunity_type = '獎學金'
group by status
order by status;

select
  title,
  status,
  deadline,
  prize_text,
  source_url,
  official_url
from public.competitions
where opportunity_type = '獎學金'
order by deadline nulls first, title;
