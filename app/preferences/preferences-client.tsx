"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChipSelector } from "@/src/components/ChipSelector";
import { defaultPreferences, getPreferences, savePreferences } from "@/src/lib/localStorage";
import { mergeCloudPreferencesToLocal, saveCloudPreferences } from "@/src/lib/preferenceSync";
import type { DeadlineFilter, OpportunityType, RewardType, TopicArea, UserPreferences } from "@/src/types";

const schools = ["國立臺北大學", "國立臺北科技大學", "臺北醫學大學", "國立臺灣海洋大學"];
const departments = ["金融系", "法律系", "企業管理學系", "資訊工程學系", "公共行政暨政策學系"];
const grades = ["大一", "大二", "大三", "大四", "碩一", "碩二"];
const interests = ["AI", "SDGs", "金融", "法律", "校園生活", "創業", "公共議題"];
const skills = ["企劃", "簡報", "寫作", "影片剪輯", "設計", "程式", "資料分析"];
const opportunityTypes: OpportunityType[] = ["比賽", "獎學金", "補助／計畫", "其他"];
const topicAreas: TopicArea[] = ["商業／企劃", "創業／新創", "科技／程式", "法政／公共議題", "社會／永續", "不限／不適用", "人文／寫作", "語言／國際", "設計／創作", "其他"];
const deadlineFilters: DeadlineFilter[] = ["三天內", "一週內", "一個月內", "一個月以上", "截止日未明"];
const rewardTypes: RewardType[] = ["獎金", "獎學金", "補助", "實體資源", "曝光", "證書"];
type ArrayPreferenceKey = "interests" | "skills" | "preferredOpportunityTypes" | "topicAreas" | "deadlineFilters" | "rewardTypes" | "preferredSubmissionTypes" | "highlightTags";
const prizeOptions = [
  { label: "不限", value: 0 },
  { label: "至少 10,000 元", value: 10000 },
  { label: "至少 30,000 元", value: 30000 },
  { label: "至少 50,000 元", value: 50000 },
  { label: "至少 80,000 元", value: 80000 },
];
const submissionTypes = ["申請表", "證明文件", "企劃書", "簡報", "影片", "作品集", "程式／Demo"];
const highlightTags = ["有獎金", "北大限定", "北聯大限定", "可累積作品集", "可個人參加", "可組隊", "線上繳交"];

