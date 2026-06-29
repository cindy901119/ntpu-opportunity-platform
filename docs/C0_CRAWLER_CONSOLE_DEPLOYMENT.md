# C0 Crawler Console Deployment

## 目前結論

不要把現在的本機 crawler console 直接公開到網路上。

原因：

- 它可以觸發 crawler，會連到外部網站。
- 它可以新增來源，若公開無保護，容易被誤用。
- 它會產生 raw SQL 草稿，雖然不直接寫資料庫，但仍屬於內部資料管線工具。

## MVP 建議發布方式

### 選項 A：只給組員看畫面與輸出結果

最安全，適合第一輪展示。

流程：

1. 本機執行 `npm run crawl:ui`。
2. 開啟 `http://127.0.0.1:4310`。
3. 螢幕分享給組員。
4. 把 `sample-announcements.json` 或 `raw-announcements.sql` 貼給組員討論。

### 選項 B：部署成受保護的內部工具

適合組員要自行操作。

建議平台：

- Render / Railway / Fly.io：適合跑 Node server。
- 不建議直接放 Vercel static/frontend，因為 crawler console 需要長時間抓網頁、寫本機 output、啟動子程序。

必要保護：

- 加入簡單密碼或平台層級 access control。
- 只允許團隊成員知道網址。
- 不放 Supabase service role key 在前端。
- 不讓 console 直接寫 `competitions(status = published)`。

## 建議環境變數

```text
CRAWLER_UI_PORT=4310
CRAWLER_CONSOLE_PASSWORD=team-only-password
```

目前 repo 尚未加入密碼保護。若要真的公開給組員自行操作，下一步應先加 password gate。

## 不建議

- 不建議把 crawler console 接進 `/src/app` 主 WebApp。
- 不建議公開無密碼網址。
- 不建議讓 console 直接呼叫 Gemini。
- 不建議讓 console 直接發布 opportunities。
