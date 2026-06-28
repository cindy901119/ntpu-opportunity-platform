# CHANGELOG

## v0.8-A - 2026-06-28

### Added

- 新增 `docs/ONLINE_DEMO_DEPLOYMENT.md`，整理線上 demo 部署、環境變數、展示順序與檢查清單。
- 新增 `docs/V0_8_PLAN.md`。
- 新增 `vercel.json`，明確標示 Vercel framework 為 Next.js。

### Notes

- 因為需要向組員展示 demo，online deployment 需求提前插隊。
- 第一輪組員展示建議使用 `NEXT_PUBLIC_USE_MOCK_DATA=true`，先確保完整流程可看。
- Online demo 是展示版本，不等同正式 Production launch。
- 2026-06-28 `npm run build` 已通過；Vercel CLI 版本檢查曾遇到 Windows npm cache cleanup `EPERM`，第一輪建議走 GitHub + Vercel Web UI。

## C0.1-C0.3 - 2026-06-27

### Added

- `scripts/crawler/crawl-source.ts` 改為多來源設定式 crawler。
- 新增 `scripts/crawler/output/crawler-report.json`。
- 新增 `scripts/crawler/output/text/` 文字快照輸出。
- 新增 `docs/C0_PIPELINE_PLAN.md`。
- `docs/SUPABASE_STAGING_SCHEMA.sql` 新增 `raw_announcement_files`，用於官方簡章／附件短期暫存與 extracted text。

### Changed

- crawler output 補上 `sourceKey`、`sourceType`、`matchedKeywords`，更接近 `raw_announcements` schema。
- 資料管線版本命名改用 C0.x，避免和前端／產品主線 v0.x 混淆。
- `SOURCE_REGISTRY.md` 與 staging 文件同步 C0.2 / C0.3 語意。

### Notes

- 本版不接前端、不接 n8n、不呼叫 Gemini、不寫入 Supabase、不寫入 `published competitions`。
- n8n 後續只應處理公開公告抓取、去重、錯誤紀錄與 raw 寫入，不應接觸學生個資。

## v0.6-B-test - 2026-06-26

### Added

- 新增 Gmail API server-side 寄信 helper。
- 新增 `/api/reminders/send-test`，登入使用者可寄送提醒測試信。
- 新增 `docs/SUPABASE_NOTIFICATION_LOGS_SCHEMA.sql`，建立寄送紀錄表。
- 新增 `docs/GMAIL_API_SETUP.md`。
- `.env.local.example` 補上 Gmail API 需要的 server-side env。

### Changed

- 提醒設定區新增「寄送測試信」按鈕。
- 測試信寄送成功後，會標記 `reminder_settings.email_verified = true` 並寫入 `notification_logs`。
- `V0_6_PLAN.md`、`TECH_ARCHITECTURE.md`、`PRODUCT_DECISIONS.md`、`SUPABASE_IMPORT_GUIDE.md` 同步 Gmail API 測試信流程。

### Notes

- 本版只做測試信，不做正式截止提醒排程。
- Gmail client secret 與 refresh token 只能放在 server-side env，不能暴露到瀏覽器。

## v0.6-A.1 - 2026-06-26

### Changed

- 提醒設定從固定截止前 7 / 3 / 1 天，改為可輸入自訂提前天數，預設偏向較早提醒。
- 提醒設定新增偏好寄送時間欄位。
- `reminder_settings` schema 新增 `preferred_send_time`、`email_verified`、`email_test_sent_at`。
- v0.6-B Email 方向更新為先評估 Gmail，並補上測試信、寄送紀錄與避免重複寄送的決策。

### Notes

- 本版仍不寄 Email。
- 重複寄送應由後續 `notification_logs` 控制，不應把提醒設定本身改成一次性 true/false。

## v0.7-A - 2026-06-26

### Added

- 新增 `docs/SUPABASE_STAGING_SCHEMA.sql`，建立 `raw_announcements` 與 `draft_competitions` 暫存層。
- 新增 `docs/V0_7_PLAN.md`。
- 新增 `/data-staging` 人工 staging 工作台，可輸出 raw / draft JSON 與 SQL 草稿。

