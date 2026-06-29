import { mockOpportunities } from "@/src/data/mockOpportunities";
import { getSupabaseClient, hasSupabaseConfig, shouldUseMockData } from "@/src/lib/supabase/client";
import type { EligibilityRules, Opportunity, OpportunityType, RewardType, TopicArea } from "@/src/types";

type CompetitionRow = {
  id: string;
  title: string;
  organizer: string | null;
  source_url: string | null;
  official_url: string | null;
  deadline: string | null;
  opportunity_type: string | null;
  topic_areas: string[] | null;
  category_tags: string[] | null;
  skill_tags: string[] | null;
  submission_types: string[] | null;
  first_stage_deliverables: string[] | null;
  eligibility_text: string | null;
  school_limit: string | null;
  department_limit: string | null;
  grade_limit: string | null;
  prize_text: string | null;
  reward_types: string[] | null;
  max_prize_amount: number | null;
  summary: string | null;
  special_notes: string[] | null;
  participation_text: string | null;
  schedule: Array<{ date: string; label: string }> | null;
  judging_text: string | null;
  status: string | null;
};

const COMPETITION_SELECT = [
  "id",
  "title",
  "organizer",
  "source_url",
  "official_url",
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
].join(",");

const COMPETITION_SELECT_LEGACY = COMPETITION_SELECT.replace("official_url,", "");

const opportunityTypes: OpportunityType[] = ["比賽", "獎學金", "補助／計畫", "其他"];
const topicAreas: TopicArea[] = [
  "商業／企劃",
  "創業／新創",
  "科技／程式",
  "法政／公共議題",
  "社會／永續",
  "不限／不適用",
  "人文／寫作",
  "語言／國際",
  "設計／創作",
  "其他",
];
const rewardTypes: RewardType[] = ["獎金", "獎品", "證書", "補助", "無明確獎勵", "未寫清楚"];
const tuaSchools = ["國立臺北大學", "國立臺北科技大學", "臺北醫學大學", "國立臺灣海洋大學"];

