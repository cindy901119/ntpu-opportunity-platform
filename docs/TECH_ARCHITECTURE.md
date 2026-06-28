# TECH_ARCHITECTURE

## v0.1 / v0.2 前端 demo

- Next.js
- TypeScript
- Tailwind CSS
- App Router
- mock data
- localStorage
- 前端規則式推薦

## v0.1 不做

- Supabase
- 登入
- n8n
- Gemini
- Email 寄送
- Discord Bot
- 後端

## v0.3-A Supabase 公開資料讀取

- 前端開始讀取 Supabase `competitions` 的 `published` 資料。
- 環境變數未設定、`NEXT_PUBLIC_USE_MOCK_DATA=true` 或 Supabase 讀取失敗時，回退到現有 mock data。
- 使用者偏好、收藏、推薦排序仍保留在前端與 localStorage。
- v0.3-A 不做登入、不做個人資料表、不做雲端收藏、不做提醒。
- 前端仍不得顯示 `internalScore`、推薦分數、加權數字、加幾分或排名數字。

## v0.3-B Supabase 資料品質

- Supabase 讀取層使用 `@supabase/supabase-js`。
- `competitions` schema 補齊詳情頁需要的欄位，讓 Supabase 資料與 mock data 的前端顯示更一致。
- 手動匯入與測試流程記錄在 `docs/SUPABASE_IMPORT_GUIDE.md`。
- 仍只讀取公開機會資料，不寫入使用者資料。

## v0.4-A 人工資料整理

- 新增 `/data-entry` client-only 工作台。
- 工作台只產生 JSON / SQL 草稿，不直接呼叫 Supabase insert。
- 草稿暫存 localStorage。
- 這個階段仍不需要登入與權限管理，因為不進行資料庫寫入。

## v0.4-B 來源與去重

- 新增公開公告來源清單：`docs/SOURCE_REGISTRY.md`。
- `competitions` 補上來源追蹤與去重欄位。
- `source_item_key` 用來辨識同一來源中的同一公告。
- `source_content_hash` 用來偵測公告內容更新。
- `series_key` / `instance_key` 用來區分同系列不同年度與同一活動重複公告。
- 正式自動化前應先建立 raw announcements 暫存表，不要讓爬蟲直接寫入 published competitions。

## v0.4-C 公開來源 sample

- 新增 `docs/SUPABASE_PUBLIC_SAMPLE.sql`，用真實官方公開來源建立 `published` sample。
- sample 仍由人工整理，不做自動抓取、不做 AI 分類。
- `/data-entry` 輸出的 SQL 已納入來源追蹤欄位，方便人工匯入時保留去重資訊。
- 前端仍透過既有 `competitions` 讀取層呈現，保留 mock fallback。

## v0.5-A Auth + profiles

- 使用 Supabase Auth 的 Google provider。
- 新增 `/account` client-only 帳號頁，處理登入、登出、profile 讀取與儲存。
- 新增 `/auth/callback` 作為 OAuth redirect 頁。
- `profiles` table 只保存基本資格欄位，不保存收藏、提醒或 Email 設定。
- 使用者未登入仍可瀏覽公開 `competitions`。
- localStorage 偏好與收藏在 v0.5-A 不會自動同步到雲端。

## v0.5-B Cloud saved competitions

- 新增 `saved_competitions` table，使用 `user_id + opportunity_id` 作為 primary key。
- `opportunity_id` 暫用 text，避免 mock data 與 Supabase UUID 在前端測試時互相卡住。
- 未登入時，收藏仍使用 localStorage。
- 已登入時，收藏按鈕會同步寫入或刪除 `saved_competitions`。
- `/saved` 會在登入後合併本機收藏與雲端收藏，並回寫本機快取。
- 雲端同步失敗不阻斷本機收藏，避免使用者操作中斷。
- 本階段不做提醒、Email、n8n、Gemini 或 AI 個人化推薦。

## v0.5-C Auth and cloud saved verification

- v0.5-C 主要是實機驗證任務，不新增主要功能。
- 驗證 v0.5-A / v0.5-B 的 Supabase Auth、profiles、saved_competitions 與 RLS。
- 驗證未登入 localStorage fallback 仍可使用。
- 這一步需要使用者在 Supabase console 設定 Google provider 並執行 schema。

## v0.5-D Profile and cloud preferences merge

