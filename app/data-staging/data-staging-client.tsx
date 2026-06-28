"use client";

import { useMemo, useState } from "react";
import { ChipSelector } from "@/src/components/ChipSelector";
import type { OpportunityType, RewardType, TopicArea } from "@/src/types";

type RawAnnouncementDraft = {
  source_key: string;
  source_name: string;
  source_type: string;
  source_url: string;
  source_item_key: string;
  source_title: string;
  source_posted_date: string;
  source_fetched_at: string;
  source_content_hash: string;
  raw_text: string;
  detected_keywords: string[];
  excluded_reason: string;
  status: "new" | "possible_opportunity" | "not_relevant" | "duplicate" | "needs_review" | "converted";
  review_notes: string;
};

type DraftCompetitionDraft = {
  raw_announcement_id: string;
  title: string;
  organizer: string;
  source_url: string;
  source_name: string;
  source_type: string;
  source_posted_date: string;
  source_fetched_at: string;
  source_content_hash: string;
  source_item_key: string;
  series_key: string;
  instance_key: string;
  deadline: string;
  opportunity_type: OpportunityType;
  topic_areas: TopicArea[];
  category_tags: string[];
  skill_tags: string[];
  submission_types: string[];
  first_stage_deliverables: string[];
  eligibility_text: string;
  school_limit: string;
  department_limit: string;
  grade_limit: string;
  prize_text: string;
  reward_types: RewardType[];
  max_prize_amount: number;
  summary: string;
  special_notes: string[];
  participation_text: string;
  schedule: Array<{ date: string; label: string }>;
  judging_text: string;
  draft_status: "needs_review" | "ready_to_publish" | "published" | "rejected";
  reviewer_notes: string;
};

const STORAGE_KEY = "bonus-hunter:data-staging-draft";

const topicAreas: TopicArea[] = ["商業／企劃", "創業／新創", "科技／程式", "法政／公共議題", "社會／永續", "不限／不適用", "人文／寫作", "語言／國際", "設計／創作", "其他"];
const opportunityTypes: OpportunityType[] = ["比賽", "獎學金", "補助／計畫", "其他"];
const rewardTypes: RewardType[] = ["獎金", "獎品", "證書", "補助", "無明確獎勵", "未寫清楚"];
const skills = ["企劃", "簡報", "寫作", "影片剪輯", "設計", "程式", "資料分析"];
const submissionTypes = ["申請表", "證明文件", "企劃書", "簡報", "影片", "作品集", "程式／Demo"];

const initialRaw: RawAnnouncementDraft = {
  source_key: "ntpu_osa_extracurricular",
  source_name: "國立臺北大學學務處課外組公告",
  source_type: "school_public_page",
  source_url: "",
  source_item_key: "",
  source_title: "",
  source_posted_date: "",
  source_fetched_at: "",
  source_content_hash: "",
  raw_text: "",
  detected_keywords: [],
  excluded_reason: "",
  status: "possible_opportunity",
  review_notes: "",
};

const initialDraft: DraftCompetitionDraft = {
  raw_announcement_id: "",
  title: "",
  organizer: "",
  source_url: "",
  source_name: "",
  source_type: "school_public_page",
  source_posted_date: "",
  source_fetched_at: "",
  source_content_hash: "",
  source_item_key: "",
  series_key: "",
  instance_key: "",
  deadline: "",
  opportunity_type: "比賽",
  topic_areas: [],
  category_tags: [],
  skill_tags: [],
  submission_types: [],
  first_stage_deliverables: [],
  eligibility_text: "",
  school_limit: "",
  department_limit: "不限",
  grade_limit: "",
  prize_text: "",
  reward_types: [],
  max_prize_amount: 0,
  summary: "",
  special_notes: [],
  participation_text: "",
  schedule: [],
  judging_text: "",
  draft_status: "needs_review",
  reviewer_notes: "",
};

function splitList(value: string) {
  return value
    .split(/\r?\n|、|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function toListText(values: string[]) {
  return values.join("\n");
}

function toScheduleText(value: DraftCompetitionDraft["schedule"]) {
  return value.map((item) => `${item.date}｜${item.label}`).join("\n");
}

function parseSchedule(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [date, label] = line.split(/｜|\|/).map((item) => item.trim());
      return { date: date ?? "", label: label ?? "" };
    })
    .filter((item) => item.date && item.label);
}

function sqlString(value: string | null | undefined) {
  if (!value) {
    return "null";
  }

  return `'${value.replace(/'/g, "''")}'`;
}

function sqlTextArray(values: string[]) {
  if (!values.length) {
    return "array[]::text[]";
  }

  return `array[${values.map(sqlString).join(",")}]`;
}

