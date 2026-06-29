# C0_N8N_HANDOFF

## 目前狀態

目前尚未正式串接 n8n。repo 端先準備 n8n-ready 的輸入、輸出與 SQL 草稿，讓之後接排程時不需要重新設計資料格式。

## n8n 建議角色

n8n 適合負責：

- 定時觸發。
- 呼叫 crawler 或讀取 crawler output。
- URL 去重與 content hash 去重前置檢查。
- 寫入 `raw_announcements`。
- 呼叫 Gemini 產生 draft。
- 記錄錯誤與通知維護者。

n8n 不負責：

- 推薦演算法。
- 學生個資處理。
- 前端顯示邏輯。
- 直接寫入 `published competitions`。
- 長篇複雜資料清理規則。

## C0.4 Raw Ingestion Handoff

目前可先使用：

```text
npm run crawl:c0
npm run crawl:export-raw-sql
```

輸出：

- `scripts/crawler/output/sample-announcements.json`
- `scripts/crawler/output/crawler-report.json`
- `scripts/crawler/output/raw-announcements.sql`
- `scripts/crawler/output/text/`

n8n 未來流程建議：

```text
Schedule Trigger
→ Run crawler
→ Read sample-announcements.json
→ Upsert raw_announcements by source_item_key
→ If content hash changed, set status = needs_review
→ Store crawler-report.json or send summary
```

## C0.5 Gemini Draft Handoff

Gemini input 只可包含公開公告與官方附件文字：

```json
{
  "rawAnnouncementId": "uuid-or-null",
  "sourceName": "國立臺北大學學務處課外組公告",
  "title": "公告標題",
  "url": "https://example.edu/news/1",
  "postedDate": "2026-04-09",
  "rawText": "公告原文",
  "attachmentsText": [
    {
      "sourceUrl": "https://example.edu/file.pdf",
      "fileHash": "sha256",
      "extractedText": "附件文字"
    }
  ]
}
```

Gemini output 必須是草稿，不是正式發布資料：

```json
{
  "title": "整理後標題",
  "opportunityType": "比賽 | 獎學金 | 補助／計畫 | 其他",
  "summary": "一句到三句摘要",
  "organizer": "主辦單位或 null",
  "officialUrl": "官方公告或簡章 URL",
  "deadline": "YYYY-MM-DD 或 null",
  "eligibilityText": "資格文字或 null",
  "rewardText": "獎勵文字或 null",
  "specialNotes": ["需人工確認的事項"],
  "confidence": "low | medium | high",
  "needsHumanReview": true
}
```

## C0.6 Human Review Gate

人工審核通過前，不得寫入 `competitions(status = published)`。

發布前至少確認：

- 機會類型符合第一版核心：比賽、獎學金、補助／計畫、其他。
- 官方 URL 可開啟。
- 截止日若不明，必須保留 null 並寫入 special notes。
- 資格限制不可亂補。
- 獎金或獎勵不可把總獎金池誤當最高獎金。
- Gemini 低信心或欄位缺漏必須維持 `needs_review`。

## 安全邊界

- n8n 與 Gemini 只處理公開公告資料。
- 不傳學生 profile、偏好、收藏、Email 或提醒設定給 Gemini。
- crawler、n8n、Gemini 都不得直接發布到 `published competitions`。