### Changed

- Navbar 新增「審核」入口。
- `PROJECT_CONTEXT.md`、`TECH_ARCHITECTURE.md`、`PRODUCT_DECISIONS.md`、`SUPABASE_IMPORT_GUIDE.md`、`SOURCE_REGISTRY.md`、`V0_6_PLAN.md` 同步 v0.7-A 資料管線邊界與 Email 提醒待對齊事項。

### Notes

- staging table 不開放一般使用者讀取。
- `/opportunities` 仍只讀取 `competitions(status = published)`。
- 本版不接 Gemini、不接 n8n、不啟用自動排程、不寄 Email、不處理學生個資。

## v0.6-A - 2026-06-26

### Added

- 新增 `docs/SUPABASE_REMINDERS_SCHEMA.sql`，建立 `reminder_settings` table 與 RLS policy。
- 新增 `docs/V0_6_PLAN.md`。
- 新增 `src/lib/reminders.ts`，集中管理提醒設定讀取與儲存。
- 新增 `src/components/ReminderControl.tsx`，在詳情頁提供提醒 opt-in UI。

### Changed

- `/opportunities/[id]` 新增提醒設定區塊。
- `PROJECT_CONTEXT.md`、`TECH_ARCHITECTURE.md`、`PRODUCT_DECISIONS.md`、`SUPABASE_IMPORT_GUIDE.md`、`V0_5_PLAN.md` 同步 v0.6-A 邊界與測試流程。

### Notes

- 本版只儲存提醒設定，不寄 Email。
- 本版不接 Email API、不接 n8n、不接 Gemini、不做 AI 生成提醒內容。

## v0.5-D - 2026-06-26

### Added

- 新增 `docs/SUPABASE_PREFERENCES_SCHEMA.sql`，建立 `user_preferences` table 與 RLS policy。
- 新增 `src/lib/preferenceSync.ts`，集中管理完整偏好的雲端讀取、建立與儲存。

### Changed

- `/preferences` 登入後會讀取雲端偏好；若雲端尚無偏好，會用本機偏好建立雲端偏好。
- `/preferences` 儲存時會同步 localStorage、`user_preferences` 與 `profiles` 基本資格。
- `PROJECT_CONTEXT.md`、`TECH_ARCHITECTURE.md`、`PRODUCT_DECISIONS.md`、`SUPABASE_IMPORT_GUIDE.md`、`V0_5_PLAN.md` 同步 v0.5-D 邊界與測試流程。

### Notes

- 未登入使用者仍使用 localStorage。
- 本版不做提醒、不做 Email、不做 n8n、不做 Gemini、不做 AI 個人化推薦。

## v0.5-D-prep - 2026-06-26

### Added

- 新增 `src/lib/profileSync.ts`，集中處理雲端 profile 與本機偏好的基本資格合併。

### Changed

- `/preferences` 登入後會讀取雲端 profile，並帶入「我的資格」。
- `/preferences` 儲存時，完整偏好仍保存到 localStorage，基本資格同步到 Supabase `profiles`。
- `/account` 讀取或儲存 profile 時，會同步更新本機偏好中的 profile。
- `PROJECT_CONTEXT.md`、`TECH_ARCHITECTURE.md`、`PRODUCT_DECISIONS.md`、`SUPABASE_IMPORT_GUIDE.md`、`V0_5_PLAN.md` 同步 v0.5-C 實機驗證與 v0.5-D 前置邊界。

### Notes

- 本版不建立 preferences table。
- interests、skills、偏好類型、主題領域、截止時間、獎勵形式、交件形式與 highlightTags 仍只存在 localStorage。
- 本版不做提醒、不做 Email、不做 n8n、不做 Gemini、不做 AI 個人化推薦。

## v0.5-C - 2026-06-26

### Notes

