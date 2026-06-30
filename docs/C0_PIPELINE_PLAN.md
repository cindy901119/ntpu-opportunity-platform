# C0_PIPELINE_PLAN

## 版本分流

`v0.x` 是前端與產品主線，處理使用者可見功能、登入、偏好、收藏、提醒與 Email。

`C0.x` 是爬蟲與資料管線支線，處理公開公告抓取、網頁轉文字、raw announcements、附件暫存、n8n、Gemini 草稿整理與人工審核發布。

## C0.1 網頁轉文字原型

目標：把公開公告頁穩定轉成 raw text / JSON / txt，先不接正式資料庫。

目前落地：

- `scripts/crawler/crawl-source.ts`
- `scripts/crawler/output/sample-announcements.json`
- `scripts/crawler/output/text/`

輸出欄位：

- `sourceKey`
- `sourceName`
- `sourceType`
- `title`
- `url`
- `postedDate`
- `rawText`
- `contentHash`
- `matchedKeywords`
- `fetchedAt`

不做：

- 不接前端。
- 不寫入 `published competitions`。
- 不呼叫 Gemini。
- 不處理學生個資。

## C0.2 多來源設定化與 crawler report

目標：把單一腳本整理成可擴充多來源的設定式 crawler。

目前來源：

- `ntpu_osa_extracurricular`：學務處課外組公告。
- `ntpu_osa_life`：學務處生活輔導組，先作為獎助學金／補助來源候選。

每個來源設定：

- `sourceKey`
- `sourceName`
- `sourceType`
- `listUrl`
- `allowedUrlPrefix`
- `includeKeywords`
- `excludeKeywords`
- `maxItems`

report 輸出：

- `scripts/crawler/output/crawler-report.json`
- 每個來源記錄 scanned、matched、fetched、duplicate、failed items。

## C0.3 staging schema

目標：確立中繼資料庫格式，但爬蟲仍不直接發布正式機會。

資料表：

- `raw_announcements`：公告頁原文、URL、hash、抓取時間、初步狀態。
- `raw_announcement_files`：官方簡章或附件的短期快取與抽文字結果。
- `draft_competitions`：Gemini 或人工整理後的待審草稿。

官方簡章暫存原則：

- 可短期暫存 PDF / DOCX / HTML 原檔與 extracted text，供 Gemini 分析與人工審核。
- 審核後長期保留官方 URL、file hash、extracted text 或證據摘要。
- 原始附件可設定 `expires_at`，例如 7 到 30 天後刪除或標記 deleted。

不做：

- crawler 不直接寫入 `competitions`。
- Gemini 不直接發布正式資料。
- staging table 不開放一般使用者讀取。

## C0.4 之後

你研究 n8n 時，建議讓 n8n 只做：

- 定時觸發 crawler。
- URL 去重。
- content hash 去重。
- 寫入 `raw_announcements`。
- 記錄錯誤與 report。

n8n 不應接觸學生個資，也不應直接改 `published competitions`。

## MVP crawler flow

目前 MVP 採用保守半自動流程：

```text
crawler 自動抓公開公告
→ 進 raw_announcements
→ 人工打開 n8n，將 raw 轉成 draft_competitions
→ 人工審核 draft
→ 確認後才匯入 published opportunities / competitions
```

原則：

- crawler 只處理公開公告，不接觸學生個資。
- crawler 可自動寫入 `raw_announcements`，但不得直接寫入 `draft_competitions` 或 `competitions(status = published)`。
- n8n 在 MVP 階段由人工觸發 draft 轉換，避免錯誤公告自動流入審核或前台。
- draft 一律需要人工審核，官方公告、簡章、截止日、資格與獎勵都確認後才可發布。
- 不確定、非第一版核心或低信心資料留在 staging，不發布。
- 已截止但仍有展示價值的資料可保留，由前台標示「已截止」，不得標成時間偏緊。

## C0.4 Raw Ingestion Handoff

目標：先做好 n8n-ready 的 raw ingestion，不必等 n8n 串接完成。

已新增：

- `scripts/crawler/export-raw-sql.mjs`：Node 20 可直接執行的 SQL 匯出器。
- `scripts/crawler/export-raw-sql.ts`：保留型別版原型，方便後續正式整理 build 流程。
- `scripts/crawler/output/raw-announcements.sql`
- `docs/C0_N8N_HANDOFF.md`

流程：

```text
npm run crawl:c0
→ sample-announcements.json
→ npm run crawl:export-raw-sql
→ raw-announcements.sql
→ 人工檢查後才可在 Supabase 執行
```

