# Scholarship Import Checklist

如果前台看不到獎學金，請依序確認：

1. 在 Supabase SQL Editor 執行：

   `scripts/crawler/output/scholarship-opportunities.review.sql`

   這份是校內獎學金主要匯入檔。

2. 如需系所／學院獎學金，再執行：

   `scripts/crawler/output/department-scholarship-opportunities.review.sql`

   注意：這份裡面有些資料仍是 `needs_review`，不會出現在前台。

3. 執行檢查：

   `scripts/crawler/output/check-scholarships.review.sql`

   如果結果中 `opportunity_type = 獎學金` 的 `published` 筆數是 0，代表獎學金尚未匯入或仍不是 published。

4. 前台 `/opportunities` 預設會隱藏已截止機會。多數校內獎學金若已截止，需要按「顯示已截止」才會看到。

