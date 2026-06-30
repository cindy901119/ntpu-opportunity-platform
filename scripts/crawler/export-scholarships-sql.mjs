import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const INPUT_PATH = "scripts/crawler/output/sample-announcements.json";
const OUTPUT_PATH = "scripts/crawler/output/scholarship-opportunities.review.sql";
const TODAY = "2026-06-30";
const EXCLUDED_REVIEW_PATTERNS = [/赴日交換|交換獎學金|國際交流獎學金/];

const SUMMARY_OVERRIDES = new Map([
  [
    "114學年度第2學期清寒學生助學暨生活津貼補助",
    "提供清寒學生助學金或生活津貼，需檢附成績與清寒或低收入戶相關證明。",
  ],
  [
    "國立台北大學上洋國際交流獎學金",
    "補助本校優秀學生赴日交換、短期研習或實習，需準備自傳、外語能力與行程證明。",
  ],
  [
    "114-2國立臺北大學村騫希望獎助學金",
    "提供清寒或弱勢學生獎助，申請時需檢附成績、家庭經濟證明與推薦資料。",
  ],
  [
    "財團法人麗裕慈善基金會",
    "由各學院推薦具孝行、清寒或社會良善事蹟之學士班學生申請。",
  ],
  [
    "國立臺北大學三洋磁磚創辦人陳福吉董事長紀念獎學金",
    "提供具正式學籍且符合年級條件的學生申請，會參考家庭經濟狀況與學業表現。",
  ],
  [
    "臺北大學會計學系林志浩先生清寒獎學金",
    "限會計學系與統計學系學士班學生申請，需符合成績與清寒資格。",
  ],
  [
    "114學年度臺北大學何志欽校長資優暨育成獎學金",
    "提供學業表現優秀之學士班學生申請，清寒、弱勢或服務經歷可作為加分資料。",
  ],
  [
    "國立臺北大學114學年度「張平沼先生暨陳淑珠女士獎學金」",
    "提供本校具正式學籍學生申請，清寒或家庭重大變故者優先。",
  ],
  [
    "114-1國立臺北大學村騫希望獎助學金",
    "提供清寒或弱勢學生獎助，申請時需檢附成績、家庭經濟證明與推薦資料。",
  ],
  [
    "國立臺北大學校友-李厚高先生紀念獎學金",
    "限日間部學士班學生申請，需檢附清寒證明或導師書面證明。",
  ],
]);

function sqlString(value) {
  if (value === null || value === undefined || value === "") return "null";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlTextArray(values) {
  const unique = [...new Set((values ?? []).filter(Boolean))];
  if (!unique.length) return "array[]::text[]";
  return `array[${unique.map(sqlString).join(", ")}]::text[]`;
}

function sqlJson(value) {
  return `${sqlString(JSON.stringify(value ?? []))}::jsonb`;
}

function stableUuid(input) {
  const hash = createHash("sha256").update(input).digest("hex");
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `4${hash.slice(13, 16)}`,
    `${((Number.parseInt(hash.slice(16, 18), 16) & 0x3f) | 0x80).toString(16)}${hash.slice(18, 20)}`,
    hash.slice(20, 32),
  ].join("-");
}

function extractField(rawText, label) {
  const labels = [
    "來源",
    "標題",
    "網址",
    "學年度/學期",
    "編號",
    "生輔組受理截止日期",
    "學生自行辦理截止日期",
    "列表備註",
    "獎學金名稱",
    "附件下載",
    "申請對象",
    "申請資格",
    "應繳表件",
    "申請方式",
    "名 額",
    "金 額",
    "截止日期",
  ];
  const marker = `${label}：`;
  const start = rawText.indexOf(marker);
  if (start < 0) return "";
  const from = start + marker.length;
  let end = rawText.length;
  for (const otherLabel of labels) {
    if (otherLabel === label) continue;
    const index = rawText.indexOf(`${otherLabel}：`, from);
    if (index >= 0 && index < end) end = index;
  }
  return rawText.slice(from, end).trim();
}

function extractDeadline(rawText) {
  const explicit = extractField(rawText, "截止日期").match(/\d{4}-\d{2}-\d{2}/)?.[0];
  if (explicit) return explicit;
  return extractField(rawText, "生輔組受理截止日期").match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? null;
}

function extractAmount(rawText) {
  const value = extractField(rawText, "金 額");
  if (!value) return { prizeText: "獎學金金額依官方頁面與附件為準。", maxPrizeAmount: null };
  const numbers = [...value.matchAll(/([0-9,]+)\s*(萬)?\s*(?:元)?/g)].map((match) => {
    const base = Number.parseInt(match[1].replace(/,/g, ""), 10);
    return match[2] ? base * 10000 : base;
  });
  const maxPrizeAmount = numbers.length ? Math.max(...numbers) : null;
  return { prizeText: `獎學金 ${value}`, maxPrizeAmount };
}

