# PRODUCT_DECISIONS

## 名稱

- 內部代號：`bonus-hunter`
- 暫定對外名稱：北大機會雷達
- 對外名稱尚未定案。
- 對外展示不要直接使用「獎金獵人」，避免與既有平台混淆。

## 產品定位

- 第一版產品是面向北大與北聯大學生的機會推薦 Web App。
- 服務對象先聚焦大學生到碩士生。
- 核心目標：協助學生整理、篩選與理解自己能參加且可能適合的比賽、獎學金、補助／計畫等機會。

## 第一版核心機會類型

- 比賽
- 獎學金
- 補助／計畫
- 其他

## 第一版不納入核心

- 講座／工作坊
- 實習／職缺
- 打工
- 海外交換
- 一般活動

## 主入口與通知方式

- Web App 是主入口。
- Discord 是未來互動與組隊入口。
- Email 是未來摘要與保存入口。
- 推播容易被忽略，因此不能把 Discord 或 Email 當唯一入口。

## 待討論事項

1. 對外產品名稱。
2. 報名形式／組隊條件是否作為第二階段 filter。
3. 第一階段成品形式的正式 label。
4. 卡片固定格式。
5. Discord Bot 優先級。
6. repo docs 如何持續同步主控台文件。

## v0.4-A 決策

- 先做人工資料整理工作台，不做登入與後台權限。
- 工作台只產生 JSON / SQL 草稿，不直接寫入 Supabase。
- 寫入資料庫前仍需要人工檢查官方簡章與欄位內容。

## v0.4-B 決策

- 公開公告來源先集中在 repo 文件 `docs/SOURCE_REGISTRY.md` 管理。
- 第一輪 active 來源以北大學務處課外組公告為主。
- 生輔組、研發處、北聯大系統公告先列為 candidate。
- 去重先使用 `source_item_key`、`source_content_hash`、`series_key`、`instance_key`。
- 自動化前應先建立 raw announcements 暫存層，不要讓爬蟲直接發布到 `competitions`。

## v0.4-C 決策

- 先用少量真實官方公開來源 sample 驗證資料鏈路，不追求一次補齊正式資料庫。
- 真實來源 sample 可以設為 `published` 以測試前端列表與詳情頁，但仍需標示為人工整理樣本。
- 若公告列表頁資訊不足，不硬編截止日、金額或資格；用 `special_notes` 提醒確認官方公告。
- v0.4-C 完成後才進入 v0.5-A 登入與 profiles 規劃。

## v0.5-A 決策

- v0.5-A 只做 Google Login + profiles。
- profile 只保存「我的資格」基本欄位，不保存推薦分數、排序權重或 AI 解釋。
- 未登入使用者仍可瀏覽機會列表與詳情頁。
- 收藏同步、提醒、Email、n8n、Gemini 延後到後續版本。

## v0.5-B 決策

- v0.5-B 只做雲端收藏同步。
- 未登入使用者仍使用 localStorage 收藏。
- 已登入使用者的收藏同步到 Supabase `saved_competitions`。
- 本機收藏與雲端收藏採合併策略，不在第一版做衝突解決 UI。
- 本版不做提醒、Email、n8n、Gemini 或 AI 個人化推薦。

## v0.5-C 決策

- v0.5-C 先做 Auth、profiles、saved_competitions 與 RLS 的實機驗證。
- v0.5-C 不新增提醒、Email、n8n、Gemini 或 Discord Bot。
- v0.5-A / v0.5-B 實機驗證通過後，才能標示為 Verified。

## v0.5-D 決策

- v0.5-D 正式建立 `user_preferences`，讓登入使用者可跨裝置保存完整偏好。
- 未登入使用者仍先保留 localStorage。
- 登入後若雲端已有偏好，雲端偏好會帶入偏好設定頁。
- 登入後若雲端尚無偏好，會用本機偏好建立雲端偏好。
- 登入後若雲端已有 profile，雲端 profile 會成為「我的資格」的主要來源。
- 本版不做提醒、Email、n8n、Gemini 或 AI 個人化推薦。

## v0.6-A 決策

- v0.6-A 只建立提醒設定資料模型與 opt-in UI。
- 使用者必須登入才可儲存提醒設定。
- 提醒設定包含開關、自訂提前天數、偏好寄送時間與 notification email。
- 提醒的產品語氣是早點讓學生知道機會，不是催促交件。
- 本版不寄 Email、不接 Email API、不接 n8n、不接 Gemini。
- 未登入使用者不強迫填 Email。

## v0.6-B Email 提醒待對齊

- v0.6-A 已先保存提醒設定，但不寄信。
- v0.6-B Email 服務方向先以 Gmail 評估；實作前仍需確認 Gmail API、SMTP 或 Gmail-compatible 方案。
- 第一輪先採 Gmail API 測試信，不直接啟用正式排程提醒。
- 寄送時間與提前天數應保留給使用者自訂。
- 需建立 `notification_logs` 保存寄送紀錄，避免同一提醒重複寄送。
- 使用者設定 Email 時，應先寄測試信；測試通過後才標記 Email 已驗證。
- 使用者可在提醒設定中關閉提醒。
- 失敗重試策略仍待確認。
- Email 應只寄給已登入、已 opt-in、且有設定 notification email 的使用者。
- Email 不應成為唯一入口，也不應用於廣告或高頻推播。

## C0.3 決策

- 公開公告先進 `raw_announcements`，不要直接進 `competitions`。
- 官方簡章或附件可短期暫存於 `raw_announcement_files`，供 Gemini 分析與人工審核；審核後保留 URL、file hash、extracted text 或證據摘要，原始附件可設定到期清理。
- 整理後的機會先進 `draft_competitions`，人工確認後才發布。
- `draft_competitions` 不顯示給一般使用者。
- C0.3 只建立 staging 資料模型與人工工作台，不啟用自動排程。
- 未來若接 Gemini 或 n8n，只能處理公開公告資料，不可接觸學生個資。

## v0.8-A 決策

- 因為需要向組員展示 demo，online deployment 需求提前插隊。
- 第一輪線上 demo 是展示版本，不是正式上線。
- 第一輪展示優先使用 mock data，確保組員能看到完整流程。
- Supabase、Google Login、Gmail 測試信可作為加分展示，但不應卡住第一次線上 demo。
- `/data-entry` 與 `/data-staging` 可保留，但不作為一般使用者 demo 主流程。
