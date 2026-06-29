# C0_REVIEW_CHECKLIST

## 人工審核目標

C0.6 的重點是讓 raw announcement 或 Gemini draft 先經人工審核，再發布到 `competitions(status = published)`。

## 發布前必查

- 官方公告 URL 可以開啟。
- 若有官方簡章或附件，已比對附件文字。
- 機會類型屬於第一版核心：比賽、獎學金、補助／計畫、其他。
- 不把講座／工作坊、實習／職缺、打工、海外交換放進第一版核心。
- 截止日明確才填 deadline；不明時保留 null。
- 獎金只填最高可得金額，不把總獎金池當最高獎金。
- 資格文字只整理公告明確寫出的限制。
- `special_notes` 記錄所有需使用者自行確認的事項。
- 官方 CTA 仍應是「查看官方簡章」。

## 可發布條件

draft 可以發布時，至少要有：

- title
- opportunity_type
- source_url
- summary
- special_notes，可為空陣列但不能遺漏
- draft_status = ready_to_publish 或等效人工確認狀態

## 不可發布條件

- 來源不是公開公告或官方簡章。
- 內容主要是講座、實習、職缺、打工或海外交換。
- Gemini 低信心且尚未人工補查。
- 重要欄位互相矛盾。
- 官方公告已刪除且沒有可驗證備份。

## 發布後

- published competition 只給前端讀取。
- 保留 raw announcement 與 draft 追溯關係。
- 原始附件可依 `expires_at` 清理，但保留官方 URL、file hash 與 extracted text 或證據摘要。