- 依 Google Doc 主控台，v0.5-C 是 Auth、profiles、saved_competitions 與 RLS 的實機驗證階段。
- 此階段需要使用者在 Supabase console 設定 Google provider 並執行 schema。
- repo 端已補上 v0.5-C 驗證流程文件；實機驗證尚待使用者操作。

## v0.5-B - 2026-06-26

### Added

- 新增 `docs/SUPABASE_SAVED_SCHEMA.sql`，建立 `saved_competitions` table 與 RLS policy。
- 新增 `src/lib/savedOpportunities.ts`，集中管理雲端收藏讀取、合併、寫入與刪除。

### Changed

- 收藏按鈕在登入後會同步寫入或刪除 Supabase `saved_competitions`。
- `/saved` 登入後會合併本機收藏與雲端收藏。
- `localStorage` 工具新增批次設定收藏 id 的 helper。
- `PROJECT_CONTEXT.md`、`TECH_ARCHITECTURE.md`、`PRODUCT_DECISIONS.md`、`SUPABASE_IMPORT_GUIDE.md`、`V0_5_PLAN.md` 同步 v0.5-B 邊界與測試流程。

### Notes

- 未登入使用者仍使用 localStorage 收藏。
- 雲端同步失敗時，先保留本機收藏。
- 本版不做提醒、不做 Email、不做 n8n、不做 Gemini、不做 AI 個人化推薦。

## v0.5-A - 2026-06-26

### Added

- 新增 Google Login 入口與帳號狀態元件。
- 新增 `/account` 帳號頁，可登入、登出、讀取與儲存 profile。
- 新增 `/auth/callback` OAuth 回跳頁。
- 新增 `docs/SUPABASE_AUTH_SCHEMA.sql`，建立 `profiles` table 與 RLS policy。
- 新增 `docs/V0_5_PLAN.md`。

### Changed

- Navbar 新增「登入／帳號」入口。
- `PROJECT_CONTEXT.md`、`TECH_ARCHITECTURE.md`、`PRODUCT_DECISIONS.md`、`SUPABASE_IMPORT_GUIDE.md` 同步 v0.5-A 邊界與測試流程。

### Notes

- v0.5-A 只做 Google Login + profiles。
- 本版不做雲端收藏、不做 `saved_competitions`、不做提醒、不做 Email、不做 n8n、不做 Gemini。
- 未登入使用者仍可瀏覽機會列表與詳情頁。

## v0.4-C - 2026-06-26

### Added

- 新增 `docs/SUPABASE_PUBLIC_SAMPLE.sql`，提供 3 筆真實官方公開來源 sample。
- sample 補齊 `source_url`、`source_name`、`source_item_key`、`series_key`、`instance_key` 等來源追蹤欄位。
- `/data-entry` 匯入工作台新增「來源與去重」欄位，SQL 輸出會帶入 v0.4-B schema 欄位。

### Changed

- `docs/V0_4_PLAN.md` 更新 v0.4-C 範圍與下一步候選。
- `docs/SUPABASE_IMPORT_GUIDE.md` 補上真實公開來源 sample 的執行順序與測試注意事項。
- `docs/SOURCE_REGISTRY.md` 補上 v0.4-C public sample 清單。
- 推薦標籤新增「已截止」，避免已過截止日的真實公告被誤標為「時間偏緊」。
- 機會列表預設隱藏已截止資料，並提供「顯示已截止」切換，方便檢查歷史公告或真實來源 sample。

### Notes

- 本版仍不做登入、不做 profiles、不做雲端收藏、不做提醒、不做 Email、不做 n8n 排程、不做 Gemini。
- 真實來源 sample 只用於驗證資料鏈路，正式匯入前仍需人工確認公告內容與附件。
- 2026-06-26 實機驗證：前端已可讀到 Supabase 真實來源 sample；目前使用者畫面確認至少顯示 2 筆。
- 已截止資料仍可透過列表切換顯示，不會從資料源刪除。

## v0.4-B - 2026-06-26

### Added