function inferGradeLimit(text) {
  if (/大二以上|大2/.test(text)) return "大二以上";
  if (/大一新生|不含大一/.test(text)) return "大二以上";
  if (/學士班|大專|大學/.test(text) && /碩|博/.test(text)) return "學士班、碩士班；博士班依公告";
  if (/學士班/.test(text)) return "學士班";
  return "依官方公告";
}

function inferDepartmentLimit(text) {
  if (/會計系|會計學系|統計系|統計學系/.test(text)) return "會計學系、統計學系";
  if (/各院推薦|各學系|本校/.test(text)) return "不限";
  return "依官方公告";
}

function inferFirstStageDeliverables(docsText) {
  const values = [];
  if (/申請書|申請表/.test(docsText)) values.push("申請表");
  if (/成績單/.test(docsText)) values.push("成績單");
  if (/清寒|低收入|證明|所得/.test(docsText)) values.push("證明文件");
  if (/自傳/.test(docsText)) values.push("自傳");
  if (/推薦/.test(docsText)) values.push("推薦資料");
  return values.length ? values.slice(0, 4) : ["申請資料"];
}

function inferSubmissionTypes(deliverables) {
  const values = [];
  if (deliverables.some((item) => /申請/.test(item))) values.push("申請表");
  if (deliverables.some((item) => /成績|證明|推薦/.test(item))) values.push("證明文件");
  if (deliverables.some((item) => /自傳/.test(item))) values.push("短文");
  return values.length ? values : ["申請表", "證明文件"];
}

function inferTopicAndTags(text) {
  const categoryTags = ["校內獎學金"];
  if (/清寒|低收入|弱勢|家庭經濟/.test(text)) categoryTags.push("清寒助學");
  if (/交流|赴日|研習|實習|國際/.test(text)) categoryTags.push("國際交流");
  if (/資優|學業|成績/.test(text)) categoryTags.push("學業表現");
  if (/會計|統計/.test(text)) categoryTags.push("系所限定");
  return {
    topicAreas: categoryTags.includes("國際交流") ? ["語言／國際"] : ["不限／不適用"],
    categoryTags,
  };
}

function buildOpportunity(announcement) {
  const rawText = announcement.rawText ?? "";
  const sourceItemKey = `${announcement.sourceKey}:${announcement.url}`;
  const deadline = extractDeadline(rawText);
  const amount = extractAmount(rawText);
  const target = extractField(rawText, "申請對象");
  const qualification = extractField(rawText, "申請資格");
  const docs = extractField(rawText, "應繳表件");
  const applyMethod = extractField(rawText, "申請方式");
  const deliverables = inferFirstStageDeliverables(docs);
  const { topicAreas, categoryTags } = inferTopicAndTags(rawText);
  const summary = SUMMARY_OVERRIDES.get(announcement.title) ?? "校內獎學金申請資料，資格與附件請以官方頁面為準。";
  const isExpired = deadline ? deadline < TODAY : false;

  return {
    id: stableUuid(sourceItemKey),
    title: announcement.title,
    organizer: "國立臺北大學學務處生活輔導組",
    source_url: announcement.url,
    official_url: announcement.url,
    source_name: announcement.sourceName,
    source_type: announcement.sourceType,
    source_posted_date: null,
    source_fetched_at: announcement.fetchedAt,
    source_content_hash: announcement.contentHash,
    source_item_key: sourceItemKey,
    deadline,
    opportunity_type: "獎學金",
    topic_areas: topicAreas,
    category_tags: categoryTags,
    skill_tags: ["寫作"],
    submission_types: inferSubmissionTypes(deliverables),
    first_stage_deliverables: deliverables,
    eligibility_text: [target, qualification].filter(Boolean).join("；"),
    school_limit: "國立臺北大學",
    department_limit: inferDepartmentLimit(`${target} ${qualification}`),
    grade_limit: inferGradeLimit(`${target} ${qualification}`),
    prize_text: amount.prizeText,
    reward_types: ["獎金"],
    max_prize_amount: amount.maxPrizeAmount,
    summary,
    special_notes: [
      isExpired ? "此獎學金已截止，保留作為資料展示與流程測試。" : null,
      applyMethod ? `申請方式：${applyMethod}` : null,
      "附件與完整規則請以官方獎學金頁面為準。",
    ].filter(Boolean),
    participation_text: applyMethod || "依官方獎學金頁面辦理。",
    schedule: deadline ? [{ date: deadline, label: "申請截止" }] : [],
    judging_text: qualification || null,
    status: "published",
  };
}

