# SOURCE_REGISTRY

## 目的

本文件整理 v0.4-B 的公開公告來源清單與去重規則。它是人工匯入、爬蟲原型與未來 n8n 流程共用的資料來源參考。

C0.2 只做來源與去重規劃，不做登入、不寫入學生資料、不啟用自動化排程。

## 來源狀態

### active

目前可作為第一輪測試來源。

### candidate

值得研究，但尚未確認列表結構、資料品質或是否適合第一版。

### paused

先不納入第一版，避免混入太多非核心內容。

## 公開來源清單

| source_key | source_name | source_type | status | url | 適合內容 |
| --- | --- | --- | --- | --- | --- |
| ntpu_osa_extracurricular | 國立臺北大學學務處課外組公告 | school_public_page | active | https://new.ntpu.edu.tw/osa/news?tag=課外組,課指組&title=課外組 | 比賽、補助／計畫、徵選、提案 |
| ntpu_osa_life | 國立臺北大學學務處生活輔導組 | school_public_page | candidate | https://new.ntpu.edu.tw/osa/life | 獎學金、弱勢助學金、急難救助 |
| ntpu_rd | 國立臺北大學研發處公告 | school_public_page | candidate | 待確認 | 國科會、研究計畫、補助 |
| tua_public | 臺北聯合大學系統公告 | school_public_page | candidate | 待確認 | 北聯大跨校與跨域機會 |

## 第一版不納入來源

- 講座／工作坊為主的活動頁。
- 實習／職缺頁。
- 打工資訊頁。
- 海外交換頁。
- 單純校園新聞或成果報導。

## 去重欄位

### source_item_key

同一來源中的單筆公告穩定 key。

建議格式：

```text
{source_key}:{normalized_url}
```

若來源 URL 會變動，可改用：

```text
{source_key}:{posted_date}:{normalized_title}
```

### source_content_hash

公告正文標準化後的 hash，用來判斷內容是否更新。

標準化原則：

- 移除 HTML tag。
- 合併多餘空白。
- 保留中文、英文、數字與重要標點。
- 不把抓取時間放進 hash。

### series_key

同一活動或同一系列機會跨年度的穩定 key。

例：

```text
ai-campus-innovation
ntpu-student-scholarship
```

### instance_key

同一 series 的特定年度或梯次。

例：

```text
2026
114-2
2026-summer
```

## 匯入判斷

1. `source_item_key` 已存在：視為同一公告。
2. `source_item_key` 已存在且 `source_content_hash` 不同：視為公告內容更新，先進人工確認。
3. `source_item_key` 不同但 `series_key + instance_key` 相同：可能是同一機會重複公告，先進人工確認。
4. `source_item_key`、`series_key` 都不同：可視為新公告草稿。

## C0.2 後續

- 若要進入自動化，先建立 raw announcements 暫存表，不要直接寫入 published competitions。
- 人工確認後再把資料整理成 `competitions`。
- Gemini 或其他 AI 只能處理公開公告文字，不可接觸學生個資。

## C0.3 staging 對應

`docs/SUPABASE_STAGING_SCHEMA.sql` 已將來源清單與去重規則落到三張 staging table：

- `raw_announcements`：保存來源公告原文與 hash。
- `raw_announcement_files`：保存官方簡章或附件的短期快取與 extracted text。
- `draft_competitions`：保存整理後但尚未發布的機會草稿。

建議對應：

| registry 欄位 | raw_announcements / draft_competitions 欄位 |
| --- | --- |
| source_key | source_key |
| source_name | source_name |
| source_type | source_type |
| url | source_url |
| source_item_key | source_item_key |
| source_content_hash | source_content_hash |
| series_key | draft_competitions.series_key |
| instance_key | draft_competitions.instance_key |

## v0.4-C public sample

`docs/SUPABASE_PUBLIC_SAMPLE.sql` 已放入 3 筆真實官方公開來源 sample，用來測試來源鏈路，不代表正式資料庫已完成資料審核。

| source_key | title | source_item_key | status |
| --- | --- | --- | --- |
| ntpu_osa_extracurricular | 2026 金車曙光暑假物資贊助計劃 | ntpu_osa_extracurricular:2026-04-15:kingcar-summer-sponsorship | published sample |
| ntpu_osa_extracurricular | 2026 雲林縣歌唱人才培訓計畫－雲耀星聲歌唱選秀大賞 | ntpu_osa_extracurricular:2026-04-16:yunlin-singing-selection | published sample |
| ntpu_osa_extracurricular | 114-2 學期亞德客有美公益活動經費補助 | ntpu_osa_extracurricular:2026-04-16:airtac-public-service-funding | published sample |

sample 注意事項：

- 若來源只有列表頁資訊，`special_notes` 會標示需確認官方公告。
- 不完整欄位不硬編；無截止日或金額時保留 `null` 或用文字說明需確認。
- 後續正式匯入前仍需人工比對原始公告或附件。
