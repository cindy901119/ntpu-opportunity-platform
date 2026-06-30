import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE = {
  sourceKey: "ntpu_scholarship_internal",
  sourceName: "國立臺北大學校內獎學金",
  sourceType: "school_public_scholarship_page",
  listUrl: "https://webap.ntpu.edu.tw/scholarship/scholarship.php?class_id=4",
  allowedUrlPrefix: "https://webap.ntpu.edu.tw/scholarship/",
};

const OUTPUT_PATH = "scripts/crawler/output/sample-announcements.json";
const REPORT_PATH = "scripts/crawler/output/crawler-report.json";
const TEXT_OUTPUT_DIR = "scripts/crawler/output/text";

function readOptions(argv) {
  const options = { maxItems: 30 };
  for (const arg of argv) {
    if (arg.startsWith("--max-items=")) {
      const value = Number(arg.slice("--max-items=".length));
      if (Number.isInteger(value) && value > 0 && value <= 100) {
        options.maxItems = value;
      }
    }
  }
  return options;
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
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, " "),
    ),
  );
}

function toAbsoluteUrl(url, baseUrl) {
  return new URL(decodeHtml(url), baseUrl).toString();
}

function contentHashFor(rawText) {
  return createHash("sha256").update(rawText, "utf8").digest("hex");
}

function safeFileName(value) {
  return value
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "bonus-hunter-crawler-scholarship-prototype/0.1",
      accept: "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

function parseListRows(html, maxItems) {
  const rows = [];
  const rowPattern = /<tr\b[^>]*class=["']g1["'][^>]*>([\s\S]*?)<\/tr>/gi;

  for (const match of html.matchAll(rowPattern)) {
    const rowHtml = match[1];
    const cells = Array.from(rowHtml.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)).map((cell) => cell[1]);
    if (cells.length < 6) continue;

    const linkMatch = cells[2].match(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
    if (!linkMatch) continue;

    const url = toAbsoluteUrl(linkMatch[1], SOURCE.listUrl);
    if (!url.startsWith(SOURCE.allowedUrlPrefix)) continue;

    rows.push({
      academicTerm: stripHtml(cells[0]),
      code: stripHtml(cells[1]),
      title: stripHtml(linkMatch[2]),
      url,
      officeDeadline: stripHtml(cells[3]) || null,
      selfDeadline: stripHtml(cells[4]) || null,
      note: stripHtml(cells[5]),
    });

    if (rows.length >= maxItems) break;
  }

  return rows;
}

function parseDetailRows(html) {
  const rows = [];
  const rowPattern = /<tr\b[^>]*class=["']g1["'][^>]*>([\s\S]*?)<\/tr>/gi;

  for (const match of html.matchAll(rowPattern)) {
    const cells = Array.from(match[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)).map((cell) => cell[1]);
    if (cells.length < 2) continue;

    const label = stripHtml(cells[0]);
    if (!label || label.includes("獲獎人學號")) continue;

    const attachmentLinks = Array.from(cells[1].matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)).map(
      (link) => `${stripHtml(link[2])}: ${toAbsoluteUrl(link[1], SOURCE.listUrl)}`,
    );
    const value = stripHtml(cells[1]);
    const normalizedValue = attachmentLinks.length > 0 ? `${value} ${attachmentLinks.join(" ")}` : value;

    if (normalizedValue) rows.push({ label, value: normalizedValue });
  }

  return rows;
}

function rawTextFor(item, detailRows) {
  const lines = [
    `來源：${SOURCE.sourceName}`,
    `標題：${item.title}`,
    `網址：${item.url}`,
    `學年度/學期：${item.academicTerm}`,
    `編號：${item.code}`,
    `生輔組受理截止日期：${item.officeDeadline ?? ""}`,
    `學生自行辦理截止日期：${item.selfDeadline ?? ""}`,
    `列表備註：${item.note}`,
    "",
    ...detailRows.map((row) => `${row.label}：${row.value}`),
  ];

  return normalizeWhitespace(lines.join("\n"));
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

async function crawl() {
  const options = readOptions(process.argv.slice(2));
  const fetchedAt = new Date().toISOString();
  const listHtml = await fetchHtml(SOURCE.listUrl);
  const items = parseListRows(listHtml, options.maxItems);
  const announcements = [];
  const failedItems = [];

  for (const item of items) {
    try {
      const detailHtml = await fetchHtml(item.url);
      const detailRows = parseDetailRows(detailHtml);
      const rawText = rawTextFor(item, detailRows);
      const announcement = {
        sourceKey: SOURCE.sourceKey,
        sourceName: SOURCE.sourceName,
        sourceType: SOURCE.sourceType,
        title: item.title,
        url: item.url,
        postedDate: null,
        rawText,
        contentHash: contentHashFor(rawText),
        matchedKeywords: ["獎學金", "補助", "校內獎學金"],
        fetchedAt,
      };
      announcements.push(announcement);
      await writeTextSnapshot(announcement);
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
      fetchedAt,
      options,
      sources: [
        {
          sourceKey: SOURCE.sourceKey,
          sourceName: SOURCE.sourceName,
          listUrl: SOURCE.listUrl,
          scannedItems: items.length,
          matchedItems: items.length,
          fetchedItems: announcements.length,
          duplicateUrls: 0,
          failedItems,
          notes: "Detail parser removes the awarded-student-id row before writing rawText.",
        },
      ],
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

  console.log(`Wrote ${announcements.length} scholarship announcements to ${OUTPUT_PATH}`);
  console.log(`Wrote crawler report to ${REPORT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
