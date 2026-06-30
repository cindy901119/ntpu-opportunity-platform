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

const MANUAL_OVERRIDES = [
  {
    pattern: /有事青年行動競賽/,
    title: "115年第七屆有事青年行動競賽",
    organizer: "嘉義市政府",
    official_url: "https://youthsoullab.chiayi.gov.tw/News_Content.aspx?n=13621&s=939994",
    opportunity_type: "比賽",
    deadline: "2026-07-13",
    school_limit: "不限",
    department_limit: "不限",
    grade_limit: "不限；但創新競賽組限國中生",
    eligibility_text: "議題實踐組：15至35歲青年；創新競賽組：國中生限定。實際資格依官方簡章為準。",
    prize_text: "總獎金達新臺幣90萬元",
    reward_types: ["獎金"],
    max_prize_amount: null,
    schedule: [
      { date: "2026-07-13T23:59:00+08:00", label: "議題實踐組報名截止" },
      { date: "2026-07-27T23:59:00+08:00", label: "創新競賽組報名截止" },
    ],
    summary: "以地方文化、數位工具與青年行動為主題，徵求可實作的社會議題方案。",
    special_notes: [
      "原 title 多了「活動」，已清理。",
      "官方簡章連結已改為嘉義市政府青年實驗室競賽公告頁。",
      "school_limit 不可填國立臺北大學。",
    ],
  },
  {
    pattern: /AIxESG|U-STEP永續行動獎/,
    title: "2026北聯大U-STEP永續行動獎｜AI×ESG創新實踐競賽",
    organizer: "臺北聯合大學系統",
    official_url: "https://ustp.ntpu.edu.tw/info/6/method/183",
    opportunity_type: "比賽",
    deadline: "2026-07-31",
    school_limit: "隊伍代表人限臺北聯合大學系統四校；其餘成員不限大專校院",
    department_limit: "不限",
    grade_limit: "大專校院學生、研究生",
    eligibility_text:
      "每隊2至5人，大專校院學生含研究生；隊伍代表人須為臺北聯合大學系統四校學生，其餘成員可為其他大專校院學生。",
    prize_text: "最高 30,000 元",
    reward_types: ["獎金"],
    max_prize_amount: 30000,
    submission_types: ["提案計畫書", "參賽聲明書", "在學證明"],
    first_stage_deliverables: ["提案計畫書", "參賽聲明書", "全體團隊成員在學證明"],
    schedule: [{ date: "2026-07-31T17:00:00+08:00", label: "徵件截止" }],
    summary: "以 AI 與 ESG 為主題，徵求全國大專校院學生提出永續行動方案。",
    special_notes: [
      "原 title 是促銷式公告標題，已改為正式活動名。",
      "official_url 已補臺北聯合大學系統官方公告頁。",
      "原 submission_types 含影片錯誤，已改為提案計畫書、參賽聲明書與在學證明。",
      "前20組完成報名且通過資格審查者，每隊另有1,000元獎勵金，依官方簡章為準。",
    ],
  },
  {
    pattern: /群馥盃圖案設計大賽/,
    title: "第五屆群馥盃圖案設計大賽",
    organizer: "崑山科技大學織物染整及印花類產線基地、崑山科技大學先進應用材料工程系",
    official_url: "https://dmetextile.ksu.edu.tw/news.aspx?id=83",
    opportunity_type: "比賽",
    deadline: "2026-11-04",
    topic_areas: ["設計／創作"],
    category_tags: ["設計／創作", "圖案設計", "平面設計"],
    skill_tags: ["設計", "創作理念說明"],
    submission_types: ["報名表", "圖案作品檔案"],
    first_stage_deliverables: ["競賽報名表", "圖案作品檔案"],
    eligibility_text: "公私立大專校院及全國高級中等學校學生可參加；實際資格依官方簡章為準。",
    school_limit: "不限",
    department_limit: "不限",
    grade_limit: "高中職、大專校院",
    schedule: [
      { date: "2026-11-04T12:00:00+08:00", label: "投稿截止" },
      { date: "2026-11-18", label: "公告入圍及備取名單" },
      { date: "2026-12-04T13:20:00+08:00", label: "決賽暨頒獎" },
    ],
    summary: "徵求圖案設計作品，採線上報名與作品上傳，入圍者需參加現場決賽。",
    special_notes: [
      "原 title 多餘引號與「競賽」尾詞，已清理。",
      "原 topic_areas 含科技／程式錯誤，已改為設計／創作。",
      "原 submission_types 含影片、作品集錯誤，已改為報名表與圖案作品檔案。",
    ],
  },
  {
    pattern: /國家公園保育研討會青年論文徵文競賽/,
    title: "2026年臺灣國家公園保育研討會青年論文徵文競賽",
    organizer: "內政部國家公園署",
    official_url: "https://www.taiwan.nps.gov.tw/home/zh-tw/news/33545.html",
    opportunity_type: "比賽",
    deadline: "2026-07-10",
    topic_areas: ["社會／永續"],
    category_tags: ["生態保育", "環境", "論文競賽", "公共議題"],
    skill_tags: ["研究", "寫作", "資料整理"],
    submission_types: ["小論文", "研究論文"],
    first_stage_deliverables: ["論文稿件", "報名資料"],
    eligibility_text:
      "小論文組：國內大專校院學生及高中職學生；研究論文組：國內研究生及114、115年畢業之碩博士生。實際分組與資格依官方簡章為準。",
    school_limit: "不限，限國內學校相關身分",
    department_limit: "不限",
    grade_limit: "高中職、大專校院、研究生、近年碩博士畢業生",
    prize_text: "最高 50,000 元",
    reward_types: ["獎金", "獎狀"],
    max_prize_amount: 50000,
    schedule: [
      { date: "2026-06-10", label: "簡章公告與徵件開始" },
      { date: "2026-07-10", label: "投稿截止" },
      { date: "2026-09-03/2026-09-04", label: "公開發表與頒獎" },
    ],
    summary: "徵求國家公園、海岸、濕地與海洋生態保育相關研究或小論文。",
    special_notes: [
      "原 title 是轉知公告句，已清理成活動正式名稱。",
      "原 official_url 是短網址，已改國家公園署主題網官方頁。",
      "原 deadline 為 null 錯誤，已補投稿截止日。",
      "另有其他名次與小論文組獎項，依官方簡章為準。",
    ],
  },
  {
    pattern: /學生自主學習LINE社群競賽/,
    title: "2026年學生自主學習LINE社群競賽",
    organizer: "國立臺北大學教務處教學發展中心",
    official_url: "https://new.ntpu.edu.tw/oaa/news/6a1d2cfea3956c33cd27db84",
    opportunity_type: "比賽",
    deadline: null,
    topic_areas: ["科技／程式", "社會／永續"],
    category_tags: ["AI", "ESG", "SDGs", "自主學習", "LINE社群", "共學"],
    skill_tags: ["企劃", "社群經營", "知識整理", "成果呈現"],
    submission_types: ["LINE社群經營", "提案", "成果紀錄"],
    first_stage_deliverables: ["LINE社群提案或主題任務成果"],
    eligibility_text: "本校及他校在校學生可參加，採團隊形式依主題參與。",
    school_limit: "不限學校，但須為在校學生",
    department_limit: "不限",
    grade_limit: "在校學生",
    prize_text: "最高 5,000 元",
    reward_types: ["獎金"],
    max_prize_amount: 5000,
    schedule: [],
    summary: "以 LINE 社群作為共學基地，鼓勵學生跨域組隊整理資訊、共創知識。",
    special_notes: [
      "原 title 含 emoji 裝飾，已清理。",
      "此活動依多個主題分期執行，不硬填單一 deadline。",
      "原 official_url 是短網址，已展開為北大教務處官方頁。",
      "另有單場人氣獎、年度個人獎與年度團隊獎，依官方簡章為準。",
    ],
  },
  {
    pattern: /鏡頭裡的綠色行動/,
    title: "2026鏡頭裡的綠色行動永續短影音競賽",
    organizer: "財團法人中鼎教育基金會",
    official_url: "https://www.ctcief.org/article_d.php?id=1826&lang=tw&tb=3",
    opportunity_type: "比賽",
    deadline: "2026-07-27",
    topic_areas: ["設計／創作", "社會／永續"],
    category_tags: ["短影音", "永續", "環境", "影像創作"],
    skill_tags: ["影片剪輯", "企劃", "影像敘事"],
    submission_types: ["線上報名表", "短影音作品", "附件資料"],
    first_stage_deliverables: ["報名資料", "短影音作品"],
    eligibility_text: "分國中組、高中職組、大專院校組；大專院校組包含碩博士生與五專後兩年。每隊1至4人。",
    school_limit: "不限",
    department_limit: "不限",
    grade_limit: "國中、高中職、大專院校、碩博士",
    prize_text: "最高 10,000 元",
    reward_types: ["獎金", "獎狀"],
    max_prize_amount: 10000,
    schedule: [
      { date: "2026-07-27T17:00:00+08:00", label: "報名截止" },
      { date: "2026-08-31T17:00:00+08:00", label: "作品上傳截止" },
      { date: "2026-09-21", label: "入圍公告" },
      { date: "2026-09-23/2026-10-08", label: "人氣投票" },
    ],
    summary: "以永續行動為主題徵求短影音作品，鼓勵用影像呈現綠色行動。",
    special_notes: [
      "原 title 含主辦單位與「辦理」，已清理。",
      "official_url 已補中鼎教育基金會官方活動頁。",
      "不建議放科技／程式，已改為設計／創作與社會／永續。",
      "另有第二名、第三名與獎狀，依官方簡章為準。",
    ],
  },
  {
    pattern: /海洋保育創意短影音競賽/,
    title: "2026海洋保育創意短影音競賽",
    organizer: "海洋委員會海洋保育署",
    official_url:
      "https://www.oca.gov.tw/ch/home.jsp?dataserno=202605290001&id=15&mcustomize=activity_view.jsp&mserno=201907060001&parentpath=0%2C2",
    opportunity_type: "比賽",
    deadline: "2026-08-21",
    topic_areas: ["設計／創作", "社會／永續"],
    category_tags: ["海洋保育", "短影音", "影像創作", "環境"],
    skill_tags: ["影片剪輯", "影像敘事", "創意發想"],
    submission_types: ["短影音作品", "線上報名資料", "YouTube或Instagram上傳連結"],
    first_stage_deliverables: ["短影音作品", "報名資料"],
    eligibility_text:
      "號召全臺影像創作者參與，分中小學組、高中組、大專組、社會組、AI組及專業組；實際資格依官方簡章為準。",
    school_limit: "不限",
    department_limit: "不限",
    grade_limit: "中小學、高中、大專、社會人士、AI組、專業組",
    prize_text: "最高 85,000 元",
    reward_types: ["獎金"],
    max_prize_amount: 85000,
    schedule: [
      { date: "2026-08-21T15:00:00+08:00", label: "報名與作品上傳截止" },
      { date: "2026-09", label: "公布入圍名單" },
      { date: "2026-11", label: "頒獎典禮" },
    ],
    summary: "以海洋保育為主題徵求創意短影音，鼓勵用影像呈現人與海洋的關係。",
    special_notes: [
      "原 title 含主辦單位與引號，已清理。",
      "official_url 已補海洋保育署官方活動頁。",
      "max_prize_amount 不填總獎金700000，改填單一最高獎項85000。",
    ],
  },
  {
    pattern: /獎助外國學生短期研習本土語言/,
    title: "115學年度教育部獎助外國學生短期研習本土語言計畫",
    organizer: "教育部",
    official_url: null,
    opportunity_type: "補助／計畫",
    deadline: "2026-08-15",
    topic_areas: ["語言／文化"],
    category_tags: ["本土語言", "外國學生", "獎助學金", "補助計畫"],
    submission_types: ["申請書", "計畫資料", "學校提報文件"],
    first_stage_deliverables: ["由學校提報申請資料"],
    eligibility_text:
      "115學年度於國內大學校院研習本土語言之外國學生；包含來臺研習本土語言之外國學生，以及已於我國大學校院就讀之外國學位生、交換生及選讀生。",
    school_limit: "由開設本土語言課程之大學校院提報申請",
    department_limit: "不限",
    grade_limit: "外國學生、外國學位生、交換生、選讀生",
    prize_text: "最高每月 28,000 元",
    reward_types: ["獎學金", "獎助金"],
    max_prize_amount: null,
    status: "needs_review",
    summary: "補助外國學生研習臺灣本土語言，申請資格與程序需依官方計畫確認。",
    special_notes: [
      "這筆不是競賽，不應發布到 competitions MVP。",
      "原 title 含引號、空格與「徵件」，已清理。",
      "目前未找到教育部原始官方頁，只找到多校轉知與附件，若 MVP 僅發布競賽請排除。",
    ],
  },
];

