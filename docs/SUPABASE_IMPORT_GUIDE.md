# SUPABASE_IMPORT_GUIDE

## v0.3-B 手動測試流程

1. 在 Supabase SQL editor 執行 `docs/SUPABASE_SCHEMA.sql`。
2. 接著執行 `docs/SUPABASE_SEED.sql`，建立 9 筆 demo 資料。
3. 在本機 `.env.local` 填入：

```env
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_SUPABASE_URL=你的 Supabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的 anon key
```

4. 重新啟動 `npm run dev`。
5. 打開 `/opportunities`。
6. 若列表仍為 0 筆，先點「放寬篩選」確認資料是否已讀到。
7. 若放寬後仍為 0 筆，檢查 Supabase `competitions` 是否至少有一筆 `status = 'published'`。

## 必填欄位

- `title`
- `opportunity_type`
- `status`

## 強烈建議填寫

- `source_url`
- `deadline`
- `topic_areas`
- `category_tags`
- `skill_tags`
- `submission_types`
- `first_stage_deliverables`
- `eligibility_text`
- `school_limit`
- `department_limit`
- `grade_limit`
- `prize_text`
- `reward_types`
- `max_prize_amount`
- `summary`
- `special_notes`

## 欄位對應

- `category_tags` 會顯示為卡片與詳情頁的主題 tag。
- `skill_tags` 會參與偏好交集與推薦排序。
- `submission_types` 是交件形式。
- `first_stage_deliverables` 是卡片與詳情頁優先顯示的交件內容。
- `participation_text` 顯示參賽方式或申請方式，不屬於「我的資格」filter。
- `schedule` 使用 JSON array，例如：

```json
[
  { "date": "7/15", "label": "報名截止" },
  { "date": "8/20", "label": "現場決賽簡報" }
]
```

## 常見空列表原因

- `.env.local` 指到 Supabase，但資料表沒有 `published` 資料。
- RLS policy 尚未建立或未允許 anon 讀取 published 資料。
- 使用者 localStorage 的篩選條件太窄。
- 資料缺少 `topic_areas`、`reward_types` 或 `max_prize_amount`，導致被 filter 排除。

## Demo seed 覆蓋範圍

- 比賽：4 筆
- 獎學金：2 筆
- 補助／計畫：2 筆
- 其他：1 筆

`docs/SUPABASE_SEED.sql` 會先移除 `https://example.com/%` demo 資料，再插入 9 筆穩定 UUID 的資料，方便重跑與回溯。

## 回到 mock data

若只想確認前端畫面，先把 `.env.local` 改成：

```env
NEXT_PUBLIC_USE_MOCK_DATA=true
```

改完後重新啟動 `npm run dev`。

## v0.4-A 資料匯入工作台

開啟 `/data-entry` 可以把公告整理成 `competitions` 草稿。

目前工作台只在瀏覽器端運作：

- 不會直接寫入 Supabase。
- 不需要登入。
- 草稿存在 localStorage。
- 可以複製 JSON。
- 可以複製 SQL insert 草稿。

建議流程：

1. 先把官方簡章連結與公告摘要整理進 `/data-entry`。
2. 確認基本欄位提示沒有缺漏。
3. 複製 SQL 草稿。
4. 人工檢查後貼到 Supabase SQL editor。

## v0.4-B 來源與去重欄位

公開來源清單請看 `docs/SOURCE_REGISTRY.md`。

新增來源追蹤欄位：

- `source_name`
- `source_type`
- `source_posted_date`
- `source_fetched_at`
- `source_content_hash`
- `source_item_key`
- `series_key`
- `instance_key`

匯入時建議至少填：

- `source_name`
- `source_item_key`
- `source_content_hash`
- `series_key`
- `instance_key`

判斷方式：

1. `source_item_key` 已存在，代表同一公告。
2. `source_content_hash` 不同，代表公告內容可能更新，需要人工確認。
3. `series_key + instance_key` 相同，代表可能是同一年度或同一梯次的重複公告。

## v0.4-C 真實公開來源 sample

`docs/SUPABASE_PUBLIC_SAMPLE.sql` 提供 3 筆真實官方公開來源 sample，目的只是在本機與 Supabase 測試資料鏈路：

- 官方公告／簡章 URL 可保留在 `source_url`。
- 資料可寫入 `competitions` 並設為 `status = 'published'`。
- `/opportunities` 與 `/opportunities/[id]` 可讀取並顯示。
- 卡片與詳情頁的「查看官方簡章」可開啟來源頁。

建議執行順序：

1. 執行 `docs/SUPABASE_SCHEMA.sql`。
2. 若需要 demo 資料，執行 `docs/SUPABASE_SEED.sql`。
3. 執行 `docs/SUPABASE_PUBLIC_SAMPLE.sql`。
4. 確認 `.env.local` 使用 Supabase：

```env
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_SUPABASE_URL=你的 Supabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的 anon key
```

5. 重新啟動 `npm run dev`。
6. 打開 `/opportunities`。

注意：

