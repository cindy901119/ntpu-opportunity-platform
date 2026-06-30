# GMAIL_API_SETUP

## 目的

v0.6-B 先用 Gmail API 測試寄送提醒 Email。這一步只做「測試信」，不啟用正式排程提醒。

## 需要的 Google Cloud 設定

1. 建立或選擇 Google Cloud project。
2. 啟用 Gmail API。
3. 設定 OAuth consent screen。
4. 建立 OAuth client。
5. 取得 refresh token，scope 需包含 Gmail send 權限。

Gmail API 寄信需要建立 MIME email，將內容轉成 base64URL 後放入 message `raw` 欄位，再呼叫 `users.messages.send`。OAuth web server flow 可用 refresh token 換 access token。

官方文件：

- https://developers.google.com/workspace/gmail/api/guides/sending
- https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/send
- https://developers.google.com/identity/protocols/oauth2/web-server

## 本機環境變數

在 `.env.local` 加上：

```env
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REFRESH_TOKEN=
GMAIL_SENDER_EMAIL=
```

`GMAIL_SENDER_EMAIL` 應該是授權 Gmail API 的寄件帳號。

## Supabase schema

依序執行：

```text
docs/SUPABASE_AUTH_SCHEMA.sql
docs/SUPABASE_REMINDERS_SCHEMA.sql
docs/SUPABASE_NOTIFICATION_LOGS_SCHEMA.sql
```

## 測試流程

1. 重啟 dev server。
2. 登入網站。
3. 打開任一 `/opportunities/[id]`。
4. 在提醒設定中填入 Email。
5. 點「寄送測試信」。
6. 收到測試信後，Supabase `reminder_settings.email_verified` 應為 `true`。
7. Supabase `notification_logs` 應出現一筆 `email_test` 紀錄。

如果前台顯示「測試信已寄出，但資料庫紀錄更新失敗」，代表 Gmail API 已可寄送，接著檢查 `reminder_settings` / `notification_logs` schema、foreign key 與 RLS。

如果前台顯示 Gmail 授權失敗，通常需要重新產生 `GMAIL_REFRESH_TOKEN`，並確認 scope 包含 `https://www.googleapis.com/auth/gmail.send`。

## 目前不做

- 不做正式截止提醒排程。
- 不做重試排程。
- 不做批次寄送。
- 不寄廣告信。
- 不把 Email 內容交給 AI 生成。
