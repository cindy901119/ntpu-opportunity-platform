import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

type SourceConfig = {
  sourceKey: string;
  sourceName: string;
  sourceType: "school_public_page";
  listUrl: string;
  allowedUrlPrefix: string;
  includeKeywords: string[];
  excludeKeywords: string[];
  maxItems: number;
};

type Announcement = {
  sourceKey: string;
  sourceName: string;
  sourceType: string;
  title: string;
  url: string;
  postedDate: string | null;
  rawText: string;
  contentHash: string;
  matchedKeywords: string[];
  fetchedAt: string;
};

type CrawlerReport = {
  fetchedAt: string;
  sources: Array<{
    sourceKey: string;
    sourceName: string;
    listUrl: string;
    scannedItems: number;
    matchedItems: number;
    fetchedItems: number;
    duplicateUrls: number;
    failedItems: Array<{ title: string; url: string; error: string }>;
  }>;
};

type ListItem = {
  title: string;
  url: string;
  postedDate: string | null;
  matchedKeywords: string[];
};

const OUTPUT_PATH = "scripts/crawler/output/sample-announcements.json";
const REPORT_PATH = "scripts/crawler/output/crawler-report.json";
const TEXT_OUTPUT_DIR = "scripts/crawler/output/text";

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

const SOURCES: SourceConfig[] = [
  {
    sourceKey: "ntpu_osa_extracurricular",
    sourceName: "國立臺北大學學務處課外組公告",
    sourceType: "school_public_page",
    listUrl:
      "https://new.ntpu.edu.tw/osa/news?tag=%E8%AA%B2%E5%A4%96%E7%B5%84,%E8%AA%B2%E6%8C%87%E7%B5%84&title=%E8%AA%B2%E5%A4%96%E7%B5%84",
    allowedUrlPrefix: "https://new.ntpu.edu.tw/osa/news/",
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
    includeKeywords: ["獎學金", "助學金", "急難", "補助", "申請", "獎助"],
    excludeKeywords: DEFAULT_EXCLUDE_KEYWORDS,
    maxItems: 10,
  },
];

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, "/");
}

function stripHtml(html: string): string {
  return normalizeWhitespace(
    decodeHtml(
      html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " "),
    ),
  );
}

function toAbsoluteUrl(url: string, baseUrl: string): string {
  return new URL(decodeHtml(url), baseUrl).toString();
}

function toIsoDate(value: string | null): string | null {
  if (!value) return null;

  const match = value.match(/(\d{4})\s*[/-]\s*(\d{1,2})\s*[/-]\s*(\d{1,2})/);
  if (!match) return null;

  const [, year, month, day] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function contentHashFor(rawText: string): string {
  return createHash("sha256").update(rawText, "utf8").digest("hex");
}

function sourceItemKey(sourceKey: string, url: string): string {
  return `${sourceKey}:${url}`;
}

function safeFileName(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function matchedKeywordsFor(title: string, source: SourceConfig): string[] {
  if (source.excludeKeywords.some((keyword) => title.includes(keyword))) return [];
  return source.includeKeywords.filter((keyword) => title.includes(keyword));
}

function parseListItems(html: string, source: SourceConfig): { items: ListItem[]; scannedItems: number; duplicateUrls: number } {
  const items: ListItem[] = [];
  const seenUrls = new Set<string>();
  const listItemPattern = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
  let scannedItems = 0;
  let duplicateUrls = 0;

  for (const match of html.matchAll(listItemPattern)) {
    const [, itemHtml] = match;
    const hrefMatch = itemHtml.match(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/i);
    if (!hrefMatch) continue;

    scannedItems += 1;
    const dateMatch = itemHtml.match(/([0-9]{4}\s*[/-]\s*[0-9]{1,2}\s*[/-]\s*[0-9]{1,2})/);
    const title = stripHtml(
      itemHtml
        .replace(/<a\b[\s\S]*?<\/a>/gi, " ")
        .replace(dateMatch?.[0] ?? "", " "),
    )
      .replace(/^在新分頁開啟公告全文\s*/u, "")
      .trim();

    if (!title || title.length < 4 || title.includes("GENERAL.") || title.includes("SYSTEM.")) {
      continue;
    }

    const matchedKeywords = matchedKeywordsFor(title, source);
    if (matchedKeywords.length === 0) continue;

    const [, href] = hrefMatch;
    const url = toAbsoluteUrl(href, source.listUrl);
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

function extractMainText(html: string): string {
  const mainMatch = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  const articleMatch = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
  return stripHtml(articleMatch?.[1] ?? mainMatch?.[1] ?? html);
}

async function fetchHtml(url: string): Promise<string> {
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

async function writeTextSnapshot(announcement: Announcement): Promise<void> {
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

async function crawlSource(source: SourceConfig, fetchedAt: string): Promise<{ announcements: Announcement[]; report: CrawlerReport["sources"][number] }> {
  const listHtml = await fetchHtml(source.listUrl);
  const parsed = parseListItems(listHtml, source);
  const announcements: Announcement[] = [];
  const failedItems: Array<{ title: string; url: string; error: string }> = [];
  const seenUrls = new Set<string>();

  for (const item of parsed.items) {
    if (seenUrls.has(item.url)) continue;
    seenUrls.add(item.url);

    try {
      const detailHtml = await fetchHtml(item.url);
      const rawText = extractMainText(detailHtml);

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
      scannedItems: parsed.scannedItems,
      matchedItems: parsed.items.length,
      fetchedItems: announcements.length,
      duplicateUrls: parsed.duplicateUrls,
      failedItems,
    },
  };
}

async function crawl(): Promise<{ announcements: Announcement[]; report: CrawlerReport }> {
  const fetchedAt = new Date().toISOString();
  const allAnnouncements: Announcement[] = [];
  const sourceReports: CrawlerReport["sources"] = [];
  const seenSourceItems = new Set<string>();

  for (const source of SOURCES) {
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
    report: {
      fetchedAt,
      sources: sourceReports,
    },
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
