# CHANGELOG

## v0.11-A - 2026-07-01

### Added

- 導入 Color System v1：奶油紙底、墨青綠主行動、琥珀獎金、陶土提醒、灰藍資訊。
- 新增日／夜模式切換，設定保存在瀏覽器 localStorage。
- 補上狀態 tag 專用 token，讓推薦、獎金、截止、需確認等狀態不只依靠色相辨識，維持色盲友善與文字優先。

## v0.10-C - 2026-07-01

### Fixed

- 移除一般比賽 `special_notes` 中誤放到前台的內部資料清理紀錄，避免詳情頁出現「原 title 已清理」「topic_areas 錯誤」這類工作備註。
- 新增 `scripts/crawler/output/fix-special-notes.review.sql`，可修正已匯入 Supabase 的特別注意內容。
- 修正提醒測試信流程：寄送測試信不再被「提醒設定儲存失敗」擋住，Gmail API 成功與資料庫紀錄失敗會分開顯示。
- 測試信 API 會回傳較明確的錯誤狀態，例如 Gmail 環境變數未設定、refresh token 授權失敗或 Gmail API 拒絕寄送。
- 補上 `notification_logs` 的 authenticated insert RLS policy，避免測試信已寄出但寄送紀錄無法寫入。
- 提醒 Email 改為固定使用登入帳號信箱，前台不再允許任意輸入收件地址，避免被濫用成寄信工具。
- 調整推薦資格判斷：獎學金若資格推論不完整，不再被前端硬排除，改以「需要再確認」保留在列表中。

### Added

- 新增 `scripts/crawler/output/check-scholarships.review.sql`，用來確認獎學金資料是否已匯入、目前狀態是否為 `published`，以及是否多數已截止而被前台預設隱藏。
- 新增 `docs/SUPABASE_REMINDERS_RLS_FIX.sql`，可單獨修復 reminder / notification logs 的 RLS policy。
- 新增 `docs/SUPABASE_SAVED_COMPETITIONS_FIX.sql`，可修復雲端收藏同步需要的資料表與 RLS policy。
- 新增 `docs/SCHOLARSHIP_IMPORT_CHECKLIST.md`，整理獎學金匯入與檢查順序。

## v0.10-B - 2026-06-30

### Fixed

- Navbar 接回 `AuthStatus`，前台會顯示「登入／帳號」入口。
- `/auth/callback` 若回跳時已經有 session 但沒有 `code`，會直接回到 `/account`，避免卡在登入確認頁。
- 新增 `docs/SUPABASE_PROFILE_FIX.sql`，用於修補 Google 登入後讀寫 `profiles` 失敗的 schema / RLS / grant 設定。
- `/account` 會顯示 Supabase profile 讀寫失敗的實際錯誤訊息，方便定位設定問題。

## v0.10-A - 2026-06-30

### Planned / In Progress

- 版本目標：把北大校內獎學金資料整理成可審核、可匯入 `public.competitions` 的資料列。
- 進度：已使用校內獎學金 crawler 的 10 筆 raw announcements 作為整理來源。
- 進度：已將北大系所／學院獎學金來源連結整理成 `scripts/crawler/scholarship-sources.json`，供後續逐頁解析與人工審核。
- 進度：新增獎學金專用 SQL 匯出腳本，輸出 `scripts/crawler/output/scholarship-opportunities.review.sql`。
- 進度：新增系所／學院獎學金 SQL 匯出腳本，輸出 `scripts/crawler/output/department-scholarship-opportunities.review.sql`。

### Notes

- 本階段只處理「獎學金」資料匯入準備，不新增登入、提醒或新機會類型。
- 獎學金 rows 會使用 `opportunity_type = '獎學金'`；`reward_types` 維持金錢型的 `獎金`，避免和機會類型重複。
- `prize_text` 只放列表用短文字，例如「最高 50,000 元」；名額、分組與其他獎項細節放入 `special_notes` 或詳情內容。
- 另新增 `scripts/crawler/output/fix-prize-text.review.sql`，可修正已匯入 Supabase 的一般比賽與獎學金獎金欄位。
- 校內獎學金詳情頁本身作為官方頁面，`official_url` 暫填北大校內獎學金官方詳情頁。
- 多數目前抓到的獎學金已截止，匯入後會依現有前台規則預設隱藏，使用者切換「顯示已截止」才會看到。
- 系所／學院獎學金本批整理 9 筆，其中 2 筆可作為 `published` 已截止資料，其餘先保留 `needs_review`。

