import type { UserPreferences } from "@/src/types";

const STORAGE_KEYS = {
  preferences: "bonus-hunter:preferences",
  savedOpportunityIds: "bonus-hunter:saved-opportunity-ids",
} as const;

export const defaultPreferences: UserPreferences = {
  profile: {
    school: "國立臺北大學",
    majorDepartment: "金融系",
    grade: "大三",
    doubleMajorDepartment: "",
    minorDepartment: "",
  },
  interests: ["AI", "金融"],
  skills: ["企劃", "簡報", "資料分析"],
  preferredOpportunityTypes: ["比賽", "獎學金", "補助／計畫"],
  topicAreas: ["商業／企劃", "科技／程式"],
  deadlineFilters: ["一個月內", "一個月以上"],
  rewardTypes: ["獎金", "獎學金", "補助"],
  maxPrizeAmount: 0,
  preferredSubmissionTypes: ["企劃書", "簡報"],
  highlightTags: ["有獎金", "可累積作品集", "線上繳交"],
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

  return {
    ...defaultPreferences,
    ...stored,
    profile: {
      ...defaultPreferences.profile,
      ...(stored.profile ?? {}),
    },
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
