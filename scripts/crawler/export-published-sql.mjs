import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const INPUT_PATH = "scripts/crawler/output/sample-announcements.json";
const OUTPUT_PATH = "scripts/crawler/output/published-opportunities.review.sql";

const EXCLUDED_PATTERNS = [
  /講座|工作坊|實習|職缺|打工|海外交換/,
  /課程|招生名額|上課|全勤|保證金/,
  /急難|救助|文化推廣|青年推廣文化計畫/,
  /草案預告|修正意見|推薦表|評審推薦|指定曲/,
];

const ALLOWED_SPECIAL_CASES = [
  /獎助外國學生短期研習本土語言\s*計畫/,
];

const TOPIC_RULES = [
  { pattern: /AI|人工智慧|科技|程式|數位|短影音|影片|海洋保育/, areas: ["科技／程式"], tags: ["科技"] },
  { pattern: /設計|圖案|創作|影像|影片|短影音|文化|戲劇/, areas: ["設計／創作"], tags: ["設計／創作"] },
  { pattern: /青年|公益|社會|永續|保育|文化推廣|急難|救助/, areas: ["社會／永續"], tags: ["公共議題"] },
  { pattern: /創業|提案|企劃|行動/, areas: ["商業／企劃"], tags: ["企劃"] },
];

const SKILL_RULES = [
  { pattern: /企劃|方案|計畫|行動/, value: "企劃" },
  { pattern: /簡報|決賽|發表/, value: "簡報" },
  { pattern: /影片|短影音|影像|剪輯|Vlog/, value: "影片剪輯" },
  { pattern: /設計|圖案|創作/, value: "設計" },
  { pattern: /資料|數位/, value: "資料分析" },
  { pattern: /申請|說明|書面|切結書/, value: "寫作" },
];

const SUBMISSION_RULES = [
  { pattern: /申請書|申請表|報名表|報名資料/, value: "申請表" },
  { pattern: /證明|切結書|同意書|授權書|學生證|在學/, value: "證明文件" },
  { pattern: /企劃書|計畫書|方案|行動規劃/, value: "企劃書" },
  { pattern: /簡報/, value: "簡報" },
  { pattern: /影片|短影音|mp4|mpeg|avi|作品/, value: "影片" },
  { pattern: /作品集|作品檔案|圖案作品/, value: "作品集" },
];

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

function sourceItemKey(announcement) {
  return `${announcement.sourceKey}:${announcement.url}`;
}

function stableUuid(input) {
  const hex = createHash("sha1").update(input).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function cleanTitle(title) {
  return title
    .replace(/^【轉知】/, "")
    .replace(/競賽簡章$/, "競賽")
    .replace(/於115年.*啟動$/, "")
    .trim();
}

function rocDateToIso(yearText, monthText, dayText) {
  const year = Number(yearText) > 1911 ? Number(yearText) : Number(yearText) + 1911;
  return `${year}-${String(monthText).padStart(2, "0")}-${String(dayText).padStart(2, "0")}`;
}

function inferDeadline(rawText, postedDate) {
  const text = rawText.replace(/\s+/g, "");
  const full = text.match(/(?:至|截止|止|報名至|收件日期：即日起至)(?:民國)?(\d{3})年(\d{1,2})月(\d{1,2})日/);
  if (full) return rocDateToIso(full[1], full[2], full[3]);

  const md = text.match(/(?:至|截止|報名至)(\d{1,2})月(\d{1,2})日/);
  if (md) {
    const year = postedDate ? postedDate.slice(0, 4) : String(new Date().getFullYear());
    return `${year}-${String(md[1]).padStart(2, "0")}-${String(md[2]).padStart(2, "0")}`;
  }

  return null;
}

function inferOrganizer(rawText, sourceName) {
  const known = rawText.match(/(彰化縣政府|嘉義縣政府|嘉義市政府|新北市政府|新北市政府文化局|海洋保育署|崑山科技大學|財團法人感恩聖仁社會福利慈善基金會)/);
  if (known) return known[1];

  const match = rawText.match(/(?:主辦單位|主辦機關)：?\s*([^。；\n]+?)(?:承辦|協辦|辦理|SYSTEM|$)/);
  if (match) {
    const value = match[1].trim().replace(/\s+/g, "");
    if (value.length <= 24 && !/邀請|報名|評審|詳見/.test(value)) return value;
  }

  const gov = rawText.match(/([\u4e00-\u9fa5]{2,12}(?:縣政府|市政府|署|局|基金會|協會))/);
  return gov ? gov[1] : sourceName;
}

function inferOfficialUrl(rawText, fallbackUrl) {
  const urls = [...rawText.matchAll(/https?:\/\/[^\s，,。)）]+/g)]
    .map((match) => match[0].replace(/[)\]）】。.,，]+$/g, ""))
    .filter(Boolean);
  const external = urls.find((url) => !/ntpu\.edu\.tw|gm\.ntpu\.edu\.tw/.test(url));
  return external ?? fallbackUrl;
}