## v0.9-C - 2026-06-30

### Fixed

- 修正資格年級判斷：資料庫 `grade_limit` 若是「大專校院學生」「研究生」「在校學生」等描述，會依使用者年級推導為大學部／碩士班後比對，不再要求完全等於「大四」或「碩一」。
- 修正北大金融大四未選其他偏好時，因描述型 `grade_limit` 被錯判不符而只剩少數推薦結果的問題。

### Verified

- 以 production published competitions 驗算：北大金融大四不會被資格錯殺；10 筆 published 中 8 筆為資格符合、2 筆為需確認。

## Deploy fix - 2026-06-30

### Fixed

- Vercel Hobby 方案不支援每小時 Cron，原本 `0 * * * *` 會讓 production deploy 失敗。
- `vercel.json` 改為每日 UTC 01:00（台灣時間 09:00）檢查提醒，避免阻擋 production 部署。
- `docs/GOOGLE_LOGIN_AND_REMINDERS_SETUP.md` 補充：若要完整支援使用者自訂寄送時間，需由 n8n 或升級 Vercel Cron 頻率處理。

## C0 scholarship crawler - 2026-06-30

### Added

- 新增 `scripts/crawler/crawl-scholarships.mjs`，專門解析北大校內獎學金頁 `class_id=4`。
- `package.json` 新增 `npm run crawl:scholarships`。
- crawler console 新增「抓校內獎學金」按鈕，可從本機控制台觸發專用 crawler。

### Verified

- `npm run crawl:scholarships -- --max-items=30` 成功抓到 10 筆校內獎學金 raw announcements。
- `npm run crawl:export-raw-sql` 成功產出 10 筆 `raw_announcements` upsert SQL 草稿。
- 本輪 output 不包含「獲獎人學號」標籤，也未檢出疑似 9 碼學號。

### Notes

- 獎學金詳情頁可能包含獲獎學生學號；crawler 會在寫入 raw text 前移除該列。
- 本次沒有寫入 Supabase，沒有呼叫 Gemini，沒有寫入 `competitions(status = published)`，也沒有改主 WebApp 前端流程。

## v0.9-B - 2026-06-30

### Changed

- 詳情頁官方資料區不再顯示裸網址；有 `official_url` 時優先顯示「查看官方簡章」，沒有時才顯示「查看北大公告」。
- 篩選規則明確為同群組 OR、不同群組 AND；同一群全選視為不限制，且不再額外影響排序分數。
- 預設機會類型不再預先篩掉「其他」。
- 獎金範圍勾選「不限」時不再被當成最高 100,000 元的硬篩選。
- `/preferences` 儲存後會導回 `/opportunities`。
- 網站顯示名稱改為「北大版機會雷達」。
- `/saved` 空狀態文案改為「你還沒有收藏任何機會」，CTA 改為「去看機會」。

### Notes

- 我的偏好中的興趣、能力、交件形式與報名條件偏好仍只影響排序，不作為 hard filter。

## C0 title and official link patch - 2026-06-30

### Changed

- `scripts/crawler/export-published-sql.mjs` 新增 8 筆人工定稿覆寫：正式活動標題、主辦單位、官方活動頁、截止日、資格、獎金、交件、時程與 special notes。
- `published-opportunities.review.sql` 會保留北大公告在 `source_url`，只把真正官方活動頁／簡章頁放入 `official_url`；短網址不再作為 official URL。
- 「115學年度教育部獎助外國學生短期研習本土語言計畫」改為 `status = 'needs_review'`，不作為前台 published 競賽優先資料。
- `docs/SUPABASE_SCHEMA.sql` 允許 `competitions.status = 'needs_review'`，供人工審核或非 MVP 發布資料暫存。

### Notes

- 本次只修競賽資料與 SQL 產生器，不新增講座／工作坊、實習／職缺、打工、海外交換到第一版核心。

## v0.9-A - 2026-06-30

