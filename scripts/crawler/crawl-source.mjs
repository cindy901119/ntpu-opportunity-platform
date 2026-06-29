import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const OUTPUT_PATH = "scripts/crawler/output/sample-announcements.json";
const REPORT_PATH = "scripts/crawler/output/crawler-report.json";
const TEXT_OUTPUT_DIR = "scripts/crawler/output/text";
const SOURCES_PATH = "scripts/crawler/sources.json";
const MANUAL_URLS_PATH = "scripts/crawler/manual-urls.txt";
const NTPU_PUBLICATION_API = "https://api-carrier.ntpu.edu.tw/strapi";

const DEFAULT_INCLUDE_KEYWORDS = [
  "競賽",
  "比賽",
  "獎學金",
  "獎助",
  "獎勵",
  "補助",
  "計畫",
  "申請",
  "徵件",
  "徵選",
  "提案",
  "報名",
  "國科會",
  "大賽",
  "選秀",
  "贊助",
  "培訓",
];

const DEFAULT_EXCLUDE_KEYWORDS = [
  "徵才",
  "停電",
  "招生",
  "入學",
  "錄取",
  "得獎名單",
  "親子音樂會",
  "成果發表會圓滿落幕",
  "交流成果",
];

const DEFAULT_SOURCES = [
  {
    sourceKey: "ntpu_osa_extracurricular",
    sourceName: "國立臺北大學學務處課外組公告",
    sourceType: "school_public_page",
    listUrl:
      "https://new.ntpu.edu.tw/osa/news?tag=%E8%AA%B2%E5%A4%96%E7%B5%84,%E8%AA%B2%E6%8C%87%E7%B5%84&title=%E8%AA%B2%E5%A4%96%E7%B5%84",
    allowedUrlPrefix: "https://new.ntpu.edu.tw/osa/news/",
    apiSite: "osa_ntpu",
    apiTags: ["課外組"],
    maxPages: 3,
    includeKeywords: DEFAULT_INCLUDE_KEYWORDS,
    excludeKeywords: DEFAULT_EXCLUDE_KEYWORDS,
    maxItems: 10,
  },
  {
    sourceKey: "ntpu_osa_life",
    sourceName: "國立臺北大學學務處生活輔導組",
    sourceType: "school_public_page",
    listUrl: "https://new.ntpu.edu.tw/osa/life",
    allowedUrlPrefix: "https://new.ntpu.edu.tw/osa/",
    includeKeywords: ["獎學金", "助學金", "急難", "補助", "獎助", "救助"],
    excludeKeywords: [...DEFAULT_EXCLUDE_KEYWORDS, "停車證", "汽車停車"],
    maxItems: 10,
  },
];

async function loadSources() {
  try {
    const sourcesPath = fileURLToPath(new URL(`../../${SOURCES_PATH}`, import.meta.url));
    const sources = JSON.parse(await readFile(sourcesPath, "utf8"));
    return Array.isArray(sources) && sources.length > 0 ? sources : DEFAULT_SOURCES;
  } catch {
    return DEFAULT_SOURCES;
  }
}

function readOptions(argv) {
  const options = {
    maxItems: null,
    maxPages: null,
    matchMode: "keywords",
    manualUrlsPath: null,
  };

  for (const arg of argv) {
    if (arg.startsWith("--max-items=")) {
      const value = Number(arg.slice("--max-items=".length));
      if (Number.isInteger(value) && value > 0 && value <= 100) {
        options.maxItems = value;
      }
    }

    if (arg.startsWith("--match=")) {
      const value = arg.slice("--match=".length);
      if (value === "keywords" || value === "all-news") {
        options.matchMode = value;
      }
    }

    if (arg.startsWith("--max-pages=")) {
      const value = Number(arg.slice("--max-pages=".length));
      if (Number.isInteger(value) && value > 0 && value <= 20) {
        options.maxPages = value;
      }
    }

    if (arg.startsWith("--manual-urls=")) {
      const value = arg.slice("--manual-urls=".length).trim();
      if (value) {
        options.manualUrlsPath = value;
      }
    }
  }

  return options;
}

