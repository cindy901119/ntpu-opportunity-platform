import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const OUTPUT_PATH = "scripts/crawler/output/department-scholarship-opportunities.review.sql";
const FETCHED_AT = "2026-06-30T00:00:00+08:00";

const RECORDS = [
  {
    title: "陳劉月英女士紀念清寒助學金",
    organizer: "國立臺北大學歷史學系",
    source_url: "https://history.ntpu.edu.tw/?p=10007",
    official_url: "https://history.ntpu.edu.tw/?p=10007",
    deadline: "2025-11-10",
    department_limit: "歷史學系",
    grade_limit: "依官方公告",
    eligibility_text: "歷史學系清寒助學金申請；詳細資格與文件請以歷史系公告及資料下載頁為準。",
    prize_text: "最高 10,000 元",
    max_prize_amount: 10000,
    summary: "歷史系清寒助學金，提供每學期2名、每名10,000元為原則的助學支持。",
    first_stage_deliverables: ["申請資料", "證明文件"],
    submission_types: ["申請表", "證明文件"],
    category_tags: ["系所獎學金", "清寒助學"],
    special_notes: ["每學期2名為原則。", "本筆為年度公告，後續年度需確認當期收件期限。"],
    schedule: [{ date: "2025-11-10", label: "申請截止" }],
    status: "needs_review",
  },
  {
    title: "G-Top獎學金",
    organizer: "國立臺北大學統計學系",
    source_url: "https://www.stat.ntpu.edu.tw/page.php?id=147&ids=1",
    official_url: "https://www.stat.ntpu.edu.tw/page.php?id=147&ids=1",
    deadline: null,
    department_limit: "統計學系",
    grade_limit: "大二以上",
    eligibility_text: "統計學系二年級含以上學生，日間部及進修部均可申請；實際申請日期依系上公告。",
    prize_text: "最高 50,000 元",
    max_prize_amount: 50000,
    summary: "統計系系友提供的獎學金，每年至多1名，申請時需準備讀書計畫、自傳、成績單與必要證明。",
    first_stage_deliverables: ["基本資料表", "讀書計畫", "自傳", "成績單", "證明文件"],
    submission_types: ["申請表", "短文", "證明文件"],
    category_tags: ["系所獎學金", "學業表現"],
    special_notes: ["每年至多1名。", "申請日期為每年三月初，實際日期需確認系上公告。"],
    schedule: [],
    status: "needs_review",
  },
  {
    title: "統計學系清寒獎學金",
    organizer: "國立臺北大學統計學系",
    source_url: "https://www.stat.ntpu.edu.tw/page.php?id=147&ids=1",
    official_url: "https://www.stat.ntpu.edu.tw/page.php?id=147&ids=1",
    deadline: null,
    department_limit: "統計學系",
    grade_limit: "大學部各年級",
    eligibility_text: "統計學系大學部各年級學生可申請；實際申請日期依系上公告。",
    prize_text: "最高 10,000 元",
    max_prize_amount: 10000,
    summary: "統計系清寒獎學金，每學期開學後開放申請，需繳交申請表與前一學期成績單。",
    first_stage_deliverables: ["申請表", "成績單"],
    submission_types: ["申請表", "證明文件"],
    category_tags: ["系所獎學金", "清寒助學"],
    special_notes: ["每學期若干名。", "實際申請日期需確認系上公告；頁面包含歷屆獲獎紀錄，匯入時只保留申請規則。"],
    schedule: [],
    status: "needs_review",
  },
  {
    title: "統計學系城市綠洲獎學金",
    organizer: "國立臺北大學統計學系",
    source_url: "https://www.stat.ntpu.edu.tw/page.php?id=147&ids=1",
    official_url: "https://www.stat.ntpu.edu.tw/page.php?id=147&ids=1",
    deadline: null,
    department_limit: "統計學系",
    grade_limit: "大學部、碩士班",
    eligibility_text: "統計學系大學部與碩士班各年級優秀學生可申請；實際申請日期依系上公告。",
    prize_text: "最高 20,000 元",
    max_prize_amount: 20000,
    summary: "統計系系友提供的獎學金，鼓勵大學部與碩士班優秀學生規劃學習與未來發展。",
    first_stage_deliverables: ["基本資料表", "人生規劃", "自傳", "成績單", "證明文件"],
    submission_types: ["申請表", "短文", "證明文件"],
    category_tags: ["系所獎學金", "學業表現"],
    special_notes: ["每年至多6名。", "申請日期為每年三月初，實際日期需確認系上公告。"],
    schedule: [],
    status: "needs_review",
  },
  {
    title: "英荃獎學金",
    organizer: "國立臺北大學公共行政暨政策學系",
    source_url: "https://pa.ntpu.edu.tw/news_detail?id=40",
    official_url: "https://pa.ntpu.edu.tw/news_detail?id=40",
    deadline: "2025-10-03",
    department_limit: "公共行政暨政策學系；其他公共行政相關系所依公告",
    grade_limit: "大四、碩二以上、博士班二年級以上",
    eligibility_text: "申請學生以應屆畢業生，且在學學業總平均成績為全系、所第一名者優先；操行成績每學期須超過80分。",
    prize_text: "最高 20,000 元",
    max_prize_amount: 20000,
    summary: "公共行政暨政策學系獎學金，優先鼓勵成績優秀的應屆畢業學生申請。",
    first_stage_deliverables: ["申請須知", "申請表", "推薦信", "系所審查資料"],
    submission_types: ["申請表", "證明文件"],
    category_tags: ["系所獎學金", "學業表現"],
    special_notes: ["名額共8至10名。", "本筆為年度公告，後續年度需確認當期收件期限。"],
    schedule: [{ date: "2025-10-03", label: "申請截止" }],
    status: "needs_review",
  },
  {
    title: "法律學系助學圓夢清寒優秀學生獎學金",
    organizer: "國立臺北大學法律學系",
    source_url: "https://www.law.ntpu.edu.tw/data/22/1106",
    official_url: "https://www.law.ntpu.edu.tw/data/22/1106",
    deadline: "2026-03-06",
    department_limit: "法律學系",
    grade_limit: "大學部在學學生",
    eligibility_text: "法律學系大學部品學兼優且家境清寒、生活費用無穩定來源之在學學生，需符合低收入、家庭年收入、身心障礙、單親或其他清寒要件之一。",
    prize_text: "最高 30,000 元",
    max_prize_amount: 30000,
    summary: "法律學系清寒優秀學生獎學金，協助具經濟需求且品學兼優的學生完成學業。",
    first_stage_deliverables: ["線上申請表", "申請書", "成績單", "戶口名簿", "所得資料", "在學證明", "清寒證明", "自傳", "讀書計畫"],
    submission_types: ["申請表", "證明文件", "短文"],
    category_tags: ["系所獎學金", "清寒助學"],
    special_notes: ["每名每學期10,000至30,000元不等，名額1至數名。", "需於截止日前送交系辦；面談時間依系辦通知。"],
    schedule: [{ date: "2026-03-06", label: "申請截止" }],
    status: "published",
  },
  {
    title: "法律學院連玉獎學金",
    organizer: "國立臺北大學法律學院",
    source_url: "https://www.law.ntpu.edu.tw/data/22/1109",
    official_url: "https://www.law.ntpu.edu.tw/data/22/1109",
    deadline: "2026-04-01",
    department_limit: "法律學院",
    grade_limit: "大學部、碩士班",
    eligibility_text: "法律學院註冊在學學生；大學部前一學期操行80分以上且學業平均75分以上，碩士班前一學期操行80分以上且學業平均85分以上。",
    prize_text: "最高 20,000 元",
    max_prize_amount: 20000,
    summary: "法律學院獎學金，鼓勵大學部與碩士班學生努力向學，清寒或積極參與院內活動者可優先考量。",
    first_stage_deliverables: ["線上申請表", "申請表", "成績單", "在學證明", "自傳", "讀書計畫", "清寒證明", "服務證明"],
    submission_types: ["申請表", "證明文件", "短文"],
    category_tags: ["系所獎學金", "清寒助學", "學業表現"],
    special_notes: ["每學年共6名。", "獲獎後需參加公開頒獎表揚，並繳交成績單與獎學金使用情況報告書。"],
    schedule: [{ date: "2026-04-01", label: "申請截止" }],
    status: "published",
  },
  {
    title: "啓一獎勵優秀人才獎學金",
    organizer: "國立臺北大學法律學院",
    source_url: "https://www.law.ntpu.edu.tw/data/22/1016",
    official_url: "https://www.law.ntpu.edu.tw/data/22/1016",
    deadline: "2025-10-09",
    department_limit: "法律學院",
    grade_limit: "大學部、碩士班",
    eligibility_text: "法律學院註冊在學學生；大學部前一學年操行每學期80分以上且學業平均75分以上，碩士班前一學年操行每學期80分以上且學業平均85分以上。",
    prize_text: "最高 20,000 元",
    max_prize_amount: 20000,
    summary: "法律學院獎學金，鼓勵品學兼優或具經濟需求之大學部與碩士班學生。",
    first_stage_deliverables: ["線上申請表", "申請表", "成績單", "在學證明", "自傳", "讀書計畫", "清寒證明", "服務證明"],
    submission_types: ["申請表", "證明文件", "短文"],
    category_tags: ["系所獎學金", "清寒助學", "學業表現"],
    special_notes: ["每學年共6名。", "本筆為年度公告，後續年度需確認當期收件期限；獲獎後需參加公開頒獎表揚。"],
    schedule: [{ date: "2025-10-09", label: "申請截止" }],
    status: "needs_review",
  },
  {
    title: "法律學院法律學系碩博士班專題論文獎學金",
    organizer: "國立臺北大學法律學系",
    source_url: "https://www.law.ntpu.edu.tw/data/22/963",
    official_url: "https://www.law.ntpu.edu.tw/data/22/963",
    deadline: null,
    department_limit: "法律學系",
    grade_limit: "碩士班、博士班",
    eligibility_text: "法律學系研究生；每學期初繳交前一學期專題報告及相關申請文件，由獎審會評審。",
    prize_text: "獎金待確認",
    max_prize_amount: null,
    summary: "法律學系研究生專題論文獎學金，以每學期開放受理申請為原則，鼓勵研究生撰寫與發表專題論文。",
    first_stage_deliverables: ["專題報告", "申請推薦表", "相關申請文件"],
    submission_types: ["申請表", "證明文件", "短文"],
    category_tags: ["系所獎學金", "研究獎勵"],
    special_notes: ["金額需依附件或當期公告確認；獲獎論文需進行論文發表後始得頒發。"],
    schedule: [],
    status: "needs_review",
  },
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

function contentHashFor(record) {
  return createHash("sha256").update(JSON.stringify(record), "utf8").digest("hex");
}

function enrich(record) {
  const sourceItemKey = `ntpu_department_scholarship:${record.source_url}:${record.title}`;
  return {
    id: stableUuid(sourceItemKey),
    ...record,
    source_name: "北大系所／學院獎學金來源",
    source_type: "department_scholarship_page",
    source_posted_date: null,
    source_fetched_at: FETCHED_AT,
    source_content_hash: contentHashFor(record),
    source_item_key: sourceItemKey,
    opportunity_type: "獎學金",
    topic_areas: ["不限／不適用"],
    skill_tags: ["寫作"],
    school_limit: "國立臺北大學",
    reward_types: ["獎金"],
    participation_text: "依官方頁面與系所公告辦理。",
    judging_text: record.eligibility_text,
  };
}

function toSql(records) {
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

  const rows = records.map((item) => [
    sqlString(item.id),
    sqlString(item.title),
    sqlString(item.organizer),
    sqlString(item.source_url),
    sqlString(item.official_url),
    sqlString(item.source_name),
    sqlString(item.source_type),
    item.source_posted_date ? `${sqlString(item.source_posted_date)}::date` : "null",
    `${sqlString(item.source_fetched_at)}::timestamptz`,
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
    "-- Generated from scripts/crawler/export-department-scholarships-sql.mjs",
    "-- REVIEW BEFORE RUNNING: imports manually verified department/college scholarship rows.",
    "-- Rows with status = 'needs_review' are imported for staging but will not show in the frontend published list.",
    "",
    "alter table public.competitions drop constraint if exists competitions_status_check;",
    "alter table public.competitions add constraint competitions_status_check",
    "check (status in ('draft', 'published', 'needs_review', 'needs_pdf_parse', 'archived'));",
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
  const outputUrl = new URL(`../../${OUTPUT_PATH}`, import.meta.url);
  const outputPath = fileURLToPath(outputUrl);
  const opportunities = RECORDS.map(enrich);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, toSql(opportunities), "utf8");
  console.log(`Wrote ${opportunities.length} department scholarship opportunities to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
