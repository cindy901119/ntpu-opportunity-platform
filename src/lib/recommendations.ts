import type {
  Opportunity,
  RecommendationLabel,
  RecommendationResult,
  UserProfile,
  UserPreferences,
} from "@/src/types";
import { getDaysUntilDeadline } from "@/src/lib/format";

const TUA_SCHOOLS = ["國立臺北大學", "國立臺北科技大學", "臺北醫學大學", "國立臺灣海洋大學"];
const INCOMPLETE_WARNING = "公告資訊不完整，報名前建議確認官方簡章。";

export function inferStudyLevel(grade: string) {
  if (["大一", "大二", "大三", "大四"].includes(grade)) {
    return "大學部";
  }

  if (["碩一", "碩二"].includes(grade)) {
    return "碩士班";
  }

  return "需確認";
}

function intersect(a: string[], b: string[]) {
  return a.filter((item) => b.includes(item));
}

function matchesDeadlineFilters(opportunity: Opportunity, filters: UserPreferences["deadlineFilters"]) {
  if (!filters.length) {
    return true;
  }

  const days = getDaysUntilDeadline(opportunity.deadline);
  if (days === null) {
    return filters.includes("截止日未明");
  }

  if (days < 0) {
    return false;
  }

  return filters.some((filter) => {
    if (filter === "三天內") return days <= 3;
    if (filter === "一週內") return days <= 7;
    if (filter === "一個月內") return days <= 30;
    if (filter === "一個月以上") return days > 30;
    return false;
  });
}

function matchesFilters(opportunity: Opportunity, preferences: UserPreferences) {
  const minPrize = preferences.maxPrizeAmount ?? 0;

  return (
    (!preferences.preferredOpportunityTypes.length || preferences.preferredOpportunityTypes.includes(opportunity.opportunityType)) &&
    (!preferences.topicAreas.length || intersect(opportunity.topicAreas, preferences.topicAreas).length > 0) &&
    matchesDeadlineFilters(opportunity, preferences.deadlineFilters) &&
    (!preferences.rewardTypes.length || intersect(opportunity.rewardTypes, preferences.rewardTypes).length > 0) &&
    (!minPrize || (opportunity.maxPrizeAmount ?? 0) >= minPrize)
  );
}

