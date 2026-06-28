# ONLINE_DEMO_DEPLOYMENT

## 目的

這份文件是為了提早準備線上 demo。目標不是正式上線，而是讓組員可以用網址打開目前的北大機會雷達 demo，方便討論 UI、流程、資料與後續分工。

## 建議版本

建議把這一步列為：

```text
v0.8-A：Online demo deployment prep
```

這一步可以插隊，優先於正式 Email 排程、n8n、Gemini 或 Discord Bot。

## 推薦部署方式

第一輪建議使用 Vercel。

原因：

- Next.js 專案支援度高。
- 可直接連 Git repository。
- 每次 push 可產生 Preview deployment。
- 可設定 Production / Preview / Development 環境變數。
- 適合給組員快速看 demo。

Vercel 官方文件列出多種部署方式：Git、Vercel Drop、Vercel CLI、Deploy Hooks 與 REST API。第一輪建議使用 Git 或 Vercel CLI。

參考：

- https://vercel.com/docs/deployments
- https://nextjs.org/docs/app/guides/environment-variables

## 目前 repo 準備狀態

- `npm run build` 已在 2026-06-28 通過。
- 已新增 `vercel.json`，明確標示 framework 為 `nextjs`。
- Vercel CLI 於本機第一次執行時遇到 Windows npm cache cleanup `EPERM`，因此第一輪更建議用 GitHub 連 Vercel 網頁部署。

## 第一輪線上 demo 範圍

線上 demo 先展示：

- 首頁
- 機會列表
- 機會詳情
- 偏好設定
- 收藏
- 帳號頁
- 匯入／審核工作台可先保留，但不作為主要展示流程

不要求第一輪線上 demo 完成：

- Gmail 真實寄信
- 正式提醒排程
- n8n
- Gemini
- Discord Bot
- 完整後台權限
- 自動爬蟲正式匯入

## Demo 資料模式

### 安全展示模式：mock data

若只要給組員看流程，建議先用：

```env
NEXT_PUBLIC_USE_MOCK_DATA=true
```

優點：

- 不依賴 Supabase 資料是否完整。
- 不怕 RLS 或 schema 尚未驗證造成空白頁。
- 最適合第一次組內展示。

限制：

- 不會展示真實來源 sample。
- 登入、雲端收藏、雲端偏好、提醒設定會受 Supabase env 與 schema 影響。

### 真實資料展示模式：Supabase published data

若要展示真實公開來源 sample，使用：

```env
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

需要先確認：

- `docs/SUPABASE_SCHEMA.sql` 已執行。
- `docs/SUPABASE_PUBLIC_SAMPLE.sql` 已執行。
- `competitions` 至少有 `status = 'published'` 的資料。
- 前台 `/opportunities` 不會顯示空列表。

## 線上環境變數

### 必要

```env
NEXT_PUBLIC_USE_MOCK_DATA=true
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

若使用 mock-only demo，Supabase URL / anon key 可以先不填，但登入與雲端功能會無法完整展示。

### 若要展示 Google Login

```env
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Supabase Auth redirect URL 需加入線上網址：

```text
https://你的-demo-domain/auth/callback
```

### 若要展示 Gmail 測試信

```env
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REFRESH_TOKEN=
GMAIL_SENDER_EMAIL=
```

第一輪組員 demo 可以不展示 Gmail 測試信，避免 OAuth 設定卡住展示。

## 建議展示順序

1. 首頁：說明這是北大／北聯大機會推薦 Web App。
2. 機會列表：看推薦卡片、截止、獎金、資格、交件。
3. 展開「與你的設定相符」：展示資格符合與偏好交集。
4. 進入詳情頁：展示官方簡章責任邊界。
5. 偏好設定：改幾個 chip，回列表看排序或篩選變化。
6. 收藏頁：展示 localStorage 收藏。
7. 若 Supabase 已穩定，再展示登入、雲端收藏、提醒設定。

## Demo 前檢查清單

- `/` 可以開。
- `/opportunities` 有資料。
- `/opportunities/[id]` 可以開。
- `/preferences` 可以儲存。
- `/saved` 可以收藏與取消收藏。
- 手機寬度下卡片不爆版。
- 前端沒有顯示 internalScore、推薦分數、加權數字、排名數字。
- 「查看官方簡章」仍是官方驗證入口。
- 若使用 Supabase，確認至少一筆真實來源卡片可打開官方連結。
- 若展示登入，確認 Supabase redirect URL 已包含線上 domain。

## 建議不上線展示的內容

第一輪不建議在組員 demo 中主打：

- `/data-staging`
- `/data-entry`
- Gmail 測試信
- Supabase RLS 細節
- crawler script

這些可以放在工程進度補充，不作為一般使用者流程展示。

## 風險

- 如果直接使用 Supabase 模式，資料表或 RLS 未設定完成會造成空列表或登入錯誤。
- 如果展示 Gmail 測試信，OAuth refresh token 設定會增加 demo 風險。
- 如果 deploy 前沒有跑 build，可能會把本機未發現的 server route 或 env 問題帶到線上。

## 建議決策

第一個可展示版本建議：

```env
NEXT_PUBLIC_USE_MOCK_DATA=true
```

先讓組員看到完整產品流程。等 Supabase 與 Google Login 實機驗證穩定，再切換到真實資料展示模式。

## 建議實作路線

### 路線 A：GitHub + Vercel Web UI

這是第一輪推薦路線。

1. 將 repo push 到 GitHub。
2. 到 Vercel 建立 New Project。
3. Import Git Repository。
4. Framework Preset 選 Next.js。
5. Environment Variables 先設定：

```env
NEXT_PUBLIC_USE_MOCK_DATA=true
```

6. Deploy。
7. 拿到 Preview URL 後跑 demo 前檢查清單。

### 路線 B：Vercel CLI

若要使用 CLI，需要先登入：

```text
npx --yes vercel login
```

本機目前 `npx --yes vercel --version` 曾遇到 Windows npm cache cleanup `EPERM`，因此 CLI 可能需要手動清 npm cache 或改用已安裝的 Vercel CLI。