### Added

- 新增 `/auth/callback` Google OAuth 回跳頁，登入後會交換 session 並回到 `/account`。
- 新增 server-only Supabase admin client，用於提醒排程查詢已驗證提醒設定。
- 新增 `/api/reminders/send-due`，可由 Vercel Cron 或 n8n 呼叫，依使用者設定的提前天數與寄送時間寄出 Gmail 提醒。
- `vercel.json` 新增每小時提醒檢查 cron 設定。
- 新增 `docs/GOOGLE_LOGIN_AND_REMINDERS_SETUP.md`，整理 Google 登入、Gmail API、Supabase schema、Vercel env 與排程測試流程。

### Changed

- `/account` 文案更新為正式登入入口，並改用北大正式系所清單，不再使用「金融系」等舊示範簡稱。
- 提醒設定文案改為測試信通過後由排程寄出，並說明寄送紀錄用於避免重複提醒。
- `docs/SUPABASE_REMINDERS_SCHEMA.sql` 補上 `pgcrypto` extension，支援 `notification_logs.id` 的 UUID 預設值。
- Supabase 資料映射不再把 `source_url` fallback 成 `officialUrl`；沒有真正官方簡章 URL 時，詳情頁會顯示待補狀態。
- `.env.local.example` 補上 `SUPABASE_SERVICE_ROLE_KEY` 與 `CRON_SECRET`。

### Notes

- 正式提醒只寄給已登入、已開啟提醒、Email 測試通過的使用者。
- Gmail refresh token 與 Supabase service role key 只能放在 server-side env，不能暴露到瀏覽器。

## C0 crawler import - 2026-06-29

### Added

- 新增 `scripts/crawler/export-published-sql.mjs`，可從 `scripts/crawler/output/sample-announcements.json` 產生 `published-opportunities.review.sql`。
- 新增 `npm run crawl:export-published-sql`，用於產生可人工檢查後貼到 Supabase 的 `competitions(status = 'published')` SQL 草稿。
- `docs/SUPABASE_IMPORT_GUIDE.md` 補上 crawler output 匯入流程，區分 raw staging 與替換前台 demo/sample 的 published 匯入。

### Notes

- `published-opportunities.review.sql` 會嘗試排除課程／講座／工作坊／職缺／海外交換、急難救助、一般文化推廣計畫、草案預告、評審推薦表等第一版排除項目，但仍需人工確認截止日、資格、獎金與機會類型。
- 課外組 crawler 改用北大公開 GraphQL API 分頁抓取，支援 `--max-pages`；目前 3 頁精準模式可抓 14 筆 raw announcement，轉 published SQL 後剩 7 筆 review 草稿。

## v0.8-E - 2026-06-29

### Changed

- `/opportunities` 上方 filter chips 新增「已套用條件」標題，保留深綠選取樣式。
- 列表卡片移除「查看官方簡章」，只保留站內「查看詳情」與「收藏」。
- 詳情頁底部「查看官方簡章」維持主要 CTA。
- 推薦展開文案改為「為什麼推薦你？」。
- 推薦標籤前台統一顯示為「很適合你」「可以考慮」「再確認」。
- 卡片資訊列壓縮：截止與獎金同一行，資格／交件／簡介限制為最多兩行，tag 最多三個。
- `/preferences` 我的資格說明文案調整，「其他條件」改名為「報名條件偏好」。
- 列表與收藏頁桌機版改為更寬的兩欄 layout，偏好頁維持單欄但加寬。
- 已截止切換按鈕改為「顯示已截止（0）」／「隱藏已截止」。

### Verified

- `npm run build` 通過。

## C0 crawler trial - 2026-06-29

### Added

- 新增 `scripts/crawler/crawler-ui.mjs` 獨立本機控制台，可自行操作 crawler、調整抓取數量、切換精準／寬鬆模式並產出 raw SQL 草稿。
- 新增 `scripts/crawler/sources.json`，讓 crawler 來源可以先由設定檔管理。
- 新增 `docs/C0_CRAWLER_CONSOLE_DEPLOYMENT.md`，整理發布給組員看之前的安全建議。
- 新增 `docs/C0_N8N_RAW_TO_DRAFT.md`，整理人工打開 n8n 將 raw 轉 draft 的 MVP 節點流程。
- `package.json` 新增 `npm run crawl:ui`。

