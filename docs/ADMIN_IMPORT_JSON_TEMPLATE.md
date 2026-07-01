# Admin Import JSON Template

把公告內容交給 GPT 整理時，可以請它輸出以下 JSON。貼到 `/data-entry` 的「貼上 JSON」後，再人工檢查並直接發布。

```json
{
  "title": "",
  "organizer": "",
  "source_url": "",
  "source_name": "",
  "source_type": "manual_public_source",
  "source_posted_date": "",
  "source_fetched_at": "",
  "source_content_hash": "",
  "source_item_key": "",
  "series_key": "",
  "instance_key": "",
  "deadline": "",
  "opportunity_type": "比賽",
  "topic_areas": [],
  "category_tags": [],
  "skill_tags": [],
  "submission_types": [],
  "first_stage_deliverables": [],
  "eligibility_text": "",
  "school_limit": "",
  "department_limit": "不限",
  "grade_limit": "",
  "prize_text": "",
  "reward_types": [],
  "max_prize_amount": 0,
  "summary": "",
  "special_notes": [],
  "participation_text": "",
  "schedule": [],
  "judging_text": "",
  "status": "draft"
}
```

## Allowed values

- `opportunity_type`: `比賽`、`獎學金`、`補助／計畫`、`其他`
- `topic_areas`: `商業／企劃`、`創業／新創`、`科技／程式`、`法政／公共議題`、`社會／永續`、`不限／不適用`、`人文／寫作`、`語言／國際`、`設計／創作`、`其他`
- `reward_types`: `獎金`、`獎品`、`證書`、`補助`、`無明確獎勵`、`未寫清楚`
- `status`: 先用 `draft`，確認後再改 `published`

## Notes

- `deadline` 使用 `YYYY-MM-DD`。
- `schedule` 格式為 `[{ "date": "2026-08-31", "label": "報名截止" }]`。
- `summary` 請控制在 1–2 句，不要貼公告全文。
- 不要把資料清理過程寫進 `special_notes`。