function inferOpportunityType(title, rawText) {
  const text = `${title} ${rawText}`;
  if (/急難|救助|補助|計畫/.test(text) && !/競賽|大賽|徵選/.test(text)) return "補助／計畫";
  if (/獎學金/.test(text)) return "獎學金";
  if (/競賽|大賽|徵選|徵件|創作獎/.test(text)) return "比賽";
  return "其他";
}

function inferTopic(rawText) {
  const areas = [];
  const tags = [];
  for (const rule of TOPIC_RULES) {
    if (rule.pattern.test(rawText)) {
      areas.push(...rule.areas);
      tags.push(...rule.tags);
    }
  }
  return {
    topicAreas: areas.length ? [...new Set(areas)].slice(0, 3) : ["其他"],
    topicTags: tags.length ? [...new Set(tags)].slice(0, 4) : ["其他"],
  };
}

function inferList(rawText, rules, fallback) {
  const values = rules.filter((rule) => rule.pattern.test(rawText)).map((rule) => rule.value);
  return values.length ? [...new Set(values)].slice(0, 5) : fallback;
}

function inferPrize(rawText) {
  const matches = [...rawText.matchAll(/(?:新台幣|新臺幣)?\s*([0-9,]+|[一二三四五六七八九十百萬]+)\s*萬?元/g)];
  const amounts = matches
    .map((match) => {
      const value = match[1].replace(/,/g, "");
      if (/^\d+$/.test(value)) {
        return /萬元/.test(match[0]) ? Number(value) * 10000 : Number(value);
      }
      const chineseMap = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
      const first = chineseMap[value[0]];
      return first ? first * 10000 : 0;
    })
    .filter((amount) => amount > 0);
  const max = amounts.length ? Math.max(...amounts) : undefined;

  if (/免費|保證金|無獎金/.test(rawText)) {
    return { prizeText: "無明確獎勵", rewardTypes: ["無明確獎勵"], maxPrizeAmount: undefined };
  }

  if (max) {
    return { prizeText: `最高獎金 ${max.toLocaleString("zh-TW")} 元`, rewardTypes: ["獎金"], maxPrizeAmount: max };
  }

  if (/獎座|獎品|獎勵/.test(rawText)) {
    return { prizeText: "獎勵內容待確認", rewardTypes: ["未寫清楚"], maxPrizeAmount: undefined };
  }

  return { prizeText: "未寫清楚", rewardTypes: ["未寫清楚"], maxPrizeAmount: undefined };
}

function inferEligibility(rawText) {
  if (/外國學生|外國學位生|交換生|選讀生/.test(rawText)) {
    return "以外國學生、外國學位生、交換生或選讀生等特定身分為主，報名前請確認官方簡章。";
  }

  if (/大專|大學|研究生|在學學生|青年/.test(rawText)) return "大專院校學生或青年可參加，詳細資格請確認官方簡章。";
  if (/身分不拘|不限國籍/.test(rawText)) return "身分不拘，詳細資格請確認官方簡章。";
  return "官方公告未完整列明資格，報名前請確認官方簡章。";
}

function inferSchoolLimit(rawText) {
  if (/外國學生|外國學位生|交換生|選讀生/.test(rawText)) return "需確認";
  if (/北大|國立臺北大學/.test(rawText)) return "國立臺北大學";
  if (/大專|大學|研究生|在學學生/.test(rawText)) return "大專院校";
  if (/身分不拘|不限國籍/.test(rawText)) return "不限";
  return "需確認";
}

