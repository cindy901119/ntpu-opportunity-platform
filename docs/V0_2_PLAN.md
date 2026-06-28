# V0_2_PLAN

## 目標

v0.2 維持前端 mock demo，不接後端、不登入、不接 Supabase、n8n、Gemini、Email 或 Discord Bot。

本階段目標是把主控台文件定案的第一版核心 filter 落到前端，讓使用者可以更接近真實地篩選機會。

## v0.2 範圍

- 在偏好設定頁新增完整 filter：
  - 主題領域
  - 截止時間
  - 獎勵形式
  - 最高獎金
- mock data 補上對應欄位：
  - `topicAreas`
  - `rewardTypes`
  - `maxPrizeAmount`
- 推薦列表套用完整 filter 後再排序。
- 列表上方顯示目前套用的主要 filter 摘要。
- 更新文件與 changelog，方便後續回溯。

## v0.2 不做

- 不接真實公告來源。
- 不接 Supabase。
- 不做登入。
- 不做 n8n。
- 不做 Gemini。
- 不做 Email 寄送。
- 不做 Discord Bot。
- 不新增第一版排除的機會類型。

## 仍待確認

- 獎勵形式正式 label 是否要保留目前版本：獎金、獎學金、補助、實體資源、曝光、證書。
- 主題領域是否需要「展開更多」互動，或先全部顯示。
- 最高獎金級距是否符合使用者判斷習慣。
- mock `sourceUrl` 何時換成真實官方簡章來源。

## 後續銜接

- v0.3-A 開始銜接 Supabase `competitions` 公開讀取。
- v0.3-A 仍不做登入，也不把偏好、收藏或提醒寫入資料庫。
