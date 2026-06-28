# C0_PIPELINE_STAGING_PLAN

## 目標

C0.3 的目標是把公開公告資料管線拆成可審核的階段，避免爬蟲、人工整理或未來 AI 分類結果直接進入前台 `published competitions`。

## C0.3：本次推進

- 新增 `raw_announcements` 暫存表規格。
- 新增 `raw_announcement_files` 官方簡章／附件暫存表規格。
- 新增 `draft_competitions` 待審草稿表規格。
- 新增 `/data-staging` 人工 staging 工作台。
- `raw_announcements` 保存公告原文、來源 URL、hash、抓取時間與初步狀態。
- `raw_announcement_files` 保存官方簡章原檔快取資訊、file hash、extracted text 與 `expires_at`。
- `draft_competitions` 保存由公告整理出的機會草稿，但不會直接顯示在 `/opportunities`。
- 人工確認後，才把 draft 整理成 `competitions` 的 `published` 資料。

## C0.3 不做

- 不啟用自動排程。
- 不讓爬蟲直接發布到 `competitions`。
- 不把 draft 顯示給一般使用者。
- 不接 Gemini 或其他 AI 分類。
- 不處理學生個資。
- 不寄 Email。
- 不接 n8n。
- 不做後台角色權限 UI。

## 資料階段

```text
公開公告來源
→ raw_announcements
→ raw_announcement_files（可選，短期暫存官方簡章）
→ draft_competitions
→ 人工審核
→ competitions(status = published)
→ 前台 /opportunities
```

## Supabase 設定

執行：

```text
docs/SUPABASE_STAGING_SCHEMA.sql
```

## 驗收

1. Supabase 可建立 `raw_announcements` 與 `draft_competitions`。
2. raw announcement 可保存來源、原文、hash 與抓取時間。
3. draft competition 可連回 raw announcement。
4. draft 不會出現在 `/opportunities`。
5. `/data-staging` 可以產生 raw / draft JSON 與 SQL 草稿。
6. 仍需人工把確認後的 draft 轉成 `competitions(status = published)`。

## C0.4 候選

- 讓爬蟲原型輸出可以轉成 `raw_announcements` SQL。
- 新增簡單去重檢查腳本。
- 建立 draft → published 的人工操作指南。
- 研究是否需要 admin-only 審核頁。