- 新增 `docs/SOURCE_REGISTRY.md`，整理公開公告來源清單、來源狀態與去重規則。
- `docs/SUPABASE_SCHEMA.sql` 補上來源追蹤與去重欄位。
- `docs/SUPABASE_SEED.sql` 補上 demo seed 的來源欄位。

### Changed

- `docs/V0_4_PLAN.md` 更新 v0.4-B 完成狀態與下一步候選。
- `docs/SUPABASE_IMPORT_GUIDE.md` 補上來源與去重欄位說明。
- `PROJECT_CONTEXT.md`、`TECH_ARCHITECTURE.md`、`PRODUCT_DECISIONS.md` 同步補上 v0.4-B 決策。

### Notes

- 本版不做登入、不做自動化排程、不直接讓爬蟲寫入 published competitions。

## v0.4-A - 2026-06-26

### Added

- 新增 `/data-entry` 資料匯入工作台。
- 工作台可整理 `competitions` 草稿，並輸出 JSON 與 SQL insert 草稿。
- 工作台草稿暫存在 localStorage。
- 新增 `docs/V0_4_PLAN.md`。

### Changed

- Navbar 新增「匯入」入口。
- `docs/SUPABASE_IMPORT_GUIDE.md` 補上 v0.4-A 人工資料整理流程。
- `PROJECT_CONTEXT.md`、`TECH_ARCHITECTURE.md`、`PRODUCT_DECISIONS.md` 同步補上 v0.4-A 決策。

### Notes

- 本版不做登入、不做權限管理、不直接寫入 Supabase、不做爬蟲、不做 AI 分類。

## v0.3-C - 2026-06-25

### Added

- 新增 `docs/SUPABASE_SEED.sql`，提供 9 筆可重跑的 Supabase demo seed。
- seed 覆蓋第一版四種機會類型：比賽、獎學金、補助／計畫、其他。

### Changed

- `docs/V0_3_PLAN.md` 更新 v0.3-C 完成狀態與下一步候選。
- `docs/SUPABASE_IMPORT_GUIDE.md` 補上 seed 執行順序、覆蓋範圍與空列表排查。

### Notes

- 本版只補資料測試基礎，不做登入、不做個人資料表、不做雲端收藏、不做提醒。

## v0.3-B - 2026-06-25

### Added

- 新增 `docs/V0_3_PLAN.md`，整理 v0.3-A / v0.3-B 範圍與不做事項。
- 新增 `docs/SUPABASE_IMPORT_GUIDE.md`，說明 Supabase 手動匯入與空列表排查流程。
- `docs/SUPABASE_SCHEMA.sql` 補齊 `skill_tags`、`first_stage_deliverables`、`participation_text`、`schedule`、`judging_text`。

### Changed

- Supabase 讀取層改用 `@supabase/supabase-js` client。
- Supabase 資料映射補上能力標籤、第一階段交件、參賽方式、時程與評分方向，讓詳情頁資訊更接近 mock demo。
- `PROJECT_CONTEXT.md` 與 `TECH_ARCHITECTURE.md` 補上 v0.3 的目前狀態。

### Notes

- 本版仍不做登入、不做個人資料表、不做雲端收藏、不做提醒。

## v0.3-A - 2026-06-25

### Added

- 新增 Supabase 公開資料讀取層，列表與詳情頁可從 `competitions` 取得 `published` 機會資料。
- 新增 mock fallback：未設定環境變數、設定 `NEXT_PUBLIC_USE_MOCK_DATA=true` 或讀取失敗時，會使用既有 mock data。
- 新增 `.env.local.example`，集中列出 v0.3-A 需要的環境變數。
- 新增 `docs/SUPABASE_SCHEMA.sql`，包含 `competitions` schema、公開讀取 policy 與 seed 範例。

### Changed

