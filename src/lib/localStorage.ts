import type { UserPreferences } from "@/src/types";
import { getDefaultDepartmentForSchool, getDepartmentsForSchool } from "@/src/data/departmentCatalog";

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
    return "法律學系法學組";
  }

  if (value === "法律學系") {
    return "法律學系法學組";
  }

  return value;
}

function migrateSchool(value: string) {
  if (value === "國立臺北大學") {
    return value;
  }

  return "國立臺北大學";
}

export const defaultPreferences: UserPreferences = {
  profile: {
    school: "國立臺北大學",
    majorDepartment: "金融與合作經營學系",
    grade: "大三",
    doubleMajorDepartment: "",
    minorDepartment: "",
  },
  interests: [],
  skills: [],
  preferredOpportunityTypes: [],
  topicAreas: [],
  deadlineFilters: [],
  rewardTypes: [],
  maxPrizeAmount: 0,
  prizeAmountMin: 0,
  prizeAmountMax: 0,
  preferredSubmissionTypes: [],
  highlightTags: [],
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
    school: migrateSchool(profile.school),
    majorDepartment: migrateDepartmentName(profile.majorDepartment),
    doubleMajorDepartment: migrateDepartmentName(profile.doubleMajorDepartment ?? ""),
    minorDepartment: migrateDepartmentName(profile.minorDepartment ?? ""),
  };
  const knownDepartments = getDepartmentsForSchool(normalizedProfile.school);
  const majorDepartment = knownDepartments.includes(normalizedProfile.majorDepartment)
    ? normalizedProfile.majorDepartment
    : getDefaultDepartmentForSchool(normalizedProfile.school);
  const doubleMajorDepartment = knownDepartments.includes(normalizedProfile.doubleMajorDepartment)
    ? normalizedProfile.doubleMajorDepartment
    : "";
  const minorDepartment = knownDepartments.includes(normalizedProfile.minorDepartment)
    ? normalizedProfile.minorDepartment
    : "";

  return {
    ...defaultPreferences,
    ...stored,
    profile: {
      ...normalizedProfile,
      majorDepartment,
      doubleMajorDepartment,
      minorDepartment,
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
