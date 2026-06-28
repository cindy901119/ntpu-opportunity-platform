# V0_3_PLAN

## 目標

v0.3 的目標是把 demo 從純 mock data 推進到可讀取 Supabase 公開資料，但仍不做登入、不寫入學生資料、不做提醒。

## v0.3-A：已完成

- `/opportunities`、`/opportunities/[id]`、`/saved` 可讀取 Supabase `competitions` 的 `published` 資料。
- 環境變數未設定、設定 `NEXT_PUBLIC_USE_MOCK_DATA=true` 或讀取失敗時回到 mock data。
- 使用者偏好、收藏、推薦排序仍維持 localStorage 與前端規則式推薦。

## v0.3-B：本次推進

- 將 Supabase 讀取層改用正式 Supabase client。
- 補齊 `competitions` schema 中前端詳情頁會用到的欄位：
  - `skill_tags`
  - `first_stage_deliverables`
  - `participation_text`
  - `schedule`
  - `judging_text`
- 補上資料匯入與測試流程文件，降低空列表與欄位缺漏造成的誤判。

## v0.3-C：本次推進

- 新增獨立 demo seed SQL。
- Supabase demo seed 擴充到 9 筆 published opportunities。
- seed 覆蓋第一版四種機會類型：
  - 比賽
  - 獎學金
  - 補助／計畫
  - 其他
- seed 可重跑，會先移除 `example.com` demo 資料，再建立穩定 UUID 的 demo 資料。

## v0.3 不做

- 不做登入。
- 不做個人 profile 資料表。
- 不做雲端收藏。
- 不做提醒。
- 不做 n8n 自動化。
- 不做 Gemini 分類。
- 不做 Email 或 Discord Bot。

## 下一步候選

1. v0.4-A：建立手動匯入表單或後台資料整理流程。
2. v0.4-B：開始規劃公開公告來源清單與去重欄位。
3. v0.4-C：逐步替換 demo source URL 為真實官方簡章。
