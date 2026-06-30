# Google 登入與提醒設定

本文件整理 Google 登入、Gmail 測試信與截止提醒排程的設定步驟。一般使用者未登入仍可瀏覽機會；登入只用於同步 profile、收藏與提醒設定。

## 1. Supabase Auth: Google provider

1. 到 Supabase Dashboard → Authentication → Providers → Google。
2. 啟用 Google provider，填入 Google Cloud OAuth client 的 Client ID 與 Client Secret。
3. Google Cloud OAuth Authorized redirect URI 使用 Supabase 提供的 callback：
   - `https://<你的 Supabase project ref>.supabase.co/auth/v1/callback`
4. Supabase Authentication → URL Configuration：
   - Site URL：正式站台，例如 `https://ntpu-opportunity-platform.vercel.app`
   - Redirect URLs 加入：
     - `https://ntpu-opportunity-platform.vercel.app/auth/callback`
     - 本機測試可再加 `http://localhost:3000/auth/callback`
5. 如果 Google OAuth consent screen 維持 Testing，只有測試使用者可以登入。要讓一般 Google 帳號可登入，需要在 Google Cloud 將 app 發布到 Production。

## 2. Supabase SQL

依序執行：

1. `docs/SUPABASE_AUTH_SCHEMA.sql`
2. `docs/SUPABASE_SCHEMA.sql`
3. `docs/SUPABASE_SAVED_SCHEMA.sql`
4. `docs/SUPABASE_PREFERENCES_SCHEMA.sql`
5. `docs/SUPABASE_REMINDERS_SCHEMA.sql`

`docs/SUPABASE_REMINDERS_SCHEMA.sql` 會建立：

- `reminder_settings`：使用者對單一機會的提醒設定。
- `notification_logs`：測試信與正式提醒寄送紀錄，用於避免重複寄送與追蹤失敗。

## 3. Vercel Environment Variables

前端與公開資料：

```text
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

只放在 server-side，不要暴露到前端：

```text
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REFRESH_TOKEN=
GMAIL_SENDER_EMAIL=
```

注意：

- `SUPABASE_SERVICE_ROLE_KEY` 只供 `/api/reminders/send-due` 的 server route 使用，用來查詢所有已開啟且已驗證 Email 的提醒設定。
- `CRON_SECRET` 用來保護排程寄送 API。沒有這個 secret 時，排程 API 會拒絕執行。
- Gmail refresh token 需要使用具備 Gmail send scope 的 Google OAuth 流程取得。

## 4. 提醒寄送流程

1. 使用者登入 Google。
2. 使用者到機會詳情頁開啟提醒，填提醒 Email、提前天數與寄送時間。
3. 使用者按「寄送測試信」。
4. 測試信成功後，系統把 `email_verified` 標記為 `true`。
5. 排程呼叫 `/api/reminders/send-due`。
6. API 檢查今天是否符合使用者設定的提前天數與寄送時間。
7. 寄出後寫入 `notification_logs`，同一個 user、opportunity、lead_days 已成功寄出時不再重複寄。

## 5. 手動測試排程

可用瀏覽器或 n8n 呼叫：

```text
https://ntpu-opportunity-platform.vercel.app/api/reminders/send-due?secret=<CRON_SECRET>&ignoreTime=1
```

`ignoreTime=1` 只建議測試使用，會略過使用者設定的寄送小時。

正式排程可由 Vercel Cron 或 n8n 呼叫：

```text
GET /api/reminders/send-due
Authorization: Bearer <CRON_SECRET>
```

Vercel Hobby 方案只支援每日 cron。`vercel.json` 目前設定為每日 UTC 01:00，也就是台灣時間 09:00 檢查一次。若要完整支援使用者自訂寄送時間，後續可改由 n8n 或升級 Vercel 方案後提高排程頻率。

## 6. 目前邊界

- 提醒內容使用固定模板，不做 AI 生成。
- 只提醒已登入、已開啟提醒、Email 測試通過的使用者。
- 提醒是提早知道資訊，不是催交作業；預設提前天數為 30 / 14 天。
- 沒有官方簡章 URL 的資料，Email 會改提供北大公告來源作為追蹤線索，不會把北大公告偽裝成官方簡章。
