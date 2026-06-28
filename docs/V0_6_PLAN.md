# V0_6_PLAN

## 目標

v0.6 的目標是建立提醒功能，但採低風險分段：

1. v0.6-A 只建立提醒設定資料模型與 opt-in UI。
2. v0.6-B 才接 Email MVP。

## v0.6-A：本次推進

- 新增 `reminder_settings` table 與 RLS policy。
- 詳情頁新增提醒設定區塊。
- 登入後可開關提醒。
- 登入後可自訂提醒提前天數，預設以較早提醒為主，例如截止前 30 天、14 天。
- 登入後可自訂偏好的寄送時間。
- 登入後可設定 notification email。
- schema 保留 email 驗證欄位，供 v0.6-B 測試信使用。
- 未登入使用者只看到登入後可設定提醒的提示。

## v0.6-A 不做

- 不寄 Email。
- 不接 Email API。
- 不接 n8n。
- 不接 Gemini。
- 不做 AI 生成提醒內容。
- 不做高頻通知。
- 不做 Discord Bot。

## Supabase 設定

執行：

```text
docs/SUPABASE_REMINDERS_SCHEMA.sql
```

## 驗收

1. 已登入使用者可在 `/opportunities/[id]` 看到提醒設定。
2. 可開啟或關閉提醒。
3. 可自訂提醒天數與寄送時間。
4. 可填寫 notification email。
5. 儲存後 Supabase `reminder_settings` 出現對應資料。
6. 重新整理詳情頁後，提醒設定可讀回。
7. 未登入使用者不會被強迫填 Email。
8. 使用者只能讀寫自己的提醒設定。

## v0.6-B 候選

- Email 服務方向先以 Gmail 評估。
- 建立 `notification_logs`。
- 避免重複寄送。
- 只寄給已 opt-in 使用者。
- 提供關閉提醒方式。
- 不做廣告信、不做高頻推播、不把 Email 當唯一入口。

## v0.6-B：Gmail API 測試信

- 新增 Gmail API server route，用來寄送提醒測試信。
- 新增 `notification_logs` schema，記錄測試信與未來正式提醒寄送結果。
- 提醒設定頁可先儲存設定，再寄送測試信。
- 測試信寄送成功後，`reminder_settings.email_verified` 會標記為 true。
- 本階段只測試 Gmail API 與 Email 可達性，不啟用正式截止提醒排程。
- Gmail API 需要 server-side env，不可把 client secret 或 refresh token 放到瀏覽器。

## v0.6-B 開始前需對齊

1. Email provider：先採 Gmail API 測試信路線。
2. 產品語氣：提醒是讓學生早點知道機會，不是催促交件。
3. 寄送頻率：不固定為截止前 7 / 3 / 1 天，讓使用者自訂提前天數；預設應比交件前幾天更早。
4. 寄送時間：保留給使用者自訂。
5. 關閉方式：使用者可在提醒設定中關閉提醒。
6. 寄送紀錄：建立 `notification_logs` 防止同一機會同一提醒日重複寄送；不要用 reminder setting 本身的 true/false 取代寄送紀錄。
7. Email 驗證：使用者設定 Email 時先寄測試信，測試通過後標記 email verified，以降低正式提醒失敗率。
8. 失敗處理：正式提醒失敗是否重試仍待確認。
9. 隱私邊界：Email 只用於已 opt-in 的提醒，不用於廣告或 AI 分析。
