export type OpportunityType = "比賽" | "獎學金" | "補助／計畫" | "其他";

export type SchoolScope =
  | "北大限定"
  | "北聯大限定"
  | "大專生可參加"
  | "不限身分"
  | "系所限定"
  | "需確認";

export type RecommendationLabel =
  | "很適合你"
  | "可以考慮"
  | "時間偏緊"
  | "已截止"
  | "需要再確認";

export type TopicArea =
  | "商業／企劃"
  | "創業／新創"
  | "科技／程式"
  | "法政／公共議題"
  | "社會／永續"
  | "不限／不適用"
  | "人文／寫作"
  | "語言／國際"
  | "設計／創作"
  | "其他";

export type DeadlineFilter = "三天內" | "一週內" | "一個月內" | "一個月以上" | "截止日未明";

export type RewardType = "獎金" | "獎學金" | "補助" | "實體資源" | "曝光" | "證書";

export type EligibilityRules = {
  schoolScope: SchoolScope;
  allowedSchools?: string[];
  allowedDepartments?: string[];
  allowedGrades?: string[];
  allowDoubleMajor?: boolean;
  allowMinor?: boolean;
  requiresMajorOnly?: boolean;
};

export type Opportunity = {
  id: string;
  title: string;
  organizer: string;
  sourceUrl: string;
  deadline: string;
  opportunityType: OpportunityType;
  topicAreas: TopicArea[];
  topicTags: string[];
  skillTags: string[];
  submissionTypes: string[];
  firstStageDeliverables: string[];
  eligibilityText: string;
  eligibilityRules: EligibilityRules;
  prizeText: string;
  rewardTypes: RewardType[];
  maxPrizeAmount?: number;
  summary: string;
  specialNotes: string[];
  status: "published";
  participationText?: string;
  schedule?: Array<{
    date: string;
    label: string;
  }>;
  judgingText?: string;
};

export type UserProfile = {
  school: string;
  majorDepartment: string;
  grade: string;
  doubleMajorDepartment?: string;
  minorDepartment?: string;
};

export type UserPreferences = {
  profile: UserProfile;
  interests: string[];
  skills: string[];
  preferredOpportunityTypes: OpportunityType[];
  topicAreas: TopicArea[];
  deadlineFilters: DeadlineFilter[];
  rewardTypes: RewardType[];
  maxPrizeAmount?: number;
  preferredSubmissionTypes: string[];
  highlightTags: string[];
};

export type RecommendationResult = {
  opportunity: Opportunity;
  label: RecommendationLabel;
  matchedReasons: string[];
  preferenceMatches: string[];
  qualificationReasons: string[];
  warnings: string[];
  internalScore: number;
};
