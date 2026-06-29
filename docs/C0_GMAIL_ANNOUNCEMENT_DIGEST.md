# C0_GMAIL_ANNOUNCEMENT_DIGEST

## 目標

把學校每日公告信件作為「公告發現來源」，協助 crawler 找到更多候選公告。

這個來源只處理校方公告清單，不處理一般私人 Email。

## 資料來源

目標信件標題：

- `國立臺北大學本日電子郵件公告清單`

第一版可接受兩種輸入：

- Gmail API 讀取指定標題或指定寄件者的最新公告信。
- 使用者手動匯出的 PDF / HTML，轉成候選公告 URL 清單。

## 處理流程

```text
讀取公告信
→ 抽出公告標題、公告 URL、公告日期
→ URL 去重
→ 交給 crawler 抓官方公告頁
→ 產生 raw_announcements
→ draft_competitions
→ 人工審核
→ published competitions
```

## 邊界

- Gmail 公告信只作為索引，不作為最終簡章。
- 不從 Email 本文直接發布機會。
- 不讀取或分析學生私人信件。
- 不接使用者偏好、收藏、提醒或任何學生個資。
- 不把講座／工作坊、實習／職缺、打工、海外交換放回第一版核心。
- 急難救助、一般文化推廣計畫不放入前台 published opportunities。

## Gmail API 建議查詢

建議使用查詢條件：

```text
subject:"國立臺北大學本日電子郵件公告清單" newer_than:14d
```

若之後確認固定寄件者，再加上：

```text
from:<校方公告寄件者>
```

## 第一版欄位

Email digest parser 只需要輸出：

- `sourceKey`
- `sourceName`
- `title`
- `url`
- `postedDate`
- `rawDigestText`
- `fetchedAt`

後續仍由 crawler 進官方公告頁補齊：

- `rawText`
- `contentHash`
- `sourceUrl`
- `attachments`

## 發布決策

- 「劇集劇本創作獎」保留在 `補助／計畫`。
- 「天河教育基金會補助」保留，但若 deadline 已過，前台顯示「已截止」。

## 短期人工 URL 流程

在 Gmail API 尚未串接前，先使用人工篩選 URL：

```text
編輯 scripts/crawler/manual-urls.txt
→ npm run crawl:manual-urls
→ npm run crawl:export-raw-sql
→ npm run crawl:export-published-sql
→ 人工檢查 published-opportunities.review.sql
→ 貼到 Supabase SQL Editor
```

`crawl:manual-urls` 會讀取 `scripts/crawler/manual-urls.txt`，並以 `--match=all-news` 抓取每個指定公告頁。

注意：

- 這個流程會重寫 `scripts/crawler/output/sample-announcements.json`。
- 若要保留前一次 crawler output，請先備份 output 或之後改用 merge 模式。
- 舊版 `bulletin.ntpu.edu.tw` 公告頁標題需從「公告標題」欄位抽取，不可使用 HTML `<title>`，因為頁面標題通常只會是「電子郵件公告」。