### Changed

- 修正 `scripts/crawler/crawl-source.mjs` 與 `scripts/crawler/crawl-source.ts` 的北大公告列表解析：改抓真正公告內頁連結，避免誤用 `javascript:void(0)`。
- crawler 標題抽取改優先使用公告連結 `title`，再退回列表文字。
- crawler 新增 `--max-items` 與 `--match=keywords|all-news` 參數。
- crawler 改為優先讀取 `scripts/crawler/sources.json`。
- crawler console 新增來源列表與新增來源表單。
- 生活組來源收窄到獎助、急難、補助、救助相關公告，並排除停車證等非 MVP 機會。
- C0 文件同步 MVP 半自動流程：crawler 進 `raw_announcements`，人工打開 n8n 轉 draft，人工審核後才匯入 published opportunities。

### Verified

- `npm run crawl:c0` 成功抓到 7 筆 raw announcements。
- `node scripts/crawler/crawl-source.mjs --max-items=20 --match=all-news` 成功抓到 15 筆 raw announcements。
- `npm run crawl:export-raw-sql` 成功產出 15 筆 `raw_announcements` upsert SQL 草稿。

### Notes

- 本次沒有寫入 Supabase，沒有呼叫 Gemini，沒有寫入 `competitions(status = published)`，也沒有改前端或推薦流程。

## v0.8-D - 2026-06-29

### Changed

- `/preferences` 的學校選項暫時收斂為「國立臺北大學」，北聯大其他學校待正式清單整理後再擴充。
- 主修系所資料改為國立臺北大學清洗版 mapping，保留學系、進修學系、一般碩士班／研究所、學位學程與產業碩士專班。
- 主修、雙主修、輔系系所欄位改為 searchable combobox；搜尋可比對正式名稱、學院、單位類型與 aliases，顯示結果一律使用正式完整名稱。
- 資格比對支援粗略公告系所名稱對正式細分組別的前綴匹配，例如公告寫「法律學系」時可匹配「法律學系法學組」。

### Notes

- 沒有新增學院或就讀階段前台欄位。
- 沒有把學院名稱、輔系、中心、博士班、碩士在職專班、通識、體育、軍訓、暑修或跨校選課單位放入主修系所選單。

## v0.8-C - 2026-06-29

### Changed

- `/preferences` 的最高獎金拉桿刻度由 5,000 元調細為 1,000 元，讓低金額區間更容易設定。
- 「雙主修」與「輔系」改為開關式欄位；未開啟時不顯示系所下拉選單，減少「我的資格」區塊高度。

### Notes

- 沒有新增學院或就讀階段輸入欄位。
- 沒有新增第一版未確認的 filter label。

## C0.4-C0.6 prep - 2026-06-29

### Added

- 新增 `scripts/crawler/export-raw-sql.mjs`，把 crawler raw JSON 轉成 `raw_announcements` upsert SQL 草稿，並保留 `scripts/crawler/export-raw-sql.ts` 作為型別版原型。
- 新增 `scripts/crawler/crawl-source.mjs` 作為 Node 20 可直接執行的 crawler 入口。
- 新增 `scripts/crawler/output/raw-announcements.sql` sample output。
- 新增 `docs/C0_N8N_HANDOFF.md`，定義 n8n 未來角色與 handoff 格式。
- 新增 `docs/C0_GEMINI_DRAFT_CONTRACT.md`，定義 Gemini input/output 草稿契約。
- 新增 `docs/C0_REVIEW_CHECKLIST.md`，定義人工審核與發布 checklist。
- `package.json` 新增 `npm run crawl:c0` 與 `npm run crawl:export-raw-sql`，目前指向 `.mjs` 執行入口。

### Notes

- 本版只準備 C0.4-C0.6 的 repo 端接口，不串接 n8n、不呼叫 Gemini、不寫入 Supabase、不發布 competitions。
- n8n 未來只應做排程、raw ingestion、錯誤紀錄與流程編排；Gemini 只整理公開公告，不處理學生個資。

## v0.8-B - 2026-06-28