`raw-announcements.sql` 使用 `source_item_key` 做 upsert。若同一公告的 `source_content_hash` 改變，status 會改成 `needs_review`。

## C0.5 Gemini Draft Contract

目標：先固定 Gemini 輸入／輸出契約，不在 repo 內呼叫 Gemini。

已新增：

- `docs/C0_GEMINI_DRAFT_CONTRACT.md`

原則：

- Gemini 只接收公開公告文字與官方附件 extracted text。
- Gemini 不接收學生個資、偏好、收藏、Email 或提醒設定。
- Gemini 輸出只進草稿，不直接發布。
- 第一階段 `needsHumanReview` 一律為 true。

## C0.6 Human Review Gate

目標：建立 draft → published 的人工審核規則。

已新增：

- `docs/C0_REVIEW_CHECKLIST.md`

核心原則：

- 人工確認後才可發布到 `competitions(status = published)`。
- 截止日不明就保留 null，不硬猜。
- 資格、獎勵、最高獎金必須以官方公告或簡章為準。
- 錯誤、低信心或不屬於第一版核心的公告不得發布。

## v0.10-A / C0 Scholarship Import Prep

目標：先把北大校內獎學金頁整理成可人工檢查、可貼進 Supabase 的 `competitions` SQL 草稿。

已新增：

- `scripts/crawler/crawl-scholarships.mjs`：抓取北大校內獎學金頁，並在 raw text 寫入前移除「獲獎人學號」列。
- `scripts/crawler/scholarship-sources.json`：整理北大系所／學院獎學金來源、狀態提示與排除規則。
- `scripts/crawler/export-scholarships-sql.mjs`：將獎學金 raw announcements 轉成 `public.competitions` 匯入草稿。
- `scripts/crawler/export-department-scholarships-sql.mjs`：將已人工確認的系所／學院獎學金整理成 `public.competitions` 匯入草稿。
- `scripts/crawler/output/scholarship-opportunities.review.sql`
- `scripts/crawler/output/department-scholarship-opportunities.review.sql`

流程：

```text
npm run crawl:scholarships
→ sample-announcements.json
→ npm run crawl:export-scholarships-sql
→ scholarship-opportunities.review.sql
→ 人工檢查後貼到 Supabase SQL Editor

scripts/crawler/scholarship-sources.json
→ npm run crawl:export-department-scholarships-sql
→ department-scholarship-opportunities.review.sql
→ 人工檢查後貼到 Supabase SQL Editor
```

規則：

- 獎學金 row 使用 `opportunity_type = '獎學金'`。
- `reward_types` 保持為金錢型的 `獎金`，避免與機會類型重複。
- 校內獎學金詳情頁暫視為官方頁面，寫入 `official_url`。
- 目前抓到的多數獎學金已截止，匯入後由前台已截止切換控制顯示。
- 涉及海外交換／國際交流的獎學金先不放入 published 草稿，需人工確認是否作為例外。
- 系所／學院來源若只是總頁或需解析 PDF/Word，狀態不得直接設為 `published`。
- 系所／學院獎學金若只有常態辦法、總頁或缺當期截止日，先用 `needs_review`，不直接出現在前台。

## 2026-06-29 crawler trial

本輪修正北大公告列表解析：

- 公告列表的第一個連結可能是 `javascript:void(0)`，真正內頁 URL 在「新分頁開啟公告全文」連結。
- 標題優先取可用連結的 `title`，再退回第一個非「新分頁」連結文字。
- 生活組來源收窄到獎助、急難、補助、救助相關公告，並排除停車證等非 MVP 機會。
- 只收 `/news/` 公告內頁，避免把導覽頁或分類頁混入 raw announcements。

實抓結果：

- `ntpu_osa_extracurricular`：掃到 68 個列表項目，命中並抓取 6 筆。
- `ntpu_osa_life`：掃到 63 個列表項目，命中並抓取 1 筆。
- `sample-announcements.json` 共 7 筆。
- `raw-announcements.sql` 共 7 筆 raw upsert SQL 草稿。

## 2026-06-29 crawler console

新增獨立本機控制台，不接主 WebApp：

- `npm run crawl:ui`
- 預設網址：`http://127.0.0.1:4310`
- 可設定每個來源最多抓幾筆。
- 可切換 `keywords` 精準模式與 `all-news` 寬鬆模式。
- 可查看目前來源，並新增公開公告來源。
- 可按鈕產生 `raw-announcements.sql`。

