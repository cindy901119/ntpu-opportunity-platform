# C0_GEMINI_DRAFT_CONTRACT

## 目的

本文件定義 C0.5 的 Gemini 輸入與輸出契約。現在先不呼叫 Gemini，只先固定格式，避免之後 n8n 串接時臨時決定欄位。

## 輸入資料

Gemini 只能收到公開公告與官方附件抽出的文字。

不可送入：

- 學生姓名。
- 學生 Email。
- 學校、科系、年級、偏好、收藏或提醒設定。
- 推薦分數或內部權重。

## 輸出 JSON

```json
{
  "title": "string",
  "opportunityType": "比賽 | 獎學金 | 補助／計畫 | 其他",
  "summary": "string",
  "organizer": "string | null",
  "officialUrl": "string",
  "deadline": "YYYY-MM-DD | null",
  "eligibilityText": "string | null",
  "rewardText": "string | null",
  "specialNotes": ["string"],
  "confidence": "low | medium | high",
  "needsHumanReview": true
}
```

## 重要規則

- 不確定就輸出 null，不要猜。
- 不要把講座／工作坊、實習／職缺、打工、海外交換當成第一版核心機會。
- 不要替使用者做個人化推薦。
- 不要直接產生 published competition。
- `needsHumanReview` 第一階段一律為 true。

## 對應 draft_competitions

| Gemini 欄位 | draft_competitions 欄位 |
| --- | --- |
| title | title |
| opportunityType | opportunity_type |
| summary | summary |
| organizer | organizer |
| officialUrl | source_url |
| deadline | deadline |
| eligibilityText | eligibility_text |
| rewardText | prize_text |
| specialNotes | special_notes |
| confidence | reviewer_notes 或後續 confidence 欄位 |
| needsHumanReview | draft_status = needs_review |