function getManualOverride(title, rawText) {
  const text = `${title} ${rawText}`;
  return MANUAL_OVERRIDES.find((item) => item.pattern.test(text)) ?? null;
}

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
  const known = rawText.match(/(臺北聯合大學系統|內政部國家公園署|教育部|中鼎教育基金會|彰化縣政府|嘉義縣政府|嘉義市政府|新北市政府|新北市政府文化局|海洋保育署|崑山科技大學|財團法人感恩聖仁社會福利慈善基金會)/);
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
  const external = urls.find((url) => !/ntpu\.edu\.tw|gm\.ntpu\.edu\.tw|forms\.gle/.test(url));
  return external ?? null;
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
  const override = getManualOverride(announcement.title, text);
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
    title: override?.title ?? cleanTitle(announcement.title),
    organizer: override?.organizer ?? inferOrganizer(text, announcement.sourceName),
    source_url: announcement.url,
    official_url: override ? override.official_url : inferOfficialUrl(text, announcement.url),
    source_name: announcement.sourceName,
    source_type: announcement.sourceType,
    source_posted_date: announcement.postedDate,
    source_fetched_at: announcement.fetchedAt,
    source_content_hash: announcement.contentHash,
    source_item_key: key,
    deadline: override?.deadline !== undefined ? override.deadline : deadline,
    opportunity_type: override?.opportunity_type ?? inferOpportunityType(announcement.title, text),
    topic_areas: override?.topic_areas ?? topicAreas,
    category_tags: override?.category_tags ?? topicTags,
    skill_tags: override?.skill_tags ?? inferList(text, SKILL_RULES, ["企劃"]),
    submission_types: override?.submission_types ?? submissionTypes,
    first_stage_deliverables: override?.first_stage_deliverables ?? firstStageDeliverables,
    eligibility_text: override?.eligibility_text ?? inferEligibility(text),
    school_limit: override?.school_limit ?? inferSchoolLimit(text),
    department_limit: override?.department_limit ?? "不限",
    grade_limit: override?.grade_limit ?? "大一、大二、大三、大四、碩一、碩二",
    prize_text: override?.prize_text ?? prizeText,
    reward_types: override?.reward_types ?? rewardTypes,
    max_prize_amount: Object.hasOwn(override ?? {}, "max_prize_amount") ? override.max_prize_amount : maxPrizeAmount,
    summary: override?.summary ?? inferSummary(text),
    special_notes: override?.special_notes ?? ["此筆由爬蟲結果轉為發布草稿，請人工確認截止日、資格與獎金。"],
    participation_text: /團隊/.test(text) ? "個人或團隊，依官方簡章" : "依官方簡章",
    schedule:
      override?.schedule ?? (deadline ? [{ date: `${Number(deadline.slice(5, 7))}/${Number(deadline.slice(8, 10))}`, label: "報名截止" }] : []),
    judging_text: /評分|評審/.test(text) ? "評分方式請確認官方簡章。" : null,
    status: override?.status ?? "published",
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
    "-- Allow manually reviewed rows to stay out of the published frontend list.",
    "alter table public.competitions drop constraint if exists competitions_status_check;",
    "alter table public.competitions add constraint competitions_status_check",
    "check (status in ('draft', 'published', 'needs_review', 'archived'));",
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