async function loadManualUrlSource(pathFromRoot) {
  const manualUrl = new URL(`../../${pathFromRoot}`, import.meta.url);
  const text = await readFile(fileURLToPath(manualUrl), "utf8");
  const urls = Array.from(
    new Set(
      text
        .split(/\r?\n/)
        .map((line) => line.replace(/#.*/, "").trim())
        .filter(Boolean),
    ),
  );

  return {
    sourceKey: "manual_ntpu_bulletin_urls",
    sourceName: "人工篩選北大公告 URL",
    sourceType: "school_public_page",
    listUrl: pathFromRoot,
    allowedUrlPrefix: "https://bulletin.ntpu.edu.tw/",
    manualUrls: urls,
    includeKeywords: DEFAULT_INCLUDE_KEYWORDS,
    excludeKeywords: DEFAULT_EXCLUDE_KEYWORDS,
    maxItems: urls.length,
  };
}

function sourceWithOptions(source, options) {
  return {
    ...source,
    maxItems: options.maxItems ?? source.maxItems,
    maxPages: options.maxPages ?? source.maxPages ?? 1,
    matchMode: options.matchMode,
  };
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function decodeHtml(value) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, "/");
}

function stripHtml(html) {
  return normalizeWhitespace(
    decodeHtml(
      html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " "),
    ),
  );
}

function toAbsoluteUrl(url, baseUrl) {
  return new URL(decodeHtml(url), baseUrl).toString();
}

