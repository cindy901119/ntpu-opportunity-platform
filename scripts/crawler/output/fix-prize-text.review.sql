-- Fix list-card prize_text values that were too verbose.
-- Safe to run after importing published opportunities and scholarship rows.

update public.competitions
set prize_text = values.prize_text,
    updated_at = now()
from (
  values
    ('115年第七屆有事青年行動競賽', '總獎金 900,000 元'),
    ('2026北聯大U-STEP永續行動獎｜AI×ESG創新實踐競賽', '最高 30,000 元'),
    ('2026年臺灣國家公園保育研討會青年論文徵文競賽', '最高 50,000 元'),
    ('2026年學生自主學習LINE社群競賽', '最高 5,000 元'),
    ('2026鏡頭裡的綠色行動永續短影音競賽', '最高 10,000 元'),
    ('2026海洋保育創意短影音競賽', '最高 85,000 元'),
    ('115學年度教育部獎助外國學生短期研習本土語言計畫', '最高每月 28,000 元'),
    ('法律學系助學圓夢清寒優秀學生獎學金', '最高 30,000 元'),
    ('法律學院連玉獎學金', '最高 20,000 元'),
    ('啓一獎勵優秀人才獎學金', '最高 20,000 元'),
    ('英荃獎學金', '最高 20,000 元'),
    ('G-Top獎學金', '最高 50,000 元'),
    ('統計學系清寒獎學金', '最高 10,000 元'),
    ('統計學系城市綠洲獎學金', '最高 20,000 元'),
    ('陳劉月英女士紀念清寒助學金', '最高 10,000 元'),
    ('法律學院法律學系碩博士班專題論文獎學金', '獎金待確認')
) as values(title, prize_text)
where public.competitions.title = values.title;
