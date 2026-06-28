# PROJECT_CONTEXT

## 產品

- 內部代號：bonus-hunter
- 暫定對外名稱：北大機會雷達
- 名稱狀態：對外名稱尚未定案；不要直接使用「獎金獵人」，避免與既有平台混淆。
- 產品定位：北大／北聯大機會推薦 Web App
- v0.1 主入口：Web App
- v0.1 資料：mock data
- v0.2 目標：在不接後端的前提下，補齊主控台定案的第一版核心 filter，讓 demo 更接近可測試的產品流程。
- v0.3 目標：開始讀取 Supabase 公開機會資料，但不做登入、不寫入學生資料、不做提醒。
- v0.4 目標：建立人工資料整理流程，讓團隊先把公告整理成一致格式，再人工確認是否匯入 Supabase。
- v0.4-B 目標：建立公開公告來源清單與去重欄位，為後續人工匯入或自動化抓取做準備。
- v0.4-C 目標：用 2–3 筆真實官方公開來源 sample 驗證 `source_url`、Supabase `competitions`、前端列表與詳情頁的資料鏈路。
- v0.5-A 目標：加入 Google Login 與 `profiles`，但未登入仍可瀏覽機會。
- v0.5-B 目標：加入 `saved_competitions` 雲端收藏同步，但未登入仍保留 localStorage 收藏。
- v0.5-C 目標：實機驗證 Auth、profiles、saved_competitions 與 RLS。
- v0.5-D 目標：登入後同步完整偏好到 `user_preferences`，並保留未登入 localStorage 流程。
- v0.6-A 目標：建立提醒設定資料模型與 opt-in UI，但先不寄 Email。
- C0.3 目標：建立 `raw_announcements`、`raw_announcement_files` 與 `draft_competitions` 暫存層，讓公開公告與官方簡章先經人工審核再發布到前台。

## v0.1 不處理

- 登入
- 後端
- 自動爬取
- AI 分類
- Email
- Discord Bot

## v0.3 不處理

- 登入
- 個人 profile 資料表
- 雲端收藏
- 提醒
- n8n 自動化
- AI 分類
- Email
- Discord Bot

## v0.4-A 不處理

- 登入
- 權限管理
- 直接寫入資料庫
- 圖片或附件上傳
- 自動爬取
- AI 分類

## v0.4-C 不處理

- 登入
- profiles
- 雲端收藏
- 提醒
- Email
- n8n 排程
- Gemini
- AI 個人化推薦

## v0.5-A 不處理

- 雲端收藏
- saved_competitions
- 提醒
- Email
- n8n 排程
- Gemini
- AI 個人化推薦

## v0.5-B 不處理

- 提醒
- Email
- n8n 排程
- Gemini
- AI 個人化推薦
- Discord Bot

## v0.5-C 不處理

- 新功能開發
- preferences table
- 完整偏好雲端同步
- 提醒
- Email
- n8n 排程
- Gemini
- AI 個人化推薦
- Discord Bot

## v0.5-D 不處理

- 提醒
- Email
- n8n 排程
- Gemini
- AI 個人化推薦
- Discord Bot

## v0.6-A 不處理

- Email 寄送
- Email API
- n8n 排程
- Gemini
- AI 生成提醒內容
- 高頻通知
- Discord Bot

## C0.3 不處理

- 自動排程
- 直接發布到 `competitions`
- 一般使用者讀取 staging 資料
- Gemini 或其他 AI 分類
- n8n
- Email 寄送
- 學生個資
- 後台角色權限 UI

## 第一版機會類型

- 比賽
- 獎學金
- 補助／計畫
- 其他

## 第一版排除

- 講座／工作坊
- 實習／職缺
- 打工
- 海外交換
- 一般活動

## v0.8-A Online Demo Deployment

- 因為需要向組員展示 demo，online deployment 需求提前插隊。
- 這一步是展示版本，不代表正式產品上線。
- 第一輪線上 demo 建議先使用 `NEXT_PUBLIC_USE_MOCK_DATA=true`，避免 Supabase schema、RLS 或 Auth 尚未驗證造成空白頁。
- 等 Supabase published sample、Google Login 與 RLS 穩定後，再切換到真實資料展示模式。
- 部署檢查清單請看 `docs/ONLINE_DEMO_DEPLOYMENT.md`。
