import type { UserPreferences } from "@/src/types";
import { getDepartmentsForSchool } from "@/src/data/departmentCatalog";

const STORAGE_KEYS = {
  preferences: "bonus-hunter:preferences",
  savedOpportunityIds: "bonus-hunter:saved-opportunity-ids",
} as const;

const rewardTypeOptions = ["獎金", "獎品", "證書", "補助", "無明確獎勵", "未寫清楚"];
const highlightTagOptions = ["北大限定", "北聯大限定", "可個人參加", "可組隊", "線上繳交"];

function migrateDepartmentName(value: string) {
  if (value === "金融系") {
    return "金融與合作經營學系";
  }

  if (value === "法律系") {
    return "法律學系";
  }

  return value;
}

export const defaultPreferences: UserPreferences = {
  profile: {
    school: "國立臺北大學",
    majorDepartment: "金融與合作經營學系",
    grade: "大三",
    doubleMajorDepartment: "",
    minorDepartment: "",
  },
  interests: ["AI", "金融"],
  skills: ["企劃", "簡報", "資料分析"],
  preferredOpportunityTypes: ["比賽", "獎學金", "補助／計畫"],
  topicAreas: ["商業／企劃", "科技／程式"],
  deadlineFilters: ["一個月內", "一個月以上"],
  rewardTypes: ["獎金", "補助"],
  maxPrizeAmount: 0,
  prizeAmountMin: 0,
  prizeAmountMax: 100000,
  preferredSubmissionTypes: ["企劃書", "簡報"],
  highlightTags: ["北大限定", "可個人參加", "線上繳交"],
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getPreferences(): UserPreferences {
  const stored = readJson<UserPreferences>(STORAGE_KEYS.preferences, defaultPreferences);
  const profile = {
    ...defaultPreferences.profile,
    ...(stored.profile ?? {}),
  };
  const normalizedProfile = {
    ...profile,
    majorDepartment: migrateDepartmentName(profile.majorDepartment),
    doubleMajorDepartment: migrateDepartmentName(profile.doubleMajorDepartment ?? ""),
    minorDepartment: migrateDepartmentName(profile.minorDepartment ?? ""),
  };
  const knownDepartments = getDepartmentsForSchool(normalizedProfile.school);

  return {
    ...defaultPreferences,
    ...stored,
    profile: {
      ...normalizedProfile,
      majorDepartment: knownDepartments.includes(normalizedProfile.majorDepartment)
        ? normalizedProfile.majorDepartment
        : knownDepartments[0] ?? normalizedProfile.majorDepartment,
    },
    rewardTypes: (stored.rewardTypes ?? defaultPreferences.rewardTypes).filter((item) => rewardTypeOptions.includes(item)),
    highlightTags: (stored.highlightTags ?? defaultPreferences.highlightTags).filter((item) => highlightTagOptions.includes(item)),
    prizeAmountMin: stored.prizeAmountMin ?? stored.maxPrizeAmount ?? defaultPreferences.prizeAmountMin,
    prizeAmountMax: stored.prizeAmountMax ?? defaultPreferences.prizeAmountMax,
  };
}

export function savePreferences(preferences: UserPreferences) {
  writeJson(STORAGE_KEYS.preferences, preferences);
}

export function getSavedOpportunityIds(): string[] {
  return readJson<string[]>(STORAGE_KEYS.savedOpportunityIds, []);
}

export function setSavedOpportunityIds(ids: string[]) {
  writeJson(STORAGE_KEYS.savedOpportunityIds, Array.from(new Set(ids)));

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("bonus-hunter:saved-updated"));
  }
}

export function toggleSavedOpportunity(id: string): string[] {
  const current = getSavedOpportunityIds();
  const next = current.includes(id)
    ? current.filter((savedId) => savedId !== id)
    : [...current, id];

  setSavedOpportunityIds(next);
  return next;
}

export function isOpportunitySaved(id: string): boolean {
  return getSavedOpportunityIds().includes(id);
}
