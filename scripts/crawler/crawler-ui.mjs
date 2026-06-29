import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";

const PORT = Number(process.env.CRAWLER_UI_PORT ?? 4310);
const HOST = "127.0.0.1";
const ANNOUNCEMENTS_PATH = "scripts/crawler/output/sample-announcements.json";
const REPORT_PATH = "scripts/crawler/output/crawler-report.json";
const SQL_PATH = "scripts/crawler/output/raw-announcements.sql";
const SOURCES_PATH = "scripts/crawler/sources.json";

let running = false;
let lastLog = "";

function sendJson(response, statusCode, value) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(`${JSON.stringify(value, null, 2)}\n`);
}

function sendHtml(response, html) {
  response.writeHead(200, {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(html);
}

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return fallback;
  }
}

async function readText(path, fallback = "") {
  try {
    return await readFile(path, "utf8");
  } catch {
    return fallback;
  }
}

function runNode(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: process.cwd(),
      shell: false,
      windowsHide: true,
    });
    let output = "";

    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
      lastLog = output;
    });

    child.stderr.on("data", (chunk) => {
      output += chunk.toString();
      lastLog = output;
    });

    child.on("error", reject);
    child.on("close", (code) => {
      lastLog = output;
      if (code === 0) resolve(output);
      else reject(new Error(output || `Process exited with code ${code}`));
    });
  });
}