- v0.4-C sample 使用真實官方來源，因此部分機會可能已過截止日或公告資訊不完整。
- 若列表看不到 sample，先點「放寬篩選」確認 Supabase 是否讀得到資料。
- 真實來源 sample 仍需人工確認，不能視為正式資料庫內容。

## C0 crawler output 匯入流程

爬蟲輸出分成兩種匯入目的：

1. raw staging：保存公告原文，供後續審核與轉換。
2. published competitions：替換前台 demo/sample 資料，會直接出現在 `/opportunities`。

目前 crawler 會輸出：

- `scripts/crawler/output/sample-announcements.json`
- `scripts/crawler/output/crawler-report.json`
- `scripts/crawler/output/raw-announcements.sql`
- `scripts/crawler/output/published-opportunities.review.sql`
- `scripts/crawler/output/text/`

raw staging 匯入：

```text
npm run crawl:c0
npm run crawl:export-raw-sql
```

接著在 Supabase SQL editor 執行：

```text
docs/SUPABASE_STAGING_SCHEMA.sql
scripts/crawler/output/raw-announcements.sql
```

這一步只會寫入 `raw_announcements`，不會出現在前台。

替換前台 demo/sample 資料：

```text
npm run crawl:export-published-sql
```

接著人工檢查：

```text
scripts/crawler/output/published-opportunities.review.sql
```

確認截止日、資格、獎金、機會類型與第一版範圍都正確後，再貼到 Supabase SQL editor 執行。這個 SQL 會刪除 `https://example.com/%` demo 資料，並 upsert 到 `competitions(status = 'published')`。

注意：

- `published-opportunities.review.sql` 是替換 demo 用的發布草稿，不是全自動審核結果。
- crawler 可能抓到課程、說明會、活動公告、急難救助、一般文化推廣計畫、草案預告或評審推薦表；這些不放進第一版前台資料，不可直接全部發布。
- 若要前台讀 Supabase，`.env.local` 需設定 `NEXT_PUBLIC_USE_MOCK_DATA=false` 並填入 Supabase URL 與 anon key。

## v0.5-A Google Login + profiles

v0.5-A 需要先在 Supabase Auth 啟用 Google provider，並執行 `docs/SUPABASE_AUTH_SCHEMA.sql`。

本版只建立 `profiles`：

- `id`
- `email`
- `display_name`
- `school`
- `major_department`
- `grade`
- `double_major_department`
- `minor_department`

本版不建立 `saved_competitions`、reminders、Email 或 n8n 自動化。

本機測試流程：

1. 在 Supabase Auth 啟用 Google provider。
2. 在 Auth redirect URLs 加入：

```text
http://localhost:3000/auth/callback
```

3. 執行 `docs/SUPABASE_AUTH_SCHEMA.sql`。
4. 確認 `.env.local` 已填 Supabase URL 與 anon key。
5. 重新啟動 `npm run dev`。
6. 開啟 `/account`。
7. 使用 Google 登入。
8. 登入後儲存 profile。
9. 到 Supabase `profiles` table 確認資料已寫入。

## v0.5-B 雲端收藏

v0.5-B 需要先完成 v0.5-A Google Login + profiles，再執行 `docs/SUPABASE_SAVED_SCHEMA.sql`。

本版只建立 `saved_competitions`：

- `user_id`
- `opportunity_id`
- `created_at`

本機測試流程：

1. 執行 `docs/SUPABASE_AUTH_SCHEMA.sql`。
2. 執行 `docs/SUPABASE_SAVED_SCHEMA.sql`。
3. 確認 Google Login 可使用。
4. 開啟 `/opportunities`。
5. 登入後收藏一筆機會。
6. 到 Supabase `saved_competitions` table 確認資料已寫入。
7. 重新整理 `/saved`，確認收藏仍存在。

注意：

- 未登入時收藏仍存在 localStorage。
- 登入後 `/saved` 會合併本機收藏與雲端收藏。
- 雲端同步失敗時，本機收藏會先保留。
- 本版不做提醒、Email、n8n、Gemini 或 AI 個人化推薦。

## v0.5-C 實機驗證

v0.5-C 是驗證任務，需要在 Supabase console 完成設定後進行。

測試流程：

1. 執行 `docs/SUPABASE_AUTH_SCHEMA.sql`。
2. 執行 `docs/SUPABASE_SAVED_SCHEMA.sql`。
3. 在 Supabase Auth 啟用 Google provider。
4. 設定 redirect URL：

```text
http://localhost:3000/auth/callback
```

5. 開啟 `/account`，測試登入、登出與 profile upsert。
6. 開啟 `/opportunities`，收藏一筆機會。
7. 到 Supabase `saved_competitions` 確認資料已寫入。
8. 重新整理 `/saved`，確認收藏仍存在。
9. 以另一個帳號確認無法看到前一個帳號的 profile 與收藏。

## v0.5-D profile / preferences 合併

v0.5-D 需要執行 `docs/SUPABASE_PREFERENCES_SCHEMA.sql`，建立 `user_preferences`。

資料保存規則：

