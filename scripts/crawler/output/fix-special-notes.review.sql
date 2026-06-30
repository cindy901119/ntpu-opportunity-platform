-- Remove internal data-cleaning notes from user-facing special_notes.
-- Safe to run after importing published opportunities.

update public.competitions
set special_notes = values.special_notes,
    updated_at = now()
from (
  values
    ('115年第七屆有事青年行動競賽', array['實際分組、資格與交件規則請以官方簡章為準。']::text[]),
    ('2026北聯大U-STEP永續行動獎｜AI×ESG創新實踐競賽', array['前20組完成報名且通過資格審查者，每隊另有1,000元獎勵金，依官方簡章為準。']::text[]),
    ('第五屆群馥盃圖案設計大賽', array['入圍者需依官方通知參加決賽暨頒獎活動。']::text[]),
    ('2026年臺灣國家公園保育研討會青年論文徵文競賽', array['另有其他名次與小論文組獎項，依官方簡章為準。']::text[]),
    ('2026年學生自主學習LINE社群競賽', array['此活動依多個主題分期執行，不硬填單一 deadline。', '另有單場人氣獎、年度個人獎與年度團隊獎，依官方簡章為準。']::text[]),
    ('2026鏡頭裡的綠色行動永續短影音競賽', array['另有第二名、第三名與獎狀，依官方簡章為準。']::text[]),
    ('2026海洋保育創意短影音競賽', array['另有不同組別與獎項，依官方簡章為準。']::text[]),
    ('115學年度教育部獎助外國學生短期研習本土語言計畫', array['本筆需確認官方原始頁與完整申請規則後再發布。']::text[])
) as values(title, special_notes)
where public.competitions.title = values.title;