function toIsoDate(value) {
  if (!value) return null;
  const match = value.match(/(\d{4})\s*[/-]\s*(\d{1,2})\s*[/-]\s*(\d{1,2})/);
  if (!match) return null;
  const [, year, month, day] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function contentHashFor(rawText) {
  return createHash("sha256").update(rawText, "utf8").digest("hex");
}

function sourceItemKey(sourceKey, url) {
  return `${sourceKey}:${url}`;
}

function safeFileName(value) {
  return value
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function matchedKeywordsFor(title, source) {
  if (source.excludeKeywords.some((keyword) => title.includes(keyword))) return [];
  return source.includeKeywords.filter((keyword) => title.includes(keyword));
}

function escapeGraphqlString(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function publicationSlug(title, titleEn = "") {
  return `${title}${titleEn ?? ""}`.replace(/[\s/()]/g, "");
}

function publicationUrl(source, publication) {
  const base = source.detailBaseUrl ?? source.allowedUrlPrefix ?? source.listUrl;
  const prefix = base.endsWith("/") ? base : `${base}/`;
  return `${prefix}${publication._id}/${publicationSlug(publication.title ?? "", publication.title_en ?? "")}`;
}

function apiQueryFor(source, start, limit) {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  const includeTags = JSON.stringify(source.apiTags ?? []);
  const excludeTags = JSON.stringify(source.apiExcludeTags ?? []);
  const tagFilter = [
    includeTags !== "[]" ? `tags_contains: ${includeTags}` : "",
    excludeTags !== "[]" ? `tags_ncontains: ${excludeTags}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return `{
    publicationsConnection(
      where: {
        isEvent: false
        sitesApproved_in: "${escapeGraphqlString(source.apiSite)}"
        ${tagFilter}
        publishAt_lte: "${now.toISOString()}"
        unPublishAt_gte: "${now.toISOString()}"
      }
    ) {
      aggregate { count }
    }
    publications(
      sort: "publishAt:desc,createdAt:desc"
      start: ${start}
      limit: ${limit}
      where: {
        isEvent: false
        sitesApproved_in: "${escapeGraphqlString(source.apiSite)}"
        ${tagFilter}
        publishAt_lte: "${now.toISOString()}"
        unPublishAt_gte: "${now.toISOString()}"
      }
    ) {
      _id
      createdAt
      title
      title_en
      content
      content_en
      tags
      files { url name mime }
      publishAt
    }
  }`;
}

async function fetchApiPublications(source) {
  const limit = Math.min(50, Math.max(1, source.rowsPerPage ?? 10));
  const maxPages = Math.max(1, source.maxPages ?? 1);
  const maxItems = Math.max(1, source.maxItems ?? limit * maxPages);
  const items = [];
  let scannedItems = 0;
  let duplicateUrls = 0;
  let totalCount = null;
  const seenUrls = new Set();

  for (let page = 0; page < maxPages && items.length < maxItems; page += 1) {
    const start = page * limit;
    const response = await fetch(NTPU_PUBLICATION_API, {
      method: "POST",
      headers: { "content-type": "application/json;charset=UTF-8" },
      body: JSON.stringify({ query: apiQueryFor(source, start, limit) }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${NTPU_PUBLICATION_API}: ${response.status} ${response.statusText}`);
    }

    const payload = await response.json();
    if (payload.errors?.length) {
      throw new Error(payload.errors.map((error) => error.message).join("; "));
    }

    const publications = payload.data?.publications ?? [];
    totalCount = payload.data?.publicationsConnection?.aggregate?.count ?? totalCount;
    if (publications.length === 0) break;

    for (const publication of publications) {
      scannedItems += 1;
      const title = normalizeWhitespace(publication.title ?? "");
      const url = publicationUrl(source, publication);
      const matchedKeywords = matchedKeywordsFor(title, source);
      if (source.matchMode !== "all-news" && matchedKeywords.length === 0) continue;
      if (seenUrls.has(url)) {
        duplicateUrls += 1;
        continue;
      }
      seenUrls.add(url);
      items.push({
        title,
        url,
        postedDate: toIsoDate((publication.publishAt ?? "").slice(0, 10)),
        matchedKeywords,
        rawText: stripHtml(
          [
            title,
            publication.content ?? "",
            publication.files?.length
              ? `附件 ${publication.files.map((file) => [file.name, file.url].filter(Boolean).join(" ")).join(" ")}`
              : "",
          ].join(" "),
        ),
      });
      if (items.length >= maxItems) break;
    }

    if (totalCount !== null && start + limit >= totalCount) break;
  }

  return { items, scannedItems, duplicateUrls, totalCount };
}

function parseListItems(html, source) {
  const items = [];
  const seenUrls = new Set();
  const listItemPattern = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
  const linkPattern = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let scannedItems = 0;
  let duplicateUrls = 0;

  for (const match of html.matchAll(listItemPattern)) {
    const [, itemHtml] = match;
    const links = Array.from(itemHtml.matchAll(linkPattern)).map((linkMatch) => {
      const [, attrs, linkHtml] = linkMatch;
      const href = attrs.match(/\bhref=["']([^"']+)["']/i)?.[1] ?? "";
      const title = attrs.match(/\btitle=["']([^"']*)["']/i)?.[1] ?? "";
      return {
        href,
        title: normalizeWhitespace(decodeHtml(title)),
        text: stripHtml(linkHtml),
      };
    });
    const usableLink = links.find((link) => {
      const href = decodeHtml(link.href).trim();
      return href && !href.toLowerCase().startsWith("javascript:");
    });
    if (!usableLink) continue;
    scannedItems += 1;

    const dateMatch = itemHtml.match(/([0-9]{4}\s*[/-]\s*[0-9]{1,2}\s*[/-]\s*[0-9]{1,2})/);
    const titleSource =
      usableLink.title ||
      links.find((link) => link.text && !link.text.includes("在新分頁開啟公告全文"))?.text ||
      stripHtml(itemHtml.replace(dateMatch?.[0] ?? "", " "));
    const title = normalizeWhitespace(titleSource)
      .replace(/^在新分頁開啟公告全文\s*/u, "")
      .trim();
    const url = toAbsoluteUrl(usableLink.href, source.listUrl);

    if (!title || title.length < 4 || title.includes("GENERAL.") || title.includes("SYSTEM.")) {
      continue;
    }

    if (!url.includes("/news/")) continue;

    const matchedKeywords = matchedKeywordsFor(title, source);
    if (source.matchMode !== "all-news" && matchedKeywords.length === 0) continue;

    if (!url.startsWith(source.allowedUrlPrefix)) continue;

    if (seenUrls.has(url)) {
      duplicateUrls += 1;
      continue;
    }

    seenUrls.add(url);
    items.push({
      title,
      url,
      postedDate: toIsoDate(dateMatch?.[0] ?? null),
      matchedKeywords,
    });

    if (items.length >= source.maxItems) break;
  }

  return { items, scannedItems, duplicateUrls };
}

function inferTitleFromHtml(html, url) {
  const pageText = stripHtml(html);
  const bulletinTitle = pageText.match(/公告標題\s*(.+?)\s*公告內容/u)?.[1];
  const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  const h2 = html.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/i)?.[1];
  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const inferred = normalizeWhitespace(bulletinTitle ?? stripHtml(h1 ?? h2 ?? title ?? ""));
  return inferred
    .replace(/國立臺北大學\s*/g, "")
    .replace(/公告系統\s*/g, "")
    .replace(/^電子郵件公告\s*/g, "")
    .replace(/^\s*[-|｜]\s*/g, "")
    .trim() || url;
}

function inferPostedDateFromText(text) {
  return toIsoDate(text);
}