- `profiles`：只保存「我的資格」基本欄位。
- `user_preferences`：保存完整偏好設定。
- localStorage：未登入 fallback，也作為本機快取。
- 登入後 `/preferences` 會用雲端偏好更新本機偏好。
- 若雲端尚無偏好，會用本機偏好建立雲端偏好。
- 儲存 `/preferences` 時，完整偏好保存到 localStorage 與 `user_preferences`，基本資格同步到 `profiles`。

本機測試流程：

1. 完成 v0.5-A Google Login 設定。
2. 執行 `docs/SUPABASE_AUTH_SCHEMA.sql`。
3. 執行 `docs/SUPABASE_PREFERENCES_SCHEMA.sql`。
4. 登入後開啟 `/preferences`。
5. 修改偏好並儲存。
6. 到 Supabase `user_preferences` table 確認 preferences 已更新。
7. 到 Supabase `profiles` table 確認 school、major_department、grade 等欄位更新。
8. 登出後仍可使用 localStorage 偏好。

## v0.6-A 提醒設定

v0.6-A 需要執行 `docs/SUPABASE_REMINDERS_SCHEMA.sql`，建立 `reminder_settings`。

本版只儲存提醒設定，不寄 Email。

本機測試流程：

1. 完成 v0.5-A Google Login 設定。
2. 執行 `docs/SUPABASE_AUTH_SCHEMA.sql`。
3. 執行 `docs/SUPABASE_REMINDERS_SCHEMA.sql`。
4. 登入後開啟任一 `/opportunities/[id]` 詳情頁。
5. 在「提醒設定」區塊開啟提醒、設定提前天數、設定寄送時間、填入 Email。
6. 儲存後到 Supabase `reminder_settings` table 確認資料已寫入。
7. 重新整理詳情頁，確認提醒設定可讀回。

注意：

- 未登入使用者只會看到登入後可設定提醒的提示。
- 本版不寄 Email、不接 n8n、不接 Gemini。
- v0.6-B 寄信前應先建立測試信流程與 `notification_logs`，不要只靠修改 `remind_enabled` 判斷是否已寄過。

## v0.6-B Gmail API 測試信

Gmail API 設定請看 `docs/GMAIL_API_SETUP.md`。

需要先執行：

```text
docs/SUPABASE_AUTH_SCHEMA.sql
docs/SUPABASE_REMINDERS_SCHEMA.sql
docs/SUPABASE_NOTIFICATION_LOGS_SCHEMA.sql
```

`.env.local` 需要：

```env
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REFRESH_TOKEN=
GMAIL_SENDER_EMAIL=
```

測試方式：

1. 重啟 dev server。
2. 登入網站。
3. 打開任一機會詳情頁。
4. 設定提醒 Email 並儲存。
5. 點「寄送測試信」。
6. 收到測試信後，確認 Supabase `reminder_settings.email_verified = true`。
7. 確認 Supabase `notification_logs` 有 `email_test` 紀錄。

注意：

- 本階段不做正式截止提醒排程。
- 若 Gmail env 未設定，前端會顯示 Gmail API 尚未設定完成。

## v0.7-A raw / draft staging

v0.7-A 需要執行 `docs/SUPABASE_STAGING_SCHEMA.sql`，建立資料暫存層。

資料流程：

```text
公開公告來源
→ raw_announcements
→ draft_competitions
→ 人工確認
→ competitions(status = published)
```

本機操作流程：

1. 執行 `docs/SUPABASE_SCHEMA.sql`，確認 `competitions` 已存在。
2. 執行 `docs/SUPABASE_STAGING_SCHEMA.sql`。
3. 開啟 `/data-staging`。
4. 將公開公告 URL、標題、原文與 hash 整理成 raw announcement。
5. 複製 raw SQL 到 Supabase，建立或更新 `raw_announcements`。
6. 點「帶入 draft」，整理機會欄位。
7. 複製 draft SQL 到 Supabase，建立 `draft_competitions`。
8. 人工比對官方簡章後，再用 `/data-entry` 或人工 SQL 發布到 `competitions(status = published)`。

注意：

- `raw_announcements` 與 `draft_competitions` 不開放一般使用者讀取。
- `/opportunities` 不會讀取 staging table。
- v0.7-A 不接 Gemini、不接 n8n、不啟用自動排程。
- 若未來接自動化，爬蟲也應先寫入 `raw_announcements`，不能直接寫入 `published competitions`。

## Online Demo Deployment

線上 demo 部署與展示流程請看：

```text
docs/ONLINE_DEMO_DEPLOYMENT.md
```

第一輪組員 demo 建議先使用：

```env
NEXT_PUBLIC_USE_MOCK_DATA=true
```

若要展示 Supabase 真實資料，需先確認：

- `docs/SUPABASE_SCHEMA.sql` 已執行。
- `docs/SUPABASE_PUBLIC_SAMPLE.sql` 已執行。
- `competitions` 至少有一筆 `status = 'published'`。
- 若展示登入，Supabase Auth redirect URL 已包含線上網址。
