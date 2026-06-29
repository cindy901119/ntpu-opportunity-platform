import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const INPUT_PATH = "scripts/crawler/output/sample-announcements.json";
const OUTPUT_PATH = "scripts/crawler/output/raw-announcements.sql";

function sqlString(value) {
  if (value === null || value === undefined) return "null";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlDate(value) {
  return value ? `${sqlString(value)}::date` : "null";
}

function sqlTimestamp(value) {
  return `${sqlString(value)}::timestamptz`;
}

function sqlTextArray(values) {
  if (!values || values.length === 0) return "array[]::text[]";
  return `array[${values.map(sqlString).join(", ")}]::text[]`;
}

function sourceItemKey(announcement) {
  return `${announcement.sourceKey}:${announcement.url}`;
}

function toInsertSql(announcements) {
  const rows = announcements.map((announcement) => {
    return [
      sqlString(announcement.sourceKey),
      sqlString(announcement.sourceName),
      sqlString(announcement.sourceType),
      sqlString(announcement.url),
      sqlString(sourceItemKey(announcement)),
      sqlString(announcement.title),
      sqlDate(announcement.postedDate),
      sqlTimestamp(announcement.fetchedAt),
      sqlString(announcement.contentHash),
      sqlString(announcement.rawText),
      sqlTextArray(announcement.matchedKeywords),
      sqlString("possible_opportunity"),
    ].join(", ");
  });

  return [
    "-- Generated from scripts/crawler/output/sample-announcements.json",
    "-- C0.4 handoff draft: review before running in Supabase.",
    "-- This inserts raw public announcements only; it does not publish competitions.",
    "",
    "insert into public.raw_announcements (",
    "  source_key,",
    "  source_name,",
    "  source_type,",
    "  source_url,",
    "  source_item_key,",
    "  source_title,",
    "  source_posted_date,",
    "  source_fetched_at,",
    "  source_content_hash,",
    "  raw_text,",
    "  detected_keywords,",
    "  status",
    ") values",
    rows.map((row) => `  (${row})`).join(",\n"),
    "on conflict (source_item_key) do update set",
    "  source_title = excluded.source_title,",
    "  source_posted_date = excluded.source_posted_date,",
    "  source_fetched_at = excluded.source_fetched_at,",
    "  source_content_hash = excluded.source_content_hash,",
    "  raw_text = excluded.raw_text,",
    "  detected_keywords = excluded.detected_keywords,",
    "  status = case",
    "    when public.raw_announcements.source_content_hash is distinct from excluded.source_content_hash then 'needs_review'",
    "    else public.raw_announcements.status",
    "  end,",
    "  updated_at = now();",
    "",
  ].join("\n");
}

async function main() {
  const inputPath = fileURLToPath(new URL(`../../${INPUT_PATH}`, import.meta.url));
  const outputPath = fileURLToPath(new URL(`../../${OUTPUT_PATH}`, import.meta.url));
  const announcements = JSON.parse(await readFile(inputPath, "utf8"));
  const sql = toInsertSql(announcements);

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, sql, "utf8");
  console.log(`Wrote ${announcements.length} raw announcement rows to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