### Changed

- `/preferences` 的主修系所改用正式完整名稱，並新增暫用 `departmentCatalog` 作為 school -> department -> college mapping 的落點；學院不顯示在前台。
- 主題領域改為預設顯示常用項目，低頻項目放在「展開更多」。
- 獎勵形式改為：獎金、獎品、證書、補助、無明確獎勵、未寫清楚。
- 最高獎金改為最低／最高範圍拉桿，並提供「不限」checkbox。
- 「能力」改名為「我擅長／願意做的能力」。
- 「文件形式」調整為「交件形式」，低頻交件形式放在「展開更多」。
- 「重視條件」改為「其他條件」，移除高獎金／可累積作品集相關條件。

### Notes

- 沒有新增第一版排除範圍。
- 沒有新增學院或就讀階段輸入欄位。
- 北聯大各校系所清單目前仍是暫用資料，後續需整理正式資料後替換。

## v0.8-A - 2026-06-28

### Added

- 新增 `docs/ONLINE_DEMO_DEPLOYMENT.md`，整理線上 demo 部署、環境變數、展示順序與檢查清單。
- 新增 `docs/V0_8_PLAN.md`。
- 新增 `vercel.json`，明確標示 Vercel framework 為 Next.js。

### Notes

- 因為需要向組員展示 demo，online deployment 需求提前插隊。
- 第一輪組員展示建議使用 `NEXT_PUBLIC_USE_MOCK_DATA=true`，先確保完整流程可看。
- Online demo 是展示版本，不等同正式 Production launch。
- 第一輪前台導覽只顯示「機會／偏好／收藏」；暫時不顯示登入、匯入、審核入口。
- 首頁移除 v0.1 / mock data 技術字樣，改成面向使用者的官方簡章提醒。
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
# 2026-06-29 Gmail announcement digest

- Added `docs/C0_GMAIL_ANNOUNCEMENT_DIGEST.md`.
- School daily announcement Email is defined as an announcement discovery source, not a published-data source.
- Gmail digest flow should extract candidate official URLs, then hand them back to crawler / raw announcements / draft / human review.
- Product decision recorded: keep `劇集劇本創作獎` as `補助／計畫`; keep `天河教育基金會補助` but let frontend show it as `已截止` when its deadline is past.
- Added short-term manual URL ingestion: `scripts/crawler/manual-urls.txt` and `npm run crawl:manual-urls`.
- Manual URL crawl tested with 8 user-filtered NTPU bulletin URLs; raw SQL exported 8 rows and published review SQL exported 7 rows.
- Old `bulletin.ntpu.edu.tw` pages now infer titles from the `公告標題` field instead of the generic HTML title `電子郵件公告`.
- `opportunities` page is now forced dynamic so newly imported Supabase data appears without waiting for a static rebuild cache.
- `教育部獎助外國學生短期研習本土語言計畫` is kept as a special case even though the text mentions courses; it is marked as qualification-needs-confirmation so it should not be prioritized.
- Default preferences no longer apply narrow topic, deadline, reward, submission, prize, skill, or highlight filters on first visit; this keeps `/opportunities` browsable when real Supabase data is sparse.
- Cleaned crawler-generated summaries for old `bulletin.ntpu.edu.tw` pages so card summaries start from `公告內容` instead of email metadata such as announcement date, unit, and contact person.
- Removed the duplicated bold `北大機會雷達` title from the `/opportunities` filter header because the app name is already shown in the top navbar.
- Added `official_url` support so the detail page CTA can point to the real organizer guide/application page while `source_url` remains the NTPU discovery announcement.
- Added `docs/SUPABASE_OFFICIAL_URL_MIGRATION.sql`; the frontend falls back to legacy selects until the column is added, avoiding mock-data fallback on production.
- Refined opportunity cards: filter chips and filter button now share one row; the recommendation toggle moved below the centered detail button and sits beside save.
- Added manually reviewed organizers, short summaries, and official URLs for current manual NTPU bulletin imports; rows without a real external official page now keep `official_url = null` instead of linking the NTPU email bulletin as the guide.
- Detail pages show `官方簡章待補` when no real official URL is available, while retaining the NTPU bulletin as source traceability.
