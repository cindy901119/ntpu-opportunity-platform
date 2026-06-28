# V0_8_PLAN

## 目標

v0.8 的目標是提早處理 online demo deployment，讓組員能用網址查看目前 demo。

這一步是展示需求，不代表正式產品上線。

## v0.8-A：Online demo deployment prep

- 新增線上 demo 部署指南。
- 明確區分 mock-only demo 與 Supabase demo。
- 補上 Vercel、環境變數、Supabase redirect URL 與 demo 前檢查清單。
- 將線上部署需求列為插隊優先事項。
- 新增最小 `vercel.json`，明確標示 Next.js framework。

## v0.8-A 不做

- 不做正式 Production launch。
- 不保證 Gmail 測試信已可在線上寄送。
- 不啟用正式提醒排程。
- 不接 n8n。
- 不接 Gemini。
- 不做 Discord Bot。
- 不做正式後台權限。

## 推薦 demo 模式

第一輪組員展示建議使用 mock data：

```env
NEXT_PUBLIC_USE_MOCK_DATA=true
```

等 Supabase Auth、published sample、RLS、Google Login 都穩定後，再切換：

```env
NEXT_PUBLIC_USE_MOCK_DATA=false
```

## 驗收

1. 有線上 deployment URL。
2. `/` 可以開。
3. `/opportunities` 有資料。
4. `/opportunities/[id]` 可以開。
5. `/preferences` 可以儲存偏好。
6. `/saved` 可以收藏與取消收藏。
7. 手機版卡片可讀。
8. 前端不顯示 internalScore 或推薦分數。
9. 若展示登入，Supabase Auth redirect URL 已包含線上網址。

## 下一步候選

- 建立 Vercel project。
- 設定 Preview / Production env。
- 跑一次線上 demo smoke test。
- 視需要新增簡短 demo script 給組員會議使用。
