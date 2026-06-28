# V0_4_PLAN

## 目標

v0.4 的目標是建立人工資料整理流程，讓團隊可以先把公告整理成一致格式，再決定是否貼到 Supabase。

v0.4 仍不做登入、不寫入學生資料、不做雲端收藏、不做提醒。

## v0.4-A：本次推進

- 新增 `/data-entry` 資料匯入工作台。
- 工作台只在瀏覽器端運作，不直接寫入 Supabase。
- 可整理 `competitions` 草稿資料。
- 可複製 JSON 草稿。
- 可複製 SQL insert 草稿。
- 草稿暫存在 localStorage，方便整理中途離開頁面。

## v0.4-B：本次推進

- 建立公開公告來源清單與去重規則。
- 新增 `docs/SOURCE_REGISTRY.md`。
- `competitions` schema 補上來源追蹤欄位：
  - `source_name`
  - `source_type`
  - `source_posted_date`
  - `source_fetched_at`
  - `source_content_hash`
  - `source_item_key`
  - `series_key`
  - `instance_key`
- 補上去重 index，避免同一來源公告重複匯入。

## v0.4-C：本次推進

- 新增 `docs/SUPABASE_PUBLIC_SAMPLE.sql`，用真實官方公開來源建立 3 筆 `published` sample。
- 驗證目標是「官方公告／簡章連結 → Supabase `competitions` → 前端 `/opportunities` 與 `/opportunities/[id]`」。
- sample 保留 `source_url`、`source_name`、`source_item_key`、`series_key`、`instance_key` 等來源追蹤欄位。
- `/data-entry` 匯入工作台補上來源與去重欄位，輸出的 SQL 可直接帶入 v0.4-B schema。
- 使用者已在前端看到 Supabase 真實來源 sample，公開資料鏈可標示為 Verified。
- 已補上「已截止」推薦標籤，避免過期公告被顯示為「時間偏緊」。
- 列表預設隱藏已截止資料，並提供「顯示已截止」切換，讓真實來源 sample 與歷史公告仍可檢查。
- v0.4-C 仍保留 mock fallback 與 demo seed，不做登入、不寫入學生資料、不做自動化排程。

## v0.4-A 不做

- 不做登入。
- 不做權限管理。
- 不做資料庫寫入。
- 不做圖片或附件上傳。
- 不做爬蟲。
- 不做 AI 分類。

## 使用流程

1. 開啟 `/data-entry`。
2. 將官方公告內容整理到表單。
3. 檢查基本欄位提示。
4. 複製 JSON 或 SQL 草稿。
5. 人工確認後再貼到 Supabase SQL editor。

## 下一步候選

1. v0.4-D：加入 CSV 匯入／匯出流程，或把真實來源整理成更穩定的人工審核表。
2. v0.5-A：加入 Google 登入與 profiles，但仍保留未登入可用流程。
