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
