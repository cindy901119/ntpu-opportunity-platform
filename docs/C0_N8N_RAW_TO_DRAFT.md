# C0 n8n Raw To Draft

## MVP 流程

```text
crawler
→ raw_announcements
→ 人工打開 n8n workflow
→ 讀取待處理 raw rows
→ Gemini 整理成 draft JSON
→ 寫入 draft_competitions
→ raw_announcements.status = converted
→ 人工審核 draft
→ 才匯入 competitions(status = published)
```

## 前置條件

Supabase 已建立：

- `raw_announcements`
- `draft_competitions`

crawler 已把公開公告寫入 `raw_announcements`，狀態建議為：

- `possible_opportunity`
- `needs_review`

## n8n 節點設計

### 1. Manual Trigger

MVP 階段先人工觸發，不自動排程。

### 2. Supabase: Select raw rows

查詢條件：

```sql
select *
from raw_announcements
where status in ('possible_opportunity', 'needs_review')
order by source_posted_date desc nulls last, source_fetched_at desc
limit 10;
```

### 3. Split In Batches

一次處理 1 筆或少量資料，方便失敗時回頭檢查。

### 4. Gemini

輸入只放公開資料：

- `source_title`
- `source_url`
- `source_name`
- `source_posted_date`
- `raw_text`
- `detected_keywords`

不可放：

- 學生個資
- 使用者偏好
- 收藏
- Email
- reminder settings

輸出格式依 `docs/C0_GEMINI_DRAFT_CONTRACT.md`。

### 5. Validate required fields

至少檢查：

- `title`
- `source_url`
- `opportunity_type`
- `summary`
- `needsHumanReview = true`

若 `opportunity_type` 不在第一版核心：

- 比賽
- 獎學金
- 補助／計畫
- 其他

則不要寫入 draft。

### 6. Supabase: Upsert draft_competitions

建議以 `raw_announcement_id` 或 `source_item_key` 做去重。

`draft_status` 固定為：

```text
needs_review
```

### 7. Supabase: Update raw status

成功轉 draft 後：

```sql
update raw_announcements
set status = 'converted',
    updated_at = now()
where id = :raw_announcement_id;
```

若 Gemini 失敗或資料不適合：

```sql
update raw_announcements
set status = 'needs_review',
    review_notes = :error_or_reason,
    updated_at = now()
where id = :raw_announcement_id;
```

## 人工審核

人工審核 draft 時需確認：

- 官方公告連結可開啟。
- 截止日不是 Gemini 猜的。
- 資格、獎勵、最高金額都有來源依據。
- 不屬於講座、工作坊、實習、打工、海外交換或一般活動。
- 不確定就不要發布。

發布前仍需人工匯入 `competitions(status = published)`。