export function PreferencesClient() {
  const [form, setForm] = useState<UserPreferences>(defaultPreferences);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncMessage, setSyncMessage] = useState("偏好會先存在這台瀏覽器。");
  const isGraduate = form.profile.grade === "碩一" || form.profile.grade === "碩二";

  useEffect(() => {
    setForm(getPreferences());

    mergeCloudPreferencesToLocal()
      .then((result) => {
        setForm(result.preferences);

        if (result.status === "cloud-loaded") {
          setSyncMessage("已讀取雲端偏好。");
          return;
        }

        if (result.status === "local-seeded") {
          setSyncMessage("已登入，已用本機偏好建立雲端偏好。");
          return;
        }

        if (result.status === "error") {
          setSyncMessage("雲端偏好讀取失敗，已先使用本機設定。");
          return;
        }

        setSyncMessage("偏好會先存在這台瀏覽器。登入後可同步到雲端。");
      })
      .catch(() => {
        setSyncMessage("雲端偏好讀取失敗，已先使用本機設定。");
      });
  }, []);

  function updateProfile(key: keyof UserPreferences["profile"], value: string) {
    setSaved(false);
    setForm((current) => ({
      ...current,
      profile: {
        ...current.profile,
        [key]: value,
      },
    }));
  }

  function updateArray(key: ArrayPreferenceKey, value: string[]) {
    setSaved(false);
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateNumber(key: keyof Pick<UserPreferences, "maxPrizeAmount">, value: number) {
    setSaved(false);
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function submit() {
    setSaving(true);
    savePreferences(form);
    const syncResult = await saveCloudPreferences(form);
    setSaving(false);
    setSaved(true);

    if (syncResult === "saved") {
      setSyncMessage("偏好已存在本機，也已同步到雲端。");
      return;
    }

    if (syncResult === "profile-error") {
      setSyncMessage("偏好已同步到雲端，但基本資格 profile 同步失敗，請確認 profiles schema。");
      return;
    }

    if (syncResult === "error") {
      setSyncMessage("偏好已存在本機，但雲端同步失敗，請確認 user_preferences schema。");
      return;
    }

    setSyncMessage("偏好已存在本機。登入後可同步到雲端。");
  }

  return (
    <main className="mx-auto max-w-[760px] px-4 py-5">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold">設定偏好</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          資格會影響能不能報，偏好會影響推薦排序。
        </p>
        <p className="mt-2 text-sm leading-6 text-[var(--info)]">{syncMessage}</p>
      </div>

      <div className="space-y-4">
        <section className="section-card space-y-4">
          <h2 className="text-lg font-semibold">我的資格</h2>
          <SelectField label="學校" value={form.profile.school} options={schools} onChange={(value) => updateProfile("school", value)} />
          <SelectField
            label="主修系所"
            value={form.profile.majorDepartment}
            options={departments}
            onChange={(value) => updateProfile("majorDepartment", value)}
          />
          <SelectField label="年級" value={form.profile.grade} options={grades} onChange={(value) => updateProfile("grade", value)} />

          {!isGraduate ? (
            <>
              <SelectField
                label="雙主修"
                value={form.profile.doubleMajorDepartment ?? ""}
                options={["", ...departments]}
                onChange={(value) => updateProfile("doubleMajorDepartment", value)}
                emptyLabel="沒有或暫不填"
              />
              <SelectField
                label="輔系"
                value={form.profile.minorDepartment ?? ""}
                options={["", ...departments]}
                onChange={(value) => updateProfile("minorDepartment", value)}
                emptyLabel="沒有或暫不填"
              />
            </>
          ) : (
            <p className="rounded-2xl border border-[var(--line)] bg-[var(--paper-2)] p-3 text-sm leading-6 text-[var(--muted)]">
              碩士班可略過雙主修與輔系欄位。
            </p>
          )}
        </section>

        <section className="section-card space-y-5">
          <h2 className="text-lg font-semibold">篩選條件</h2>
          <ChipSelector
            label="機會類型"
            options={opportunityTypes}
            value={form.preferredOpportunityTypes}
            onChange={(value) => updateArray("preferredOpportunityTypes", value)}
          />
          <ChipSelector label="主題領域" options={topicAreas} value={form.topicAreas} onChange={(value) => updateArray("topicAreas", value)} />
          <ChipSelector label="截止時間" options={deadlineFilters} value={form.deadlineFilters} onChange={(value) => updateArray("deadlineFilters", value)} />
          <ChipSelector label="獎勵形式" options={rewardTypes} value={form.rewardTypes} onChange={(value) => updateArray("rewardTypes", value)} />
          <SelectField
            label="最高獎金"
            value={String(form.maxPrizeAmount ?? 0)}
            options={prizeOptions.map((option) => String(option.value))}
            onChange={(value) => updateNumber("maxPrizeAmount", Number(value))}
            optionLabels={Object.fromEntries(prizeOptions.map((option) => [String(option.value), option.label]))}
          />
        </section>

        <section className="section-card space-y-5">
          <h2 className="text-lg font-semibold">我的偏好</h2>
          <ChipSelector label="感興趣關鍵字" options={interests} value={form.interests} onChange={(value) => updateArray("interests", value)} />
          <ChipSelector label="能力" options={skills} value={form.skills} onChange={(value) => updateArray("skills", value)} />
          <ChipSelector
            label="交件形式"
            options={submissionTypes}
            value={form.preferredSubmissionTypes}
            onChange={(value) => updateArray("preferredSubmissionTypes", value)}
          />
          <ChipSelector label="重視條件" options={highlightTags} value={form.highlightTags} onChange={(value) => updateArray("highlightTags", value)} />
        </section>
      </div>

      <div className="sticky bottom-0 -mx-4 mt-5 flex gap-2 border-t border-[var(--line)] bg-[var(--paper-2)] px-4 py-3">
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="flex-1 rounded-2xl bg-[var(--action)] px-4 py-3 font-semibold text-[var(--paper)] disabled:opacity-60"
        >
          {saving ? "儲存中" : "儲存設定"}
        </button>
        <Link href="/opportunities" className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 font-semibold text-[var(--action)]">
          回到機會
        </Link>
      </div>

      {saved ? <p className="mt-3 text-center text-sm font-semibold text-[var(--action)]">已儲存偏好。</p> : null}
    </main>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
  emptyLabel,
  optionLabels,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  emptyLabel?: string;
  optionLabels?: Record<string, string>;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-3 py-3 text-sm font-bold text-[var(--text)]"
      >
        {options.map((option) => (
          <option key={option || "empty"} value={option}>
            {optionLabels?.[option] ?? (option || emptyLabel || "未填")}
          </option>
        ))}
      </select>
    </label>
  );
}