模式差異：

- `keywords`：只收命中比賽、獎學金、補助、計畫等關鍵字的公告，噪音較低。本輪抓到 7 筆。
- `all-news`：只要是公告內頁就收，適合人工掃更多候選，但會混入音樂會、停車證、就貸公告等噪音。本輪以每來源 20 筆抓到 15 筆。

控制台仍只寫入 `scripts/crawler/output/` 本機檔案，不寫 Supabase、不呼叫 Gemini、不發布 opportunities。

來源設定：

- `scripts/crawler/sources.json`
- 新增來源需填 `sourceKey`、`sourceName`、`listUrl`、`allowedUrlPrefix`、`includeKeywords`、`excludeKeywords`。
- 目前 parser 適合北大新版公告列表的 HTML 結構；新增不同網站後仍需人工檢查 report 與 raw text 品質。

若要發布給組員自行操作，先看 `docs/C0_CRAWLER_CONSOLE_DEPLOYMENT.md`，加上密碼或平台 access control 後再公開。

## n8n raw-to-draft

MVP 階段 n8n 應由人工打開 workflow：

- Manual Trigger。
- 讀取 `raw_announcements(status in ('possible_opportunity', 'needs_review'))`。
- 逐筆呼叫 Gemini，把公開公告整理成 `draft_competitions`。
- `draft_status` 固定為 `needs_review`。
- 成功後將 raw row 標為 `converted`。
- 人工審核 draft 後才匯入 `competitions(status = published)`。

詳細節點設計見 `docs/C0_N8N_RAW_TO_DRAFT.md`。

## C0 scholarship source trial

新增北大校內獎學金專用 crawler：

- 來源：`https://webap.ntpu.edu.tw/scholarship/scholarship.php?class_id=4`
- 指令：`npm run crawl:scholarships -- --max-items=30`
- 控制台：`npm run crawl:ui` 後可按「抓校內獎學金」。
- 輸出仍沿用 `scripts/crawler/output/sample-announcements.json`、`crawler-report.json`、`raw-announcements.sql`。

抓取結果：

- 該頁目前可解析 10 筆校內獎學金。
- `sample-announcements.json` 產出 10 筆。
- `raw-announcements.sql` 產出 10 筆 raw upsert SQL 草稿。

隱私處理：

- 詳情頁可能出現「獲獎人學號」。
- `crawl-scholarships.mjs` 在產生 `rawText` 前會移除「獲獎人學號」整列。
- 本輪檢查 `sample-announcements.json` 未包含「獲獎人學號」標籤，也未檢出疑似 9 碼學號。

注意：

- 獎學金頁多數截止日可能已過，仍可進 raw/staging；是否發布由人工審核決定。
- 不從 raw 直接發布到 `competitions(status = published)`。

## C0 Gmail announcement digest source

學校每日公告信件可作為補充來源，但不直接發布到前台。

定位：

- Gmail 公告清單用來發現當日新增公告與避免漏抓第二頁、第三頁。
- 仍以官方公告 URL 與附件為最終資料來源。
- Email 本文只進 raw/staging，不直接進 `competitions(status = published)`。

建議流程：

```text
Gmail API 搜尋標題「國立臺北大學本日電子郵件公告清單」
→ 解析信件中的公告標題與 URL
→ 以 URL 去重後交給 crawler 抓官方公告頁
→ 寫入 raw_announcements
→ Gemini / 人工整理成 draft_competitions
→ 人工審核後才發布
```

限制：

- 不讀取學生私人信件內容，只查指定寄件者或指定標題的校方公告信。
- 不使用 Email 內容判定資格、截止日或獎金；這些欄位仍以官方公告頁或簡章為準。
- 若 Gmail API 尚未串接，可先由使用者匯出 PDF / HTML，人工轉成候選 URL 清單。

目前產品決策：

- 「劇集劇本創作獎」保留在 `補助／計畫`。
- 「天河教育基金會補助」保留，但因截止日已過，前台應顯示「已截止」。

短期替代流程：

- 在 Gmail API 尚未串接前，使用者可人工篩選公告 URL 並放入 `scripts/crawler/manual-urls.txt`。
- 執行 `npm run crawl:manual-urls` 後，沿用既有 `raw-announcements.sql` 與 `published-opportunities.review.sql` 匯出流程。
- 這個流程會重寫 crawler output，適合單次批次匯入；若要合併多來源，後續需新增 merge 模式。