function inferSummary(rawText) {
  const contentText = rawText.match(/公告內容\s*(.+?)(?:\s*附件\s*附件\d+：|$)/u)?.[1] ?? rawText;
  const cleaned = contentText
    .replace(/^(主旨|說明|一、|二、|三、|四、)\s*[:：]?/u, "")
    .replace(/檢送.*?(相關資訊|競賽簡章|活動資訊).*?(請查照|說明[:：]?)/u, "")
    .replace(/:::|SYSTEM\.[A-Z.]+|訊息|GENERAL|學生事務處/g, "")
    .replace(/國立臺北大學|電子郵件公告|English Version|公告日期.*?公告標題/gu, "")
    .replace(/^[/.\s]+/, "")
    .replace(/\s+/g, " ")
    .trim();
  const sentence = cleaned
    .split(/[。；]/)
    .map((part) => part.trim())
    .find((part) => part.length >= 24 && !/^主旨|^說明|請查照/.test(part)) ?? cleaned;
  return sentence.replace(/^[/.\s,，。；:：]+/, "").slice(0, 90);
}

function toOpportunity(announcement) {
  const text = announcement.rawText ?? "";
  const isAllowedSpecialCase = ALLOWED_SPECIAL_CASES.some((pattern) => pattern.test(`${announcement.title} ${text}`));
  if (!isAllowedSpecialCase && EXCLUDED_PATTERNS.some((pattern) => pattern.test(text))) {
    return null;
  }

  const key = sourceItemKey(announcement);
  const deadline = inferDeadline(text, announcement.postedDate);
  const { topicAreas, topicTags } = inferTopic(`${announcement.title} ${text}`);
  const { prizeText, rewardTypes, maxPrizeAmount } = inferPrize(text);
  const submissionTypes = inferList(text, SUBMISSION_RULES, ["依官方簡章"]);
  const firstStageDeliverables = submissionTypes.includes("影片")
    ? ["影片作品", "報名資料"]
    : submissionTypes.includes("企劃書")
      ? ["企劃書", "報名資料"]
      : submissionTypes.includes("申請表")
        ? ["申請資料"]
        : ["依官方簡章"];

  return {
    id: stableUuid(key),
    title: cleanTitle(announcement.title),
    organizer: inferOrganizer(text, announcement.sourceName),
    source_url: announcement.url,
    official_url: inferOfficialUrl(text, announcement.url),
    source_name: announcement.sourceName,
    source_type: announcement.sourceType,
    source_posted_date: announcement.postedDate,
    source_fetched_at: announcement.fetchedAt,
    source_content_hash: announcement.contentHash,
    source_item_key: key,
    deadline,
    opportunity_type: inferOpportunityType(announcement.title, text),
    topic_areas: topicAreas,
    category_tags: topicTags,
    skill_tags: inferList(text, SKILL_RULES, ["企劃"]),
    submission_types: submissionTypes,
    first_stage_deliverables: firstStageDeliverables,
    eligibility_text: inferEligibility(text),
    school_limit: inferSchoolLimit(text),
    department_limit: "不限",
    grade_limit: "大一、大二、大三、大四、碩一、碩二",
    prize_text: prizeText,
    reward_types: rewardTypes,
    max_prize_amount: maxPrizeAmount,
    summary: inferSummary(text),
    special_notes: ["此筆由爬蟲結果轉為發布草稿，請人工確認截止日、資格與獎金。"],
    participation_text: /團隊/.test(text) ? "個人或團隊，依官方簡章" : "依官方簡章",
    schedule: deadline ? [{ date: `${Number(deadline.slice(5, 7))}/${Number(deadline.slice(8, 10))}`, label: "報名截止" }] : [],
    judging_text: /評分|評審/.test(text) ? "評分方式請確認官方簡章。" : null,
    status: "published",
  };
}

function toInsertSql(opportunities) {
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
    "-- REVIEW BEFORE RUNNING: this file publishes reviewed crawler-derived rows to public.competitions.",
    "-- It intentionally excludes likely courses/workshops/jobs/exchanges from the first MVP scope.",
    "",
    "-- Optional: remove old example.com demo rows before replacing sample data.",
    "delete from public.competitions where source_url like 'https://example.com/%';",
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
  const inputPath = fileURLToPath(new URL(`../../${INPUT_PATH}`, import.meta.url));
  const outputPath = fileURLToPath(new URL(`../../${OUTPUT_PATH}`, import.meta.url));
  const announcements = JSON.parse(await readFile(inputPath, "utf8"));
  const opportunities = announcements.map(toOpportunity).filter(Boolean);
  const sql = toInsertSql(opportunities);

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, sql, "utf8");
  console.log(`Wrote ${opportunities.length} reviewed-publish SQL rows to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