- `/opportunities` 改由 server side 先取得機會資料，再交給現有前端推薦與 filter。
- `/opportunities/[id]` 改由資料讀取層取得單筆機會，並保留 mock id fallback。
- `/saved` 改用同一份機會資料來源，避免 Supabase id 收藏後在收藏頁找不到。
- `TECH_ARCHITECTURE.md` 補上 v0.3-A 的資料流與不做事項。
- 機會列表 0 筆結果時改顯示可操作空狀態，提供「放寬篩選」、「重設偏好」與「調整偏好」。
- 機會類型全未選取時改視為不限制類型，避免使用者誤觸後整頁沒有資料。

### Notes

- 本版不做登入、不做個人資料表、不做雲端收藏、不做提醒。
- 使用者偏好、收藏、推薦排序仍維持 localStorage 與前端規則式推薦。
- 使用者端仍不得顯示 `internalScore`、推薦分數、加權數字、加幾分或排名數字。

## v0.2.0 - 2026-06-25

### Added

- 新增 `docs/V0_2_PLAN.md`，整理 v0.2 範圍、不做事項與待確認項目。
- 偏好設定頁新增第一版核心 filter：主題領域、截止時間、獎勵形式、最高獎金。
- mock data 新增 `topicAreas`、`rewardTypes`、`maxPrizeAmount`。
- 推薦列表會先套用完整 filter，再進行規則式排序。
- 列表上方會顯示目前套用的主要 filter 摘要。

### Notes

- v0.2 仍維持前端 mock demo，不接後端、不登入、不接 Supabase、n8n、Gemini、Email 或 Discord Bot。

## v0.1.1 - 2026-06-24

### Fixed

- 修正偏好設定頁 chip 選取後對比不足的問題。
- 選取狀態改用固定深色背景 `#2F5A52` 與淺色文字 `#FCFAF6`，避免色彩變數或樣式產生後文字看不清楚。
- 修正卡片資訊區域的截止與獎助值，改成有資訊意義的柔和色塊。
- 截止與獎金色塊改為依剩餘天數與金額級距動態呈現。
- 卡片欄位「獎助」改為「獎金」。
- 重新設計「與你的設定相符」展開區，只保留「資格符合」與「偏好交集」短資訊，避免呈現演算法式長句。
- 同步主控台決策文件：補齊 `PRODUCT_DECISIONS.md`、`TECH_ARCHITECTURE.md`、`DO_NOT_DO.md`。
- 對外展示名稱暫改為「北大機會雷達」，內部代號仍保留 `bonus-hunter`。
- 卡片移除右上角重複資格狀態，推薦標籤只保留一個。
- 修正卡片操作權重：列表卡片以站內「查看詳情」為主，「查看官方簡章」降為清楚可見的次要連結；詳情頁底部仍以官方簡章作為最終確認 CTA。
- 詳情頁「與你的設定相符」改用 `preferenceMatches`，避免回到演算法式長句。

### Notes

- 本次只調整 UI 呈現，沒有改產品範圍、filter 欄位、推薦演算法或 mock data。
- 追蹤問題另見 `docs/issues.md`。
- `FILTER_SPEC.md` 已補入主控台文件中的 6 個第一版核心 filter；目前只有部分已在 v0.1 demo 落地，其餘列為 v0.2 待辦。

## v0.1.0 - 2026-06-24

### Added

- 建立獎金獵人 v0.1 前端 mock demo。
- 新增首頁、機會列表、偏好設定、收藏頁與機會詳情頁。
- 新增 mock opportunities、使用者偏好 localStorage、收藏 localStorage 與前端規則式推薦。
- 新增規格文件：`PROJECT_CONTEXT.md`、`FILTER_SPEC.md`、`UI_RULES.md`。

### Changed

- 套用低彩度暖色系暫時色票。
- 調整卡片資訊層級、詳情頁區塊順序與官方簡章 CTA。

### Known Issues

- 在目前 Codex 沙盒中，`npm run dev` 與 `npm run lint` 會被本機權限限制擋住：`EPERM: operation not permitted, lstat 'C:\Users\xin'`。
- 已用 TypeScript compiler API 替代檢查，當時結果為 0 個型別錯誤。
