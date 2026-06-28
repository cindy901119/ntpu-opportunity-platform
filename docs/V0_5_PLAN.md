# V0_5_PLAN

## 目標

v0.5 的目標是開始加入登入與雲端個人資料，但仍維持未登入可瀏覽機會的流程。

v0.5-A 只做 Google Login + profiles，不做雲端收藏、不做提醒、不做 Email、不做 n8n、不做 Gemini。

v0.5-B 只做 `saved_competitions` 雲端收藏同步，不做提醒、不做 Email、不做 n8n、不做 Gemini。

v0.5-C 是實機驗證收尾：確認 v0.5-A / v0.5-B 的 Auth、profiles、saved_competitions 與 RLS 能在 Supabase 實際運作。

v0.5-D 做登入後完整偏好雲端同步與 localStorage 合併策略。

## v0.5-A：本次推進

- 新增 Google 登入入口。
- 新增 `/account` 帳號頁。
- 新增 `/auth/callback` 登入回跳頁。
- 新增 `docs/SUPABASE_AUTH_SCHEMA.sql`，建立 `profiles` table 與 RLS policy。
- profile 欄位只保存基本資格：
  - 學校
  - 主修系所
  - 年級
  - 雙主修
  - 輔系
- 未登入使用者仍可瀏覽 `/opportunities`。
- localStorage 偏好與收藏仍保留在本機，不在 v0.5-A 同步到雲端。

## v0.5-A 不做

- 不做 `saved_competitions`。
- 不做雲端收藏同步。
- 不做 reminders。
- 不做 Email。
- 不做 n8n。
- 不做 Gemini。
- 不做 AI 個人化推薦。
- 不把學生個資送到 n8n、Gemini 或其他 AI。

## v0.5-B：本次推進

- 新增 `saved_competitions` table 與 RLS policy。
- 未登入時，收藏仍存在 localStorage。
- 已登入時，收藏會同步到 Supabase `saved_competitions`。
- `/saved` 會在登入後合併本機收藏與雲端收藏。
- 機會卡片收藏按鈕會在登入後讀取雲端狀態。
- 雲端同步失敗時，先保留本機收藏，不阻斷瀏覽流程。

## v0.5-B 不做

- 不做提醒。
- 不做 Email。
- 不做 n8n。
- 不做 Gemini。
- 不做 AI 個人化推薦。
- 不把收藏資料送到 n8n、Gemini 或其他 AI。

## v0.5-C：實機驗證待辦

- 在 Supabase 執行 `docs/SUPABASE_AUTH_SCHEMA.sql`。
- 在 Supabase 執行 `docs/SUPABASE_SAVED_SCHEMA.sql`。
- 設定 Google provider、redirect URL 與 site URL。
- 實測登入、登出、profile upsert。
- 實測雲端收藏同步與重新整理後收藏狀態。
- 檢查不同帳號只能讀寫自己的 profile 與 saved_competitions。
- 未登入流程仍可使用 localStorage。

## v0.5-D：本次推進

- 新增 `user_preferences` table 與 RLS policy。
- `/preferences` 會在登入後讀取雲端 `user_preferences`，並合併到本機偏好。
- 如果登入後還沒有雲端偏好，會用本機偏好建立一份雲端偏好。
- `/preferences` 儲存時，會把完整偏好保存到 localStorage，並同步到 `user_preferences`。
- `/preferences` 儲存時，也會把基本資格同步到 `profiles`。
- `/account` 讀取雲端 profile 後，會同步回本機偏好中的「我的資格」。
- `/account` 儲存 profile 後，也會同步回本機偏好。
- 畫面會提示目前是本機偏好、雲端基本資格，或同步失敗狀態。

## v0.5-D 不做

- 不做衝突解決 UI。
- 不做提醒。
- 不做 Email。
- 不做 n8n。
- 不做 Gemini。
- 不做 AI 個人化推薦。

## Supabase 設定

1. 在 Supabase Auth 啟用 Google provider。
2. 將本機開發網址加入 Auth redirect URLs：

```text
http://localhost:3000/auth/callback
```

3. 在 Supabase SQL editor 執行：

```text
docs/SUPABASE_AUTH_SCHEMA.sql
```

4. 若要測試 v0.5-B 雲端收藏，接著執行：

```text
docs/SUPABASE_SAVED_SCHEMA.sql
```

5. 確認 `.env.local` 有：

```env
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_SUPABASE_URL=你的 Supabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的 anon key
```

6. 若要測試 v0.5-D 雲端偏好，接著執行：

```text
docs/SUPABASE_PREFERENCES_SCHEMA.sql
```

7. 若要測試 v0.6-A 提醒設定，接著執行：

```text
docs/SUPABASE_REMINDERS_SCHEMA.sql
```

## 驗收

1. `/account` 未登入時顯示 Google 登入。
2. Google 登入後回到 `/auth/callback`，再進 `/account`。
3. `/account` 可看到登入 Email。
4. 可儲存 profile。
5. Supabase `profiles` 會出現對應 user id 的資料。
6. 未登入仍可開 `/opportunities`。
7. 登入後收藏機會，Supabase `saved_competitions` 會出現對應資料。
8. 重新整理 `/saved` 後，雲端收藏仍會顯示。
9. 未登入時收藏仍可存在 localStorage。
10. v0.5-C：登入、登出、profile upsert、雲端收藏與 RLS 實機驗證通過。
11. v0.5-D：登入後開啟 `/preferences`，雲端偏好會帶入畫面。
12. v0.5-D：在 `/preferences` 修改偏好並儲存，Supabase `user_preferences` 會更新。
13. v0.5-D：修改資格並儲存，Supabase `profiles` 也會更新。
14. v0.6-A：詳情頁可設定提醒 opt-in、提醒天數與通知 Email。

## 下一步候選

1. v0.5-C：由使用者完成 Supabase 實機驗證。
2. v0.6-B：Email 提醒 MVP。
3. v0.7-A：raw_announcements 與 draft_competitions staging。

## v0.6-A：提醒設定資料模型與 opt-in UI

- 新增 `reminder_settings` table 與 RLS policy。
- 詳情頁新增提醒設定區。
- 登入後可以開關截止提醒。
- 登入後可以選擇提醒時間：截止前 7 天、3 天、1 天。
- 登入後可以設定 notification email。
- 本版只儲存提醒設定，不寄 Email。

## v0.6-A 不做

- 不寄 Email。
- 不接 Email API。
- 不接 n8n。
- 不接 Gemini。
- 不做 AI 生成提醒內容。
- 不做高頻通知。