function buildRawSql(raw: RawAnnouncementDraft) {
  return `insert into public.raw_announcements (
  source_key,
  source_name,
  source_type,
  source_url,
  source_item_key,
  source_title,
  source_posted_date,
  source_fetched_at,
  source_content_hash,
  raw_text,
  detected_keywords,
  excluded_reason,
  status,
  review_notes
) values (
  ${sqlString(raw.source_key)},
  ${sqlString(raw.source_name)},
  ${sqlString(raw.source_type)},
  ${sqlString(raw.source_url)},
  ${sqlString(raw.source_item_key)},
  ${sqlString(raw.source_title)},
  ${sqlString(raw.source_posted_date)},
  ${sqlString(raw.source_fetched_at)},
  ${sqlString(raw.source_content_hash)},
  ${sqlString(raw.raw_text)},
  ${sqlTextArray(raw.detected_keywords)},
  ${sqlString(raw.excluded_reason)},
  ${sqlString(raw.status)},
  ${sqlString(raw.review_notes)}
)
on conflict (source_item_key) do update set
  source_title = excluded.source_title,
  source_content_hash = excluded.source_content_hash,
  raw_text = excluded.raw_text,
  detected_keywords = excluded.detected_keywords,
  status = excluded.status,
  review_notes = excluded.review_notes,
  updated_at = now();`;
}

function buildDraftSql(draft: DraftCompetitionDraft) {
  return `insert into public.draft_competitions (
  raw_announcement_id,
  title,
  organizer,
  source_url,
  source_name,
  source_type,
  source_posted_date,
  source_fetched_at,
  source_content_hash,
  source_item_key,
  series_key,
  instance_key,
  deadline,
  opportunity_type,
  topic_areas,
  category_tags,
  skill_tags,
  submission_types,
  first_stage_deliverables,
  eligibility_text,
  school_limit,
  department_limit,
  grade_limit,
  prize_text,
  reward_types,
  max_prize_amount,
  summary,
  special_notes,
  participation_text,
  schedule,
  judging_text,
  draft_status,
  reviewer_notes
) values (
  ${draft.raw_announcement_id ? sqlString(draft.raw_announcement_id) : "null"},
  ${sqlString(draft.title)},
  ${sqlString(draft.organizer)},
  ${sqlString(draft.source_url)},
  ${sqlString(draft.source_name)},
  ${sqlString(draft.source_type)},
  ${sqlString(draft.source_posted_date)},
  ${sqlString(draft.source_fetched_at)},
  ${sqlString(draft.source_content_hash)},
  ${sqlString(draft.source_item_key)},
  ${sqlString(draft.series_key)},
  ${sqlString(draft.instance_key)},
  ${sqlString(draft.deadline)},
  ${sqlString(draft.opportunity_type)},
  ${sqlTextArray(draft.topic_areas)},
  ${sqlTextArray(draft.category_tags)},
  ${sqlTextArray(draft.skill_tags)},
  ${sqlTextArray(draft.submission_types)},
  ${sqlTextArray(draft.first_stage_deliverables)},
  ${sqlString(draft.eligibility_text)},
  ${sqlString(draft.school_limit)},
  ${sqlString(draft.department_limit)},
  ${sqlString(draft.grade_limit)},
  ${sqlString(draft.prize_text)},
  ${sqlTextArray(draft.reward_types)},
  ${draft.max_prize_amount || "null"},
  ${sqlString(draft.summary)},
  ${sqlTextArray(draft.special_notes)},
  ${sqlString(draft.participation_text)},
  '${JSON.stringify(draft.schedule).replace(/'/g, "''")}'::jsonb,
  ${sqlString(draft.judging_text)},
  ${sqlString(draft.draft_status)},
  ${sqlString(draft.reviewer_notes)}
);`;
}