- 新增 `docs/SUPABASE_PREFERENCES_SCHEMA.sql`，建立 `user_preferences` table。
- 新增 `src/lib/profileSync.ts`，集中處理目前登入者的 profile 讀取、localStorage 合併與 profile upsert。
- 新增 `src/lib/preferenceSync.ts`，集中處理完整偏好雲端讀取、建立與 upsert。
- `/preferences` 登入後會讀取 `user_preferences`，並覆蓋本機偏好。
- 若登入後尚無雲端偏好，會用本機偏好建立 `user_preferences`。
- `/preferences` 儲存時，完整 `UserPreferences` 寫入 localStorage 與 Supabase `user_preferences`。
- `/preferences` 儲存時，`profile` 欄位也同步到 Supabase `profiles`。
- `/account` 讀取或儲存 profile 時，會同步更新 localStorage 中的 `profile`。

## v0.6-A Reminder settings

- 新增 `docs/SUPABASE_REMINDERS_SCHEMA.sql`，建立 `reminder_settings` table。
- 新增 `src/lib/reminders.ts`，集中處理提醒設定讀取與儲存。
- 新增 `src/components/ReminderControl.tsx`，放在機會詳情頁。
- 登入使用者可以設定提醒 opt-in、自訂提前天數、偏好寄送時間與通知 Email。
- `reminder_settings` 保留 `email_verified` 與 `email_test_sent_at`，供 v0.6-B 測試信流程使用。
- 未登入使用者只看到登入後可設定提醒的提示。
- v0.6-A 只保存設定，不寄 Email、不接 n8n、不接 Gemini。

## v0.6-B Gmail API test email

- 新增 `src/lib/gmail.ts`，server-side 使用 Gmail OAuth refresh token 換 access token。
- 新增 `app/api/reminders/send-test/route.ts`，登入使用者可寄送提醒測試信。
- 新增 `docs/SUPABASE_NOTIFICATION_LOGS_SCHEMA.sql`，建立 `notification_logs` 寄送紀錄。
- Gmail API 設定文件在 `docs/GMAIL_API_SETUP.md`。
- 測試信成功後更新 `reminder_settings.email_verified` 與 `email_test_sent_at`。
- `notification_logs` 用於記錄 `email_test` 與未來 `deadline_reminder`，正式提醒可用 unique index 避免重複寄送。
- 本階段不做正式提醒排程、不做批次寄送、不做 n8n、不做 Gemini。

## C0.3 Data staging

- 新增 `docs/SUPABASE_STAGING_SCHEMA.sql`，建立 `raw_announcements` 與 `draft_competitions`。
- `raw_announcements` 保存公開公告原文、來源 URL、`source_item_key`、`source_content_hash` 與初步狀態。
- `raw_announcement_files` 保存官方簡章或附件的短期快取、file hash、extracted text 與 `expires_at`。
- `draft_competitions` 保存由 raw announcement 整理出的機會草稿，可連回 `raw_announcement_id`。
- `/data-staging` 提供人工 staging 工作台，輸出 raw / draft JSON 與 SQL 草稿。
- staging 資料不提供 anon public read，避免一般使用者看到未審內容。
- 前台 `/opportunities` 仍只讀取 `competitions(status = published)`。
- 本階段不接 Gemini、不接 n8n、不啟用自動排程，也不處理學生個資。

## 後續正式化方向

- Supabase Auth / Database
- n8n 定時抓資料
- Gemini 整理公告與分類
- Discord Bot
- PWA

## 資料管線原則

- v0.1 只做前端 demo。
- 正式化後，公開公告頁爬蟲是主幹；每日公告 Email 只是輔助偵測來源。
- n8n 負責抓資料、排程、URL 去重、content_hash 去重與關鍵字預篩。
- Gemini 只負責整理與分類公開公告，不負責爬文，也不處理學生資料。
- 學生資料未登入時存在 localStorage；登入或設定提醒後才進資料庫。
- 推薦演算法由前端／後端規則處理，不交給 AI；使用者端只顯示推薦標籤與原因，不顯示分數。
- 後續資料管線需要保留 `series_key` / `instance_key`，用來區分同系列不同年度與同一活動重複公告。
- C0.3 起，正式流程應先寫入 `raw_announcements`，必要時短期暫存官方簡章到 `raw_announcement_files`，整理為 `draft_competitions`，人工確認後才發布為 `competitions`。

## v0.8-A Online Demo Deployment

- 先準備線上 demo，不等所有正式功能完成。
- 第一輪建議部署到 Vercel。
- 第一輪組員展示建議使用 `NEXT_PUBLIC_USE_MOCK_DATA=true`，降低 Supabase schema、RLS、Auth 尚未完全驗證造成空白頁的風險。
- 若要展示真實來源 sample，改用 `NEXT_PUBLIC_USE_MOCK_DATA=false`，並確認 Supabase `competitions(status = published)` 有資料。
- 若要展示 Google Login，Supabase Auth redirect URL 需加入線上 domain 的 `/auth/callback`。
- Gmail API env 只放 server-side environment variables，不放到瀏覽器。
- deployment 檢查清單見 `docs/ONLINE_DEMO_DEPLOYMENT.md`。