function toSql(opportunities) {
  const columns = [
    "id",
    "title",
    "organizer",
    "source_url",
    "official_url",
    "source_name",
    "source_type",
    "source_posted_date",
    "source_fetched_at",
    "source_content_hash",
    "source_item_key",
    "deadline",
    "opportunity_type",
    "topic_areas",
    "category_tags",
    "skill_tags",
    "submission_types",
    "first_stage_deliverables",
    "eligibility_text",
    "school_limit",
    "department_limit",
    "grade_limit",
    "prize_text",
    "reward_types",
    "max_prize_amount",
    "summary",
    "special_notes",
    "participation_text",
    "schedule",
    "judging_text",
    "status",
  ];

  const rows = opportunities.map((item) => [
    sqlString(item.id),
    sqlString(item.title),
    sqlString(item.organizer),
    sqlString(item.source_url),
    sqlString(item.official_url),
    sqlString(item.source_name),
    sqlString(item.source_type),
    item.source_posted_date ? `${sqlString(item.source_posted_date)}::date` : "null",
    item.source_fetched_at ? `${sqlString(item.source_fetched_at)}::timestamptz` : "null",
    sqlString(item.source_content_hash),
    sqlString(item.source_item_key),
    item.deadline ? `${sqlString(item.deadline)}::date` : "null",
    sqlString(item.opportunity_type),
    sqlTextArray(item.topic_areas),
    sqlTextArray(item.category_tags),
    sqlTextArray(item.skill_tags),
    sqlTextArray(item.submission_types),
    sqlTextArray(item.first_stage_deliverables),
    sqlString(item.eligibility_text),
    sqlString(item.school_limit),
    sqlString(item.department_limit),
    sqlString(item.grade_limit),
    sqlString(item.prize_text),
    sqlTextArray(item.reward_types),
    item.max_prize_amount ?? "null",
    sqlString(item.summary),
    sqlTextArray(item.special_notes),
    sqlString(item.participation_text),
    sqlJson(item.schedule),
    sqlString(item.judging_text),
    sqlString(item.status),
  ]);

  return [
    "-- Generated from scripts/crawler/output/sample-announcements.json",
    "-- REVIEW BEFORE RUNNING: imports NTPU internal scholarship rows into public.competitions.",
    "-- These rows use opportunity_type = '獎學金' and official_url = the official NTPU scholarship detail page.",
    "",
    `insert into public.competitions (${columns.join(", ")}) values`,
    rows.map((row) => `  (${row.join(", ")})`).join(",\n"),
    "on conflict (source_item_key) where source_item_key is not null do update set",
    "  title = excluded.title,",
    "  organizer = excluded.organizer,",
    "  source_url = excluded.source_url,",
    "  official_url = excluded.official_url,",
    "  source_posted_date = excluded.source_posted_date,",
    "  source_fetched_at = excluded.source_fetched_at,",
    "  source_content_hash = excluded.source_content_hash,",
    "  deadline = excluded.deadline,",
    "  opportunity_type = excluded.opportunity_type,",
    "  topic_areas = excluded.topic_areas,",
    "  category_tags = excluded.category_tags,",
    "  skill_tags = excluded.skill_tags,",
    "  submission_types = excluded.submission_types,",
    "  first_stage_deliverables = excluded.first_stage_deliverables,",
    "  eligibility_text = excluded.eligibility_text,",
    "  school_limit = excluded.school_limit,",
    "  department_limit = excluded.department_limit,",
    "  grade_limit = excluded.grade_limit,",
    "  prize_text = excluded.prize_text,",
    "  reward_types = excluded.reward_types,",
    "  max_prize_amount = excluded.max_prize_amount,",
    "  summary = excluded.summary,",
    "  special_notes = excluded.special_notes,",
    "  participation_text = excluded.participation_text,",
    "  schedule = excluded.schedule,",
    "  judging_text = excluded.judging_text,",
    "  status = excluded.status,",
    "  updated_at = now();",
    "",
  ].join("\n");
}

async function main() {
  const inputUrl = new URL(`../../${INPUT_PATH}`, import.meta.url);
  const outputUrl = new URL(`../../${OUTPUT_PATH}`, import.meta.url);
  const inputPath = fileURLToPath(inputUrl);
  const outputPath = fileURLToPath(outputUrl);
  const announcements = JSON.parse(await readFile(inputPath, "utf8"));
  const scholarshipAnnouncements = announcements.filter((announcement) =>
    /獎學金|助學|生活津貼|補助/.test(`${announcement.title} ${announcement.rawText}`),
  );
  const publishableAnnouncements = scholarshipAnnouncements.filter(
    (announcement) => !EXCLUDED_REVIEW_PATTERNS.some((pattern) => pattern.test(`${announcement.title} ${announcement.rawText}`)),
  );
  const excludedAnnouncements = scholarshipAnnouncements.filter((announcement) =>
    EXCLUDED_REVIEW_PATTERNS.some((pattern) => pattern.test(`${announcement.title} ${announcement.rawText}`)),
  );
  const opportunities = publishableAnnouncements.map(buildOpportunity);

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, toSql(opportunities), "utf8");
  console.log(`Wrote ${opportunities.length} scholarship opportunities to ${OUTPUT_PATH}`);
  if (excludedAnnouncements.length) {
    console.log(
      `Skipped ${excludedAnnouncements.length} scholarship announcement(s) that match first-MVP review exclusions: ${excludedAnnouncements
        .map((announcement) => announcement.title)
        .join("、")}`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