export function DataStagingClient() {
  const [raw, setRaw] = useState<RawAnnouncementDraft>(() => {
    if (typeof window === "undefined") return initialRaw;

    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      return saved ? { ...initialRaw, ...JSON.parse(saved).raw } : initialRaw;
    } catch {
      return initialRaw;
    }
  });
  const [draft, setDraft] = useState<DraftCompetitionDraft>(() => {
    if (typeof window === "undefined") return initialDraft;

    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      return saved ? { ...initialDraft, ...JSON.parse(saved).draft } : initialDraft;
    } catch {
      return initialDraft;
    }
  });
  const [copied, setCopied] = useState("");

  const rawJson = useMemo(() => JSON.stringify(raw, null, 2), [raw]);
  const draftJson = useMemo(() => JSON.stringify(draft, null, 2), [draft]);
  const rawSql = useMemo(() => buildRawSql(raw), [raw]);
  const draftSql = useMemo(() => buildDraftSql(draft), [draft]);

  function updateRaw<K extends keyof RawAnnouncementDraft>(key: K, value: RawAnnouncementDraft[K]) {
    setCopied("");
    setRaw((current) => ({ ...current, [key]: value }));
  }

  function updateDraft<K extends keyof DraftCompetitionDraft>(key: K, value: DraftCompetitionDraft[K]) {
    setCopied("");
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function seedDraftFromRaw() {
    setDraft((current) => ({
      ...current,
      title: current.title || raw.source_title,
      source_url: current.source_url || raw.source_url,
      source_name: current.source_name || raw.source_name,
      source_type: current.source_type || raw.source_type,
      source_posted_date: current.source_posted_date || raw.source_posted_date,
      source_fetched_at: current.source_fetched_at || raw.source_fetched_at,
      source_content_hash: current.source_content_hash || raw.source_content_hash,
      source_item_key: current.source_item_key || raw.source_item_key,
      summary: current.summary || raw.raw_text.slice(0, 120),
    }));
    setCopied("已把 raw announcement 的來源欄位帶入 draft。");
  }

  function saveLocalDraft() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ raw, draft }));
    setCopied("staging 草稿已存到這台瀏覽器。");
  }

  function resetAll() {
    window.localStorage.removeItem(STORAGE_KEY);
    setRaw(initialRaw);
    setDraft(initialDraft);
    setCopied("已清空 staging 草稿。");
  }

  async function copyText(label: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(`已複製${label}。`);
  }

  return (
    <main className="mx-auto max-w-[980px] px-4 py-5">
      <div className="mb-5">
        <p className="text-sm font-semibold text-[var(--action)]">v0.7-A</p>
        <h1 className="mt-1 text-2xl font-semibold">資料暫存與審核</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          先保存公告原文，再整理成待審機會草稿。這裡不會直接發布到前台。
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <section className="section-card space-y-4">
          <h2 className="text-lg font-semibold">raw announcement</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="source_key" value={raw.source_key} onChange={(value) => updateRaw("source_key", value)} />
            <TextField label="來源名稱" value={raw.source_name} onChange={(value) => updateRaw("source_name", value)} />
            <TextField label="來源類型" value={raw.source_type} onChange={(value) => updateRaw("source_type", value)} />
            <TextField label="公告日期" type="date" value={raw.source_posted_date} onChange={(value) => updateRaw("source_posted_date", value)} />
          </div>
          <TextField label="公告 URL" value={raw.source_url} onChange={(value) => updateRaw("source_url", value)} />
          <TextField label="公告標題" value={raw.source_title} onChange={(value) => updateRaw("source_title", value)} />
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="source_item_key" value={raw.source_item_key} onChange={(value) => updateRaw("source_item_key", value)} />
            <TextField label="source_content_hash" value={raw.source_content_hash} onChange={(value) => updateRaw("source_content_hash", value)} />
          </div>
          <TextField label="抓取時間" value={raw.source_fetched_at} placeholder="2026-06-26T00:00:00+08:00" onChange={(value) => updateRaw("source_fetched_at", value)} />
          <TextAreaField label="公告原文" rows={8} value={raw.raw_text} onChange={(value) => updateRaw("raw_text", value)} />
          <TextAreaField label="偵測關鍵字" value={toListText(raw.detected_keywords)} placeholder="競賽&#10;補助&#10;申請" onChange={(value) => updateRaw("detected_keywords", splitList(value))} />
          <SelectField
            label="raw 狀態"
            value={raw.status}
            options={["new", "possible_opportunity", "not_relevant", "duplicate", "needs_review", "converted"]}
            onChange={(value) => updateRaw("status", value as RawAnnouncementDraft["status"])}
          />
          <TextField label="排除原因" value={raw.excluded_reason} onChange={(value) => updateRaw("excluded_reason", value)} />
          <TextAreaField label="審核備註" value={raw.review_notes} onChange={(value) => updateRaw("review_notes", value)} />
        </section>

        <aside className="space-y-4">
          <section className="section-card space-y-3">
            <h2 className="text-lg font-semibold">操作</h2>
            <button type="button" onClick={seedDraftFromRaw} className="w-full rounded-xl bg-[var(--action)] px-4 py-3 text-sm font-semibold text-[var(--paper)]">
              帶入 draft
            </button>
            <button type="button" onClick={saveLocalDraft} className="w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm font-semibold text-[var(--action)]">
              儲存本機草稿
            </button>
            <button type="button" onClick={resetAll} className="w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm font-semibold text-[var(--muted)]">
              清空
            </button>
            {copied ? <p className="text-sm font-semibold text-[var(--action)]">{copied}</p> : null}
          </section>

          <section className="section-card space-y-3">
            <h2 className="text-lg font-semibold">輸出</h2>
            <button type="button" onClick={() => copyText("raw JSON", rawJson)} className="w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm font-semibold text-[var(--action)]">
              複製 raw JSON
            </button>
            <button type="button" onClick={() => copyText("raw SQL", rawSql)} className="w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm font-semibold text-[var(--action)]">
              複製 raw SQL
            </button>
            <button type="button" onClick={() => copyText("draft JSON", draftJson)} className="w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm font-semibold text-[var(--action)]">
              複製 draft JSON
            </button>
            <button type="button" onClick={() => copyText("draft SQL", draftSql)} className="w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm font-semibold text-[var(--action)]">
              複製 draft SQL
            </button>
          </section>
        </aside>

        <section className="section-card space-y-4 lg:col-span-2">
          <h2 className="text-lg font-semibold">draft competition</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="raw_announcement_id" value={draft.raw_announcement_id} onChange={(value) => updateDraft("raw_announcement_id", value)} />
            <SelectField label="draft 狀態" value={draft.draft_status} options={["needs_review", "ready_to_publish", "published", "rejected"]} onChange={(value) => updateDraft("draft_status", value as DraftCompetitionDraft["draft_status"])} />
          </div>
          <TextField label="標題" value={draft.title} onChange={(value) => updateDraft("title", value)} />
          <div className="grid gap-3 sm:grid-cols-3">
            <SelectField label="機會類型" value={draft.opportunity_type} options={opportunityTypes} onChange={(value) => updateDraft("opportunity_type", value as OpportunityType)} />
            <TextField label="截止日" type="date" value={draft.deadline} onChange={(value) => updateDraft("deadline", value)} />
            <TextField label="主辦單位" value={draft.organizer} onChange={(value) => updateDraft("organizer", value)} />
          </div>
          <TextField label="官方簡章連結" value={draft.source_url} onChange={(value) => updateDraft("source_url", value)} />
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="series_key" value={draft.series_key} onChange={(value) => updateDraft("series_key", value)} />
            <TextField label="instance_key" value={draft.instance_key} onChange={(value) => updateDraft("instance_key", value)} />
          </div>
          <ChipSelector label="主題領域" options={topicAreas} value={draft.topic_areas} onChange={(value) => updateDraft("topic_areas", value as TopicArea[])} />
          <TextAreaField label="主題 tag" value={toListText(draft.category_tags)} onChange={(value) => updateDraft("category_tags", splitList(value))} />
          <ChipSelector label="能力 tag" options={skills} value={draft.skill_tags} onChange={(value) => updateDraft("skill_tags", value)} />
          <ChipSelector label="交件形式" options={submissionTypes} value={draft.submission_types} onChange={(value) => updateDraft("submission_types", value)} />
          <TextAreaField label="第一階段交件內容" value={toListText(draft.first_stage_deliverables)} onChange={(value) => updateDraft("first_stage_deliverables", splitList(value))} />
          <TextAreaField label="資格文字" value={draft.eligibility_text} onChange={(value) => updateDraft("eligibility_text", value)} />
          <div className="grid gap-3 sm:grid-cols-3">
            <TextField label="學校限制" value={draft.school_limit} onChange={(value) => updateDraft("school_limit", value)} />
            <TextField label="系所限制" value={draft.department_limit} onChange={(value) => updateDraft("department_limit", value)} />
            <TextField label="年級限制" value={draft.grade_limit} onChange={(value) => updateDraft("grade_limit", value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="獎金文字" value={draft.prize_text} onChange={(value) => updateDraft("prize_text", value)} />
            <TextField label="最高金額" type="number" value={String(draft.max_prize_amount || "")} onChange={(value) => updateDraft("max_prize_amount", Number(value))} />
          </div>
          <ChipSelector label="獎勵形式" options={rewardTypes} value={draft.reward_types} onChange={(value) => updateDraft("reward_types", value as RewardType[])} />
          <TextAreaField label="摘要" value={draft.summary} onChange={(value) => updateDraft("summary", value)} />
          <TextAreaField label="特別注意" value={toListText(draft.special_notes)} onChange={(value) => updateDraft("special_notes", splitList(value))} />
          <TextField label="參賽方式" value={draft.participation_text} onChange={(value) => updateDraft("participation_text", value)} />
          <TextAreaField label="時程" value={toScheduleText(draft.schedule)} placeholder="7/15｜報名截止" onChange={(value) => updateDraft("schedule", parseSchedule(value))} />
          <TextAreaField label="評分方向" value={draft.judging_text} onChange={(value) => updateDraft("judging_text", value)} />
          <TextAreaField label="審核備註" value={draft.reviewer_notes} onChange={(value) => updateDraft("reviewer_notes", value)} />
        </section>
      </div>
    </main>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-[var(--text)]">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-3 py-3 text-sm font-semibold text-[var(--text)]"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-[var(--text)]">{label}</span>
      <textarea
        value={value}
        placeholder={placeholder}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-3 py-3 text-sm font-semibold leading-6 text-[var(--text)]"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-[var(--text)]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-3 py-3 text-sm font-semibold text-[var(--text)]"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