function daysUntil(deadline: string) {
  if (!deadline) {
    return null;
  }

  const today = new Date();
  const target = new Date(`${deadline}T23:59:59`);
  if (Number.isNaN(target.getTime())) {
    return null;
  }

  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

function isDepartmentMatched(opportunity: Opportunity, profile: UserProfile) {
  const allowed = opportunity.eligibilityRules.allowedDepartments;
  if (!allowed?.length) {
    return true;
  }

  if (allowed.includes(profile.majorDepartment)) {
    return true;
  }

  if (opportunity.eligibilityRules.requiresMajorOnly) {
    return false;
  }

  if (
    opportunity.eligibilityRules.allowDoubleMajor &&
    profile.doubleMajorDepartment &&
    allowed.includes(profile.doubleMajorDepartment)
  ) {
    return true;
  }

  if (
    opportunity.eligibilityRules.allowMinor &&
    profile.minorDepartment &&
    allowed.includes(profile.minorDepartment)
  ) {
    return true;
  }

  return false;
}

export function isQualificationMatched(opportunity: Opportunity, profile: UserProfile) {
  const rules = opportunity.eligibilityRules;

  if (rules.schoolScope === "需確認") {
    return "uncertain" as const;
  }

  if (rules.allowedGrades?.length && !rules.allowedGrades.includes(profile.grade)) {
    return "mismatch" as const;
  }

  if (rules.allowedSchools?.length && !rules.allowedSchools.includes(profile.school)) {
    return "mismatch" as const;
  }

  if (rules.schoolScope === "北大限定" && profile.school !== "國立臺北大學") {
    return "mismatch" as const;
  }

  if (rules.schoolScope === "北聯大限定" && !TUA_SCHOOLS.includes(profile.school)) {
    return "mismatch" as const;
  }

  if (!isDepartmentMatched(opportunity, profile)) {
    return "mismatch" as const;
  }

  return "matched" as const;
}

export function getQualificationReasons(opportunity: Opportunity, profile: UserProfile) {
  const rules = opportunity.eligibilityRules;
  const reasons: string[] = [];

  if (rules.schoolScope === "北大限定" && profile.school === "國立臺北大學") {
    reasons.push("北大學生可參加");
  }

  if (rules.schoolScope === "北聯大限定" && TUA_SCHOOLS.includes(profile.school)) {
    reasons.push("北聯大系統學生可參加");
  }

  if (rules.schoolScope === "大專生可參加") {
    reasons.push("大專院校學生可報名");
  }

  if (rules.schoolScope === "不限身分") {
    reasons.push("不限身分");
  }

  if (rules.allowedGrades?.includes(profile.grade)) {
    reasons.push(`${profile.grade}學生可參加`);
  }

  if (rules.allowedDepartments?.includes(profile.majorDepartment)) {
    reasons.push("主修系所符合公告限制");
  }

  if (
    rules.allowDoubleMajor &&
    profile.doubleMajorDepartment &&
    rules.allowedDepartments?.includes(profile.doubleMajorDepartment)
  ) {
    reasons.push("雙主修系所符合資格");
  }

  if (
    rules.allowMinor &&
    profile.minorDepartment &&
    rules.allowedDepartments?.includes(profile.minorDepartment)
  ) {
    reasons.push("輔系符合資格");
  }

  if (!rules.allowedDepartments?.length && rules.schoolScope === "大專生可參加") {
    reasons.push("不限科系");
  }

  return reasons.length ? reasons.slice(0, 3) : ["資格未明確排除"];
}

function getHighlightMatches(opportunity: Opportunity, highlightTags: string[]) {
  const text = [
    opportunity.prizeText,
    opportunity.eligibilityText,
    opportunity.summary,
    opportunity.participationText ?? "",
    opportunity.firstStageDeliverables.join(" "),
    opportunity.submissionTypes.join(" "),
  ].join(" ");

  return highlightTags.filter((tag) => {
    if (tag === "有獎金") return /獎金|獎學金|補助|獎助/.test(text);
    if (tag === "北大限定") return opportunity.eligibilityRules.schoolScope === "北大限定";
    if (tag === "北聯大限定") return opportunity.eligibilityRules.schoolScope === "北聯大限定";
    if (tag === "可累積作品集") return /作品|Demo|原型|成果/.test(text);
    if (tag === "可個人參加") return /個人/.test(text);
    if (tag === "可組隊") return /團隊|組隊/.test(text);
    if (tag === "線上繳交") return /線上|連結|上傳/.test(text);
    return false;
  });
}

function getMatchedReasons(opportunity: Opportunity, preferences: UserPreferences) {
  const reasons: string[] = [];
  const topicMatches = intersect(opportunity.topicTags, preferences.interests);
  const areaMatches = intersect(opportunity.topicAreas, preferences.topicAreas);
  const skillMatches = intersect(opportunity.skillTags, preferences.skills);
  const submissionMatches = intersect(
    [...opportunity.submissionTypes, ...opportunity.firstStageDeliverables],
    preferences.preferredSubmissionTypes,
  );
  const highlightMatches = getHighlightMatches(opportunity, preferences.highlightTags);

  if (preferences.preferredOpportunityTypes.includes(opportunity.opportunityType)) {
    reasons.push(`你偏好${opportunity.opportunityType}，這筆資料屬於${opportunity.opportunityType}。`);
  }

  topicMatches.forEach((topic) => {
    reasons.push(`你設定了 ${topic} 為感興趣主題。`);
  });

  areaMatches.forEach((area) => {
    reasons.push(`你選擇了${area}主題領域。`);
  });

  skillMatches.forEach((skill) => {
    reasons.push(`你填寫了${skill}能力，這個機會會用到相關能力。`);
  });

  submissionMatches.forEach((submission) => {
    reasons.push(`你偏好的交件形式包含${submission}。`);
  });

  highlightMatches.forEach((tag) => {
    if (tag === "有獎金") {
      reasons.push("你特別重視有獎金，這個機會提供獎金或獎助。");
    } else {
      reasons.push(`你特別重視${tag}，這個機會符合此條件。`);
    }
  });

  return reasons.slice(0, 6);
}

function getPreferenceMatches(opportunity: Opportunity, preferences: UserPreferences) {
  const matches = [
    ...intersect(opportunity.topicTags, preferences.interests),
    ...intersect(opportunity.topicAreas, preferences.topicAreas),
    ...intersect(opportunity.skillTags, preferences.skills),
    ...intersect(opportunity.submissionTypes, preferences.preferredSubmissionTypes),
    ...intersect(opportunity.rewardTypes, preferences.rewardTypes),
    ...getHighlightMatches(opportunity, preferences.highlightTags),
  ];

  return Array.from(new Set(matches)).slice(0, 5);
}

function getWarnings(opportunity: Opportunity, qualification: "matched" | "uncertain" | "mismatch") {
  const warnings: string[] = [];

  if (
    qualification === "uncertain" ||
    !opportunity.deadline ||
    !opportunity.sourceUrl ||
    !opportunity.eligibilityText ||
    opportunity.eligibilityRules.schoolScope === "需確認"
  ) {
    warnings.push(INCOMPLETE_WARNING);
  }

  const remaining = daysUntil(opportunity.deadline);

  if (remaining !== null && remaining < 0) {
    warnings.push("這個機會已超過截止日，請確認官方公告是否有延長或下一梯次。");
  } else if (remaining !== null && remaining <= 5) {
    warnings.push("截止時間偏近，建議先確認是否來得及準備。");
  }

  return warnings;
}

function scoreOpportunity(opportunity: Opportunity, preferences: UserPreferences) {
  let score = 0;
  score += preferences.preferredOpportunityTypes.includes(opportunity.opportunityType) ? 18 : 0;
  score += intersect(opportunity.topicAreas, preferences.topicAreas).length * 12;
  score += intersect(opportunity.topicTags, preferences.interests).length * 12;
  score += intersect(opportunity.skillTags, preferences.skills).length * 10;
  score += intersect(opportunity.rewardTypes, preferences.rewardTypes).length * 8;
  score += intersect([...opportunity.submissionTypes, ...opportunity.firstStageDeliverables], preferences.preferredSubmissionTypes).length * 7;
  score += getHighlightMatches(opportunity, preferences.highlightTags).length * 6;
  return score;
}

function getLabel(score: number, qualification: "matched" | "uncertain" | "mismatch", deadline: string): RecommendationLabel {
  const remaining = daysUntil(deadline);

  if (remaining !== null && remaining < 0) {
    return "已截止";
  }

  if (remaining !== null && remaining <= 5) {
    return "時間偏緊";
  }

  if (qualification === "uncertain") {
    return "需要再確認";
  }

  return score >= 35 ? "很適合你" : "可以考慮";
}

export function getRecommendations(
  opportunities: Opportunity[],
  preferences: UserPreferences,
): RecommendationResult[] {
  return opportunities
    .filter((opportunity) => opportunity.status === "published")
    .filter((opportunity) => matchesFilters(opportunity, preferences))
    .map((opportunity) => {
      const qualification = isQualificationMatched(opportunity, preferences.profile);
      if (qualification === "mismatch") {
        return null;
      }

      const internalScore = scoreOpportunity(opportunity, preferences);
      return {
        opportunity,
        label: getLabel(internalScore, qualification, opportunity.deadline),
        matchedReasons: getMatchedReasons(opportunity, preferences),
        preferenceMatches: getPreferenceMatches(opportunity, preferences),
        qualificationReasons: getQualificationReasons(opportunity, preferences.profile),
        warnings: getWarnings(opportunity, qualification),
        internalScore,
      };
    })
    .filter((result): result is RecommendationResult => Boolean(result))
    .sort((a, b) => b.internalScore - a.internalScore);
}
