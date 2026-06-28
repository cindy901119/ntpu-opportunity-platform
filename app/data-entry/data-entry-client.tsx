"use client";

import { useMemo, useState } from "react";
import { ChipSelector } from "@/src/components/ChipSelector";
import type { OpportunityType, RewardType, TopicArea } from "@/src/types";

type DraftCompetition = {
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
  status: "draft" | "published";
};

const topicAreas: TopicArea[] = ["商業／企劃", "創業／新創", "科技／程式", "法政／公共議題", "社會／永續", "不限／不適用", "人文／寫作", "語言／國際", "設計／創作", "其他"];
const opportunityTypes: OpportunityType[] = ["比賽", "獎學金", "補助／計畫", "其他"];
const rewardTypes: RewardType[] = ["獎金", "獎學金", "補助", "實體資源", "曝光", "證書"];
const skills = ["企劃", "簡報", "寫作", "影片剪輯", "設計", "程式", "資料分析"];
const submissionTypes = ["申請表", "證明文件", "企劃書", "簡報", "影片", "作品集", "程式／Demo"];

const initialDraft: DraftCompetition = {
  title: "",
  organizer: "",
  source_url: "",
  source_name: "",
  source_type: "manual_public_source",
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
  status: "draft",
};

const STORAGE_KEY = "bonus-hunter:data-entry-draft";