function splitLimit(value: string | null) {
  if (!value || /不限|無限制/.test(value)) {
    return undefined;
  }

  return value
    .split(/[、,，/／]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeList<T extends string>(items: string[] | null, allowed: readonly T[], fallback: T[] = []) {
  const normalized = (items ?? []).filter((item): item is T => allowed.includes(item as T));
  return normalized.length ? normalized : fallback;
}

function normalizeOpportunityType(value: string | null): OpportunityType {
  return opportunityTypes.includes(value as OpportunityType) ? (value as OpportunityType) : "其他";
}

function inferEligibilityRules(row: CompetitionRow): EligibilityRules {
  const allowedDepartments = splitLimit(row.department_limit);
  const allowedGrades = splitLimit(row.grade_limit);
  const schoolLimit = row.school_limit ?? "";

  if (/需確認|未完整|待確認/.test([schoolLimit, row.eligibility_text ?? ""].join(" "))) {
    return { schoolScope: "需確認" };
  }

  if (/北大|國立臺北大學/.test(schoolLimit)) {
    return {
      schoolScope: "北大限定",
      allowedSchools: ["國立臺北大學"],
      allowedDepartments,
      allowedGrades,
    };
  }

  if (/北聯大|臺北聯合大學|台北聯合大學/.test(schoolLimit)) {
    return {
      schoolScope: "北聯大限定",
      allowedSchools: tuaSchools,
      allowedDepartments,
      allowedGrades,
    };
  }

  if (allowedDepartments?.length) {
    return {
      schoolScope: "系所限定",
      allowedDepartments,
      allowedGrades,
      allowDoubleMajor: /雙主修/.test(row.eligibility_text ?? ""),
      allowMinor: /輔系/.test(row.eligibility_text ?? ""),
      requiresMajorOnly: /主修限定|主修學生限定|僅限.*主修/.test(row.eligibility_text ?? ""),
    };
  }

  if (/大專|大學|研究生|在學學生/.test([schoolLimit, row.eligibility_text ?? ""].join(" "))) {
    return {
      schoolScope: "大專生可參加",
      allowedGrades,
    };
  }

  if (/不限/.test(schoolLimit)) {
    return {
      schoolScope: "不限身分",
      allowedGrades,
    };
  }

  return { schoolScope: "需確認" };
}

function formatScheduleDate(deadline: string) {
  const date = new Date(`${deadline}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return deadline;
  }

  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function mapCompetitionRow(row: CompetitionRow): Opportunity {
  const categoryTags = row.category_tags ?? [];
  const skillTags = row.skill_tags ?? [];
  const submissionTypes = row.submission_types ?? [];
  const firstStageDeliverables = row.first_stage_deliverables ?? [];
  const deadline = row.deadline ?? "";

  return {
    id: row.id,
    title: row.title,
    organizer: row.organizer ?? "主辦單位待確認",
    sourceUrl: row.source_url ?? "",
    officialUrl: row.official_url ?? row.source_url ?? "",
    deadline,
    opportunityType: normalizeOpportunityType(row.opportunity_type),
    topicAreas: normalizeList(row.topic_areas, topicAreas, ["其他"]),
    topicTags: categoryTags,
    skillTags,
    submissionTypes,
    firstStageDeliverables: firstStageDeliverables.length ? firstStageDeliverables : submissionTypes.length ? submissionTypes : ["依官方簡章"],
    eligibilityText: row.eligibility_text ?? "資格資訊待確認，報名前請確認官方簡章。",
    eligibilityRules: inferEligibilityRules(row),
    prizeText: row.prize_text ?? "獎金待確認",
    rewardTypes: normalizeList(row.reward_types, rewardTypes, []),
    maxPrizeAmount: row.max_prize_amount ?? undefined,
    summary: row.summary ?? "公告摘要待補。",
    specialNotes: row.special_notes?.length ? row.special_notes : ["報名前請確認官方簡章完整規則。"],
    status: "published",
    participationText: row.participation_text ?? undefined,
    schedule: row.schedule?.length ? row.schedule : deadline ? [{ date: formatScheduleDate(deadline), label: "報名截止" }] : undefined,
    judgingText: row.judging_text ?? undefined,
  };
}

function mockById(id: string) {
  return mockOpportunities.find((opportunity) => opportunity.id === id) ?? null;
}

function shouldFallbackToMock() {
  return shouldUseMockData() || !hasSupabaseConfig();
}

export async function getPublishedCompetitions(): Promise<Opportunity[]> {
  if (shouldFallbackToMock()) {
    return mockOpportunities;
  }

  try {
    let response = await getSupabaseClient()
      .from("competitions")
      .select(COMPETITION_SELECT)
      .eq("status", "published")
      .order("deadline", { ascending: true, nullsFirst: false });

    if (response.error?.code === "42703") {
      response = await getSupabaseClient()
        .from("competitions")
        .select(COMPETITION_SELECT_LEGACY)
        .eq("status", "published")
        .order("deadline", { ascending: true, nullsFirst: false });
    }

    if (response.error) {
      throw response.error;
    }

    const rows = (response.data ?? []) as unknown as CompetitionRow[];

    return rows.length ? rows.map(mapCompetitionRow) : mockOpportunities;
  } catch (error) {
    console.warn("Falling back to mock opportunities.", error);
    return mockOpportunities;
  }
}

export async function getCompetitionById(id: string): Promise<Opportunity | null> {
  if (shouldFallbackToMock()) {
    return mockById(id);
  }

  try {
    let response = await getSupabaseClient()
      .from("competitions")
      .select(COMPETITION_SELECT)
      .eq("id", id)
      .eq("status", "published")
      .maybeSingle();

    if (response.error?.code === "42703") {
      response = await getSupabaseClient()
        .from("competitions")
        .select(COMPETITION_SELECT_LEGACY)
        .eq("id", id)
        .eq("status", "published")
        .maybeSingle();
    }

    if (response.error) {
      throw response.error;
    }

    const row = response.data as unknown as CompetitionRow | null;

    return row ? mapCompetitionRow(row) : mockById(id);
  } catch (error) {
    console.warn("Falling back to mock opportunity.", error);
    return mockById(id);
  }
}