async function parseManualUrlItems(source) {
  const maxItems = Math.min(source.maxItems ?? source.manualUrls.length, source.manualUrls.length);
  const items = [];
  const failedItems = [];

  for (const url of source.manualUrls.slice(0, maxItems)) {
    try {
      const html = await fetchHtml(url);
      const rawText = extractMainText(html);
      const title = inferTitleFromHtml(html, url);
      const matchedKeywords = matchedKeywordsFor(`${title} ${rawText}`, source);
      if (source.matchMode !== "all-news" && matchedKeywords.length === 0) continue;

      items.push({
        title,
        url,
        postedDate: inferPostedDateFromText(rawText),
        matchedKeywords,
        rawText,
      });
    } catch (error) {
      failedItems.push({
        title: url,
        url,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    items,
    scannedItems: source.manualUrls.length,
    duplicateUrls: source.manualUrls.length - new Set(source.manualUrls).size,
    failedItems,
  };
}

function extractMainText(html) {
  const mainMatch = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  const articleMatch = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
  return stripHtml(articleMatch?.[1] ?? mainMatch?.[1] ?? html);
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "bonus-hunter-crawler-prototype/0.3",
      accept: "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

async function writeTextSnapshot(announcement) {
  const fileUrl = new URL(
    `../../${TEXT_OUTPUT_DIR}/${safeFileName(`${announcement.sourceKey}-${announcement.title}`)}.txt`,
    import.meta.url,
  );
  const filePath = fileURLToPath(fileUrl);
  const body = [
    `sourceKey: ${announcement.sourceKey}`,
    `sourceName: ${announcement.sourceName}`,
    `title: ${announcement.title}`,
    `url: ${announcement.url}`,
    `postedDate: ${announcement.postedDate ?? ""}`,
    `contentHash: ${announcement.contentHash}`,
    `matchedKeywords: ${announcement.matchedKeywords.join(", ")}`,
    "",
    announcement.rawText,
    "",
  ].join("\n");

  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, body, "utf8");
}

async function crawlSource(source, fetchedAt) {
  const parsed = source.manualUrls
    ? await parseManualUrlItems(source)
    : source.apiSite
      ? await fetchApiPublications(source)
      : parseListItems(await fetchHtml(source.listUrl), source);
  const announcements = [];
  const failedItems = [...(parsed.failedItems ?? [])];
  const seenUrls = new Set();

  for (const item of parsed.items) {
    if (seenUrls.has(item.url)) continue;
    seenUrls.add(item.url);

    try {
      const rawText = item.rawText ?? extractMainText(await fetchHtml(item.url));
      announcements.push({
        sourceKey: source.sourceKey,
        sourceName: source.sourceName,
        sourceType: source.sourceType,
        title: item.title,
        url: item.url,
        postedDate: item.postedDate,
        rawText,
        contentHash: contentHashFor(rawText),
        matchedKeywords: item.matchedKeywords,
        fetchedAt,
      });
    } catch (error) {
      failedItems.push({
        title: item.title,
        url: item.url,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    announcements,
    report: {
      sourceKey: source.sourceKey,
      sourceName: source.sourceName,
      listUrl: source.listUrl,
      pageSource: source.manualUrls ? "manual_url_list" : source.apiSite ? "ntpu_publication_api" : "html_list",
      maxPages: source.maxPages,
      totalCount: parsed.totalCount ?? undefined,
      scannedItems: parsed.scannedItems,
      matchedItems: parsed.items.length,
      fetchedItems: announcements.length,
      duplicateUrls: parsed.duplicateUrls,
      failedItems,
    },
  };
}

async function crawl() {
  const options = readOptions(process.argv.slice(2));
  const fetchedAt = new Date().toISOString();
  const sources = options.manualUrlsPath
    ? [await loadManualUrlSource(options.manualUrlsPath)]
    : await loadSources();
  const allAnnouncements = [];
  const sourceReports = [];
  const seenSourceItems = new Set();

  for (const baseSource of sources) {
    const source = sourceWithOptions(baseSource, options);
    const result = await crawlSource(source, fetchedAt);
    for (const announcement of result.announcements) {
      const key = sourceItemKey(announcement.sourceKey, announcement.url);
      if (seenSourceItems.has(key)) continue;
      seenSourceItems.add(key);
      allAnnouncements.push(announcement);
      await writeTextSnapshot(announcement);
    }
    sourceReports.push(result.report);
  }

  return {
    announcements: allAnnouncements,
    report: { fetchedAt, options, sources: sourceReports },
  };
}

async function main() {
  const outputUrl = new URL(`../../${OUTPUT_PATH}`, import.meta.url);
  const reportUrl = new URL(`../../${REPORT_PATH}`, import.meta.url);
  const outputPath = fileURLToPath(outputUrl);
  const reportPath = fileURLToPath(reportUrl);
  const { announcements, report } = await crawl();

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(announcements, null, 2)}\n`, "utf8");
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(`Wrote ${announcements.length} announcements to ${OUTPUT_PATH}`);
  console.log(`Wrote crawler report to ${REPORT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