async function getState() {
  const [announcements, report, sql, sources] = await Promise.all([
    readJson(ANNOUNCEMENTS_PATH, []),
    readJson(REPORT_PATH, null),
    readText(SQL_PATH),
    readJson(SOURCES_PATH, []),
  ]);

  return {
    running,
    lastLog,
    report,
    announcements,
    sources,
    sqlRows: (sql.match(/\n  \(/g) ?? []).length,
    sqlPath: SQL_PATH,
  };
}

function csvToList(value) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeSource(input) {
  const sourceKey = String(input.sourceKey ?? "").trim();
  const sourceName = String(input.sourceName ?? "").trim();
  const listUrl = String(input.listUrl ?? "").trim();
  const allowedUrlPrefix = String(input.allowedUrlPrefix ?? "").trim();

  if (!/^[a-z0-9_-]{3,64}$/.test(sourceKey)) {
    throw new Error("sourceKey 只能使用小寫英文、數字、底線或連字號，長度 3-64。");
  }
  if (!sourceName) throw new Error("sourceName 必填。");
  if (!listUrl.startsWith("https://")) throw new Error("listUrl 目前只接受 https 公開網頁。");
  if (!allowedUrlPrefix.startsWith("https://")) throw new Error("allowedUrlPrefix 目前只接受 https。");

  return {
    sourceKey,
    sourceName,
    sourceType: "school_public_page",
    listUrl,
    allowedUrlPrefix,
    includeKeywords: csvToList(input.includeKeywords),
    excludeKeywords: csvToList(input.excludeKeywords),
    maxItems: Math.max(1, Math.min(100, Number(input.maxItems ?? 10))),
  };
}

async function handleAddSource(request, response) {
  const body = await readBody(request);
  const source = normalizeSource(body);
  const sources = await readJson(SOURCES_PATH, []);

  if (sources.some((item) => item.sourceKey === source.sourceKey)) {
    sendJson(response, 409, { error: "sourceKey 已存在，請換一個代號。" });
    return;
  }

  sources.push(source);
  await writeFile(SOURCES_PATH, `${JSON.stringify(sources, null, 2)}\n`, "utf8");
  sendJson(response, 200, { ok: true, state: await getState() });
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function handleCrawl(request, response) {
  if (running) {
    sendJson(response, 409, { error: "Crawler is already running." });
    return;
  }

  const body = await readBody(request);
  const maxItems = Math.max(1, Math.min(100, Number(body.maxItems ?? 20)));
  const maxPages = Math.max(1, Math.min(20, Number(body.maxPages ?? 3)));
  const matchMode = body.matchMode === "all-news" ? "all-news" : "keywords";
  const args = [
    "scripts/crawler/crawl-source.mjs",
    `--max-items=${maxItems}`,
    `--max-pages=${maxPages}`,
    `--match=${matchMode}`,
  ];

  running = true;
  lastLog = `Running crawler with maxItems=${maxItems}, maxPages=${maxPages}, match=${matchMode}...\n`;

  try {
    const log = await runNode(args);
    sendJson(response, 200, { ok: true, log, state: await getState() });
  } catch (error) {
    sendJson(response, 500, { error: String(error.message ?? error), state: await getState() });
  } finally {
    running = false;
  }
}

async function handleExportSql(response) {
  if (running) {
    sendJson(response, 409, { error: "Crawler is running. Export after it finishes." });
    return;
  }

  running = true;
  lastLog = "Exporting raw announcement SQL...\n";

  try {
    const log = await runNode(["scripts/crawler/export-raw-sql.mjs"]);
    sendJson(response, 200, { ok: true, log, state: await getState() });
  } catch (error) {
    sendJson(response, 500, { error: String(error.message ?? error), state: await getState() });
  } finally {
    running = false;
  }
}

function pageHtml() {
  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>C0 Crawler Console</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #1f2933;
      --muted: #5f6c78;
      --line: #d8ded9;
      --bg: #f7f6f1;
      --panel: #ffffff;
      --accent: #2f5a52;
      --accent-soft: #e1ece7;
      --warn: #8a5a12;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Arial, "Noto Sans TC", sans-serif;
      background: var(--bg);
      color: var(--ink);
    }
    header {
      padding: 24px clamp(18px, 4vw, 48px) 14px;
      border-bottom: 1px solid var(--line);
      background: #fff;
    }
    h1 { margin: 0; font-size: 26px; letter-spacing: 0; }
    main {
      width: min(1180px, 100%);
      margin: 0 auto;
      padding: 20px clamp(14px, 3vw, 32px) 36px;
    }
    .toolbar {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, max-content)) 1fr;
      gap: 12px;
      align-items: end;
      padding-bottom: 18px;
      border-bottom: 1px solid var(--line);
    }
    .source-form {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
      padding: 14px 16px;
      border-bottom: 1px solid var(--line);
    }
    .source-form label { min-width: 0; }
    .source-form input { width: 100%; min-width: 0; }
    label { display: grid; gap: 6px; font-size: 13px; color: var(--muted); }
    input, select, button {
      min-height: 38px;
      border-radius: 6px;
      border: 1px solid var(--line);
      background: #fff;
      color: var(--ink);
      font: inherit;
    }
    input, select { padding: 0 10px; min-width: 150px; }
    button {
      padding: 0 14px;
      cursor: pointer;
      font-weight: 700;
    }
    button.primary { background: var(--accent); color: #fff; border-color: var(--accent); }
    button:disabled { opacity: .55; cursor: wait; }
    .status {
      justify-self: end;
      color: var(--muted);
      font-size: 14px;
    }
    .grid {
      display: grid;
      grid-template-columns: 1.25fr .75fr;
      gap: 18px;
      margin-top: 18px;
    }
    section {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      min-width: 0;
    }
    section h2 {
      margin: 0;
      padding: 14px 16px;
      font-size: 16px;
      border-bottom: 1px solid var(--line);
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
      margin: 18px 0;
    }
    .metric {
      background: #fff;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 12px;
    }
    .metric b { display: block; font-size: 24px; }
    .metric span { color: var(--muted); font-size: 13px; }
    table { width: 100%; border-collapse: collapse; }
    th, td {
      text-align: left;
      vertical-align: top;
      padding: 10px 12px;
      border-bottom: 1px solid var(--line);
      font-size: 14px;
    }
    th { color: var(--muted); font-size: 12px; font-weight: 700; }
    td a { color: var(--accent); overflow-wrap: anywhere; }
    .tag {
      display: inline-block;
      margin: 2px 4px 2px 0;
      padding: 2px 6px;
      border-radius: 999px;
      background: var(--accent-soft);
      font-size: 12px;
    }
    pre {
      margin: 0;
      padding: 12px;
      max-height: 420px;
      overflow: auto;
      font-size: 12px;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .note {
      margin-top: 12px;
      color: var(--warn);
      font-size: 13px;
      line-height: 1.5;
    }
    @media (max-width: 850px) {
      .toolbar, .grid, .summary { grid-template-columns: 1fr; }
      .source-form { grid-template-columns: 1fr; }
      .status { justify-self: start; }
    }
  </style>
</head>
<body>
  <header>
    <h1>C0 Crawler Console</h1>
  </header>
  <main>
    <div class="toolbar">
      <label>每來源最多抓幾筆
        <input id="maxItems" type="number" min="1" max="100" value="30">
      </label>
      <label>最多抓幾頁
        <input id="maxPages" type="number" min="1" max="20" value="3">
      </label>
      <label>篩選模式
        <select id="matchMode">
          <option value="keywords">精準：只抓關鍵字命中</option>
          <option value="all-news">寬鬆：抓公告內頁</option>
        </select>
      </label>
      <button class="primary" id="runBtn">執行抓取</button>
      <button id="sqlBtn">產生 raw SQL</button>
      <div class="status" id="status">Ready</div>
    </div>
    <p class="note">這個控制台只寫入 scripts/crawler/output 的本機檔案；不寫入 Supabase、不呼叫 Gemini、不發布 opportunities。</p>
    <div class="summary" id="summary"></div>
    <div class="grid">
      <section>
        <h2>Raw announcements</h2>
        <div id="announcements"></div>
      </section>
      <section>
        <h2>Sources</h2>
        <div class="source-form">
          <label>來源代號
            <input id="sourceKey" placeholder="ntpu_example">
          </label>
          <label>來源名稱
            <input id="sourceName" placeholder="國立臺北大學某單位公告">
          </label>
          <label>每次最多
            <input id="sourceMaxItems" type="number" min="1" max="100" value="10">
          </label>
          <label>列表網址
            <input id="listUrl" placeholder="https://...">
          </label>
          <label>允許網址前綴
            <input id="allowedUrlPrefix" placeholder="https://new.ntpu.edu.tw/...">
          </label>
          <label>包含關鍵字，以逗號分隔
            <input id="includeKeywords" placeholder="競賽,獎學金,補助">
          </label>
          <label>排除關鍵字，以逗號分隔
            <input id="excludeKeywords" placeholder="徵才,招生">
          </label>
          <button id="addSourceBtn">新增來源</button>
        </div>
        <div id="sources"></div>
        <h2>Report / log</h2>
        <pre id="report"></pre>
      </section>
    </div>
  </main>
  <script>
    const statusEl = document.getElementById("status");
    const runBtn = document.getElementById("runBtn");
    const sqlBtn = document.getElementById("sqlBtn");
    const maxItems = document.getElementById("maxItems");
    const maxPages = document.getElementById("maxPages");
    const matchMode = document.getElementById("matchMode");
    const summary = document.getElementById("summary");
    const announcementsEl = document.getElementById("announcements");
    const sourcesEl = document.getElementById("sources");
    const reportEl = document.getElementById("report");

    function setBusy(value) {
      runBtn.disabled = value;
      sqlBtn.disabled = value;
      statusEl.textContent = value ? "Running..." : "Ready";
    }

    function render(state) {
      const data = state.announcements || [];
      const sources = state.report?.sources || [];
      const fetched = sources.reduce((sum, source) => sum + (source.fetchedItems || 0), 0);
      const failed = sources.reduce((sum, source) => sum + (source.failedItems?.length || 0), 0);
      summary.innerHTML = [
        ["raw 筆數", data.length],
        ["來源數", sources.length],
        ["抓取成功", fetched],
        ["SQL rows", state.sqlRows || 0],
      ].map(([label, value]) => '<div class="metric"><b>' + value + '</b><span>' + label + '</span></div>').join("");

      announcementsEl.innerHTML = '<table><thead><tr><th>#</th><th>日期</th><th>標題</th><th>關鍵字</th></tr></thead><tbody>' +
        data.map((item, index) => '<tr><td>' + (index + 1) + '</td><td>' + (item.postedDate || "") + '</td><td><a href="' + item.url + '" target="_blank" rel="noreferrer">' + item.title + '</a><br><small>' + item.sourceName + '</small></td><td>' + (item.matchedKeywords || []).map((tag) => '<span class="tag">' + tag + '</span>').join("") + '</td></tr>').join("") +
        '</tbody></table>';

      sourcesEl.innerHTML = '<table><thead><tr><th>代號</th><th>名稱</th><th>關鍵字</th></tr></thead><tbody>' +
        (state.sources || []).map((item) => '<tr><td>' + item.sourceKey + '</td><td>' + item.sourceName + '<br><small>' + (item.apiSite ? "API: " + item.apiSite + " / " + (item.apiTags || []).join(", ") : item.listUrl) + '</small></td><td>' + (item.includeKeywords || []).map((tag) => '<span class="tag">' + tag + '</span>').join("") + '</td></tr>').join("") +
        '</tbody></table>';

      reportEl.textContent = JSON.stringify({ report: state.report, lastLog: state.lastLog }, null, 2);
      statusEl.textContent = state.running ? "Running..." : "Ready";
    }

    async function refresh() {
      const response = await fetch("/api/state");
      render(await response.json());
    }

    async function postJson(url, body = {}) {
      setBusy(true);
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        const result = await response.json();
        if (!response.ok) alert(result.error || "操作失敗");
        render(result.state || await (await fetch("/api/state")).json());
      } finally {
        setBusy(false);
      }
    }

    runBtn.addEventListener("click", () => postJson("/api/crawl", {
      maxItems: Number(maxItems.value || 30),
      maxPages: Number(maxPages.value || 3),
      matchMode: matchMode.value,
    }));
    sqlBtn.addEventListener("click", () => postJson("/api/export-sql"));
    document.getElementById("addSourceBtn").addEventListener("click", () => postJson("/api/sources", {
      sourceKey: document.getElementById("sourceKey").value,
      sourceName: document.getElementById("sourceName").value,
      maxItems: Number(document.getElementById("sourceMaxItems").value || 10),
      listUrl: document.getElementById("listUrl").value,
      allowedUrlPrefix: document.getElementById("allowedUrlPrefix").value,
      includeKeywords: document.getElementById("includeKeywords").value,
      excludeKeywords: document.getElementById("excludeKeywords").value,
    }));
    refresh();
  </script>
</body>
</html>`;
}

const server = createServer(async (request, response) => {
  try {
    if (request.method === "GET" && request.url === "/") {
      sendHtml(response, pageHtml());
      return;
    }

    if (request.method === "GET" && request.url === "/api/state") {
      sendJson(response, 200, await getState());
      return;
    }

    if (request.method === "POST" && request.url === "/api/crawl") {
      await handleCrawl(request, response);
      return;
    }

    if (request.method === "POST" && request.url === "/api/export-sql") {
      await handleExportSql(response);
      return;
    }

    if (request.method === "POST" && request.url === "/api/sources") {
      await handleAddSource(request, response);
      return;
    }

    sendJson(response, 404, { error: "Not found" });
  } catch (error) {
    sendJson(response, 500, { error: String(error.message ?? error) });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Crawler console: http://${HOST}:${PORT}`);
  console.log("This tool writes local crawler output only; it does not write to Supabase.");
});
