# Admin Direct Import

`/data-entry` 目前支援管理者直接寫入 Supabase `competitions`。

## 權限

- 前台入口只在 `cindy901119@gmail.com` 登入時顯示。
- API `/api/admin/competitions` 會在 server-side 再次檢查登入者 email。
- 一般使用者即使知道 API 路徑，也會收到 `403 forbidden`。

## 必要環境變數

Vercel Production 需要設定：

```env
SUPABASE_SERVICE_ROLE_KEY=
```

這個值只能放 server-side environment variables，不可放 `NEXT_PUBLIC_`。

## 使用方式

1. 用管理者帳號登入。
2. 到 `/account` 打開「編輯匯入資料」。
3. 填寫草稿欄位。
4. 狀態選 `published` 才會出現在前台。
5. 按「直接發布到資料庫」。

若 `source_item_key` 已存在，系統會更新原本資料；若不存在，會新增一筆。