function splitLines(value: string) {
  return value
    .split(/\r?\n|、|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function toListText(value: string[]) {
  return value.join("\n");
}

function toScheduleText(value: DraftCompetition["schedule"]) {
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

function sqlString(value: string | null) {
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

function buildInsertSql(draft: DraftCompetition) {
  return `insert into public.competitions (
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
  status
) values (
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
  ${sqlString(draft.status)}
);`;
}

export function DataEntryClient() {
  const [draft, setDraft] = useState<DraftCompetition>(() => {
    if (typeof window === "undefined") {
      return initialDraft;
    }

    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      return saved ? { ...initialDraft, ...JSON.parse(saved) } : initialDraft;
    } catch {
      return initialDraft;
    }
  });
  const [copied, setCopied] = useState("");

  const jsonPreview = useMemo(() => JSON.stringify(draft, null, 2), [draft]);
  const sqlPreview = useMemo(() => buildInsertSql(draft), [draft]);
  const missingFields = [
    !draft.title ? "標題" : "",
    !draft.source_url ? "官方簡章連結" : "",
    !draft.deadline ? "截止日" : "",
    !draft.eligibility_text ? "資格文字" : "",
    !draft.summary ? "摘要" : "",
  ].filter(Boolean);

  function update<K extends keyof DraftCompetition>(key: K, value: DraftCompetition[K]) {
    setCopied("");
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function saveDraft() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    setCopied("草稿已存到這台瀏覽器。");
  }

  function resetDraft() {
    window.localStorage.removeItem(STORAGE_KEY);
    setDraft(initialDraft);
    setCopied("已清空草稿。");
  }

  async function copyText(label: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(`已複製${label}。`);
  }

  return (
    <main className="mx-auto max-w-[980px] px-4 py-5">
      <div className="mb-5">
        <p className="text-sm font-semibold text-[var(--action)]">v0.4-C</p>
        <h1 className="mt-1 text-2xl font-semibold">資料匯入工作台</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          先把公告整理成符合 `competitions` 的草稿。這個頁面不會寫入資料庫，確認後再複製 SQL 到 Supabase。
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <section className="section-card space-y-4">
          <h2 className="text-lg font-semibold">基本資料</h2>
          <TextField label="標題" value={draft.title} onChange={(value) => update("title", value)} />
          <TextField label="主辦單位" value={draft.organizer} onChange={(value) => update("organizer", value)} />
          <TextField label="官方簡章連結" value={draft.source_url} onChange={(value) => update("source_url", value)} />
          <div className="grid gap-3 sm:grid-cols-3">
            <SelectField label="機會類型" value={draft.opportunity_type} options={opportunityTypes} onChange={(value) => update("opportunity_type", value as OpportunityType)} />
            <TextField label="截止日" type="date" value={draft.deadline} onChange={(value) => update("deadline", value)} />
            <SelectField label="狀態" value={draft.status} options={["draft", "published"]} onChange={(value) => update("status", value as DraftCompetition["status"])} />
          </div>

          <ChipSelector label="主題領域" options={topicAreas} value={draft.topic_areas} onChange={(value) => update("topic_areas", value as TopicArea[])} />
          <TextAreaField label="主題 tag" value={toListText(draft.category_tags)} placeholder="AI&#10;金融&#10;校園生活" onChange={(value) => update("category_tags", splitLines(value))} />
          <ChipSelector label="能力 tag" options={skills} value={draft.skill_tags} onChange={(value) => update("skill_tags", value)} />
          <ChipSelector label="交件形式" options={submissionTypes} value={draft.submission_types} onChange={(value) => update("submission_types", value)} />
          <TextAreaField label="第一階段交件內容" value={toListText(draft.first_stage_deliverables)} placeholder="企劃書&#10;簡報&#10;Demo 連結" onChange={(value) => update("first_stage_deliverables", splitLines(value))} />
        </section>

        <section className="section-card space-y-4 lg:col-span-2">
          <h2 className="text-lg font-semibold">來源與去重</h2>
          <p className="text-sm leading-6 text-[var(--muted)]">
            這些欄位用來追蹤公告來源與避免重複匯入，人工確認後再貼到 Supabase。
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="來源名稱" value={draft.source_name} placeholder="國立臺北大學學務處課外組公告" onChange={(value) => update("source_name", value)} />
            <TextField label="來源類型" value={draft.source_type} placeholder="manual_public_source" onChange={(value) => update("source_type", value)} />
            <TextField label="公告日期" type="date" value={draft.source_posted_date} onChange={(value) => update("source_posted_date", value)} />
            <TextField label="抓取時間" value={draft.source_fetched_at} placeholder="2026-06-26T00:00:00+08:00" onChange={(value) => update("source_fetched_at", value)} />
            <TextField label="source_item_key" value={draft.source_item_key} placeholder="ntpu_osa_extracurricular:2026-04-15:kingcar-summer-sponsorship" onChange={(value) => update("source_item_key", value)} />
            <TextField label="source_content_hash" value={draft.source_content_hash} placeholder="manual-kingcar-2026-summer-v1" onChange={(value) => update("source_content_hash", value)} />
            <TextField label="series_key" value={draft.series_key} placeholder="kingcar-summer-sponsorship" onChange={(value) => update("series_key", value)} />
            <TextField label="instance_key" value={draft.instance_key} placeholder="2026-summer" onChange={(value) => update("instance_key", value)} />
          </div>
        </section>

        <aside className="space-y-4">
          <section className="section-card space-y-3">
            <h2 className="text-lg font-semibold">檢查</h2>
            {missingFields.length ? (
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper-2)] p-3 text-sm leading-6 text-[var(--attention)]">
                還缺：{missingFields.join("、")}
              </div>
            ) : (
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper-2)] p-3 text-sm leading-6 text-[var(--action)]">
                基本欄位已填，可以複製草稿。
              </div>
            )}
            <div className="grid gap-2">
              <button type="button" onClick={saveDraft} className="rounded-xl bg-[var(--action)] px-4 py-3 text-sm font-semibold text-[var(--paper)]">
                儲存草稿
              </button>
              <button type="button" onClick={resetDraft} className="rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm font-semibold text-[var(--muted)]">
                清空
              </button>
            </div>
            {copied ? <p className="text-sm font-semibold text-[var(--action)]">{copied}</p> : null}
          </section>

          <section className="section-card space-y-3">
            <h2 className="text-lg font-semibold">輸出</h2>
            <button type="button" onClick={() => copyText("JSON", jsonPreview)} className="w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm font-semibold text-[var(--action)]">
              複製 JSON
            </button>
            <button type="button" onClick={() => copyText("SQL", sqlPreview)} className="w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm font-semibold text-[var(--action)]">
              複製 SQL
            </button>
            <pre className="max-h-[460px] overflow-auto rounded-2xl border border-[var(--line)] bg-[var(--paper-2)] p-3 text-xs leading-5 text-[var(--text)]">
              {jsonPreview}
            </pre>
          </section>
        </aside>

        <section className="section-card space-y-4 lg:col-span-2">
          <h2 className="text-lg font-semibold">資格、獎金與時程</h2>
          <TextAreaField label="資格文字" value={draft.eligibility_text} onChange={(value) => update("eligibility_text", value)} />
          <div className="grid gap-3 sm:grid-cols-3">
            <TextField label="學校限制" value={draft.school_limit} placeholder="大專院校 / 國立臺北大學 / 臺北聯合大學系統 / 需確認" onChange={(value) => update("school_limit", value)} />
            <TextField label="系所限制" value={draft.department_limit} placeholder="不限 / 金融系、資訊工程學系" onChange={(value) => update("department_limit", value)} />
            <TextField label="年級限制" value={draft.grade_limit} placeholder="大一、大二、大三、大四、碩一、碩二" onChange={(value) => update("grade_limit", value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="獎金文字" value={draft.prize_text} placeholder="最高獎金 100,000 元" onChange={(value) => update("prize_text", value)} />
            <TextField label="最高金額" type="number" value={String(draft.max_prize_amount || "")} onChange={(value) => update("max_prize_amount", Number(value))} />
          </div>
          <ChipSelector label="獎勵形式" options={rewardTypes} value={draft.reward_types} onChange={(value) => update("reward_types", value as RewardType[])} />
          <TextAreaField label="摘要" value={draft.summary} onChange={(value) => update("summary", value)} />
          <TextAreaField label="特別注意" value={toListText(draft.special_notes)} placeholder="需附學生證明&#10;入圍後需現場簡報" onChange={(value) => update("special_notes", splitLines(value))} />
          <TextField label="參賽方式" value={draft.participation_text} placeholder="個人或 1–4 人團隊" onChange={(value) => update("participation_text", value)} />
          <TextAreaField label="時程" value={toScheduleText(draft.schedule)} placeholder="7/15｜報名截止&#10;8/20｜現場決賽簡報" onChange={(value) => update("schedule", parseSchedule(value))} />
          <TextAreaField label="評分方向" value={draft.judging_text} onChange={(value) => update("judging_text", value)} />
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-[var(--text)]">{label}</span>
      <textarea
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
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
