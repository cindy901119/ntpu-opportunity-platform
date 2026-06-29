"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChipSelector } from "@/src/components/ChipSelector";
import {
  getDefaultDepartmentForSchool,
  getDepartmentUnitsForSchool,
  inferCollege,
  isDepartmentSearchMatch,
} from "@/src/data/departmentCatalog";
import { defaultPreferences, getPreferences, savePreferences } from "@/src/lib/localStorage";
import { mergeCloudPreferencesToLocal, saveCloudPreferences } from "@/src/lib/preferenceSync";
import type { DeadlineFilter, OpportunityType, RewardType, TopicArea, UserPreferences } from "@/src/types";

const schools = ["國立臺北大學"];
const grades = ["大一", "大二", "大三", "大四", "碩一", "碩二"];
const interests = ["AI", "SDGs", "金融", "法律", "校園生活", "創業", "公共議題"];
const skills = ["企劃", "簡報", "寫作", "影片剪輯", "設計", "程式", "資料分析"];
const opportunityTypes: OpportunityType[] = ["比賽", "獎學金", "補助／計畫", "其他"];
const primaryTopicAreas: TopicArea[] = ["商業／企劃", "創業／新創", "科技／程式", "法政／公共議題", "社會／永續", "不限／不適用"];
const moreTopicAreas: TopicArea[] = ["人文／寫作", "語言／國際", "設計／創作", "其他"];
const deadlineFilters: DeadlineFilter[] = ["三天內", "一週內", "一個月內", "一個月以上", "截止日未明"];
const rewardTypes: RewardType[] = ["獎金", "獎品", "證書", "補助", "無明確獎勵", "未寫清楚"];
type ArrayPreferenceKey = "interests" | "skills" | "preferredOpportunityTypes" | "topicAreas" | "deadlineFilters" | "rewardTypes" | "preferredSubmissionTypes" | "highlightTags";
const PRIZE_AMOUNT_LIMIT = 100000;
const PRIZE_AMOUNT_STEP = 1000;
const primarySubmissionTypes = ["申請表", "證明文件", "企劃書", "簡報", "影片"];
const moreSubmissionTypes = ["短文", "作品集", "程式／Demo"];
const highlightTags = ["北大限定", "北聯大限定", "可個人參加", "可組隊", "線上繳交"];

export function PreferencesClient() {
  const [form, setForm] = useState<UserPreferences>(defaultPreferences);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncMessage, setSyncMessage] = useState("偏好會先存在這台瀏覽器。");
  const [showMoreTopics, setShowMoreTopics] = useState(false);
  const [showMoreSubmissions, setShowMoreSubmissions] = useState(false);
  const isGraduate = form.profile.grade === "碩一" || form.profile.grade === "碩二";
  const departmentUnits = useMemo(() => getDepartmentUnitsForSchool(form.profile.school), [form.profile.school]);
  const topicAreaOptions = showMoreTopics ? [...primaryTopicAreas, ...moreTopicAreas] : primaryTopicAreas;
  const submissionTypeOptions = showMoreSubmissions ? [...primarySubmissionTypes, ...moreSubmissionTypes] : primarySubmissionTypes;
  const prizeMin = form.prizeAmountMin ?? form.maxPrizeAmount ?? 0;
  const prizeMax = form.prizeAmountMax ?? PRIZE_AMOUNT_LIMIT;
  const prizeUnlimited = prizeMin === 0 && prizeMax >= PRIZE_AMOUNT_LIMIT;

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
        ...(key === "school"
          ? {
              majorDepartment: getDefaultDepartmentForSchool(value),
              doubleMajorDepartment: "",
              minorDepartment: "",
            }
          : {}),
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

  function updatePrizeRange(nextMin: number, nextMax: number) {
    const min = Math.min(nextMin, nextMax);
    const max = Math.max(nextMin, nextMax);

    setSaved(false);
    setForm((current) => ({
      ...current,
      maxPrizeAmount: min,
      prizeAmountMin: min,
      prizeAmountMax: max,
    }));
  }

  function setPrizeUnlimited(checked: boolean) {
    setSaved(false);
    setForm((current) => ({
      ...current,
      maxPrizeAmount: checked ? 0 : 10000,
      prizeAmountMin: checked ? 0 : 10000,
      prizeAmountMax: PRIZE_AMOUNT_LIMIT,
    }));
  }

  async function submit() {
    setSaving(true);
    void inferCollege(form.profile.school, form.profile.majorDepartment);
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
    <main className="mx-auto max-w-[880px] px-4 py-5">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold">設定偏好</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          我的資格會影響能不能報的判斷；偏好只影響排序。建議確認資料正確，避免漏掉適合你的機會。
        </p>
        <p className="mt-2 text-sm leading-6 text-[var(--info)]">{syncMessage}</p>
      </div>

      <div className="space-y-4">
        <section className="section-card space-y-4">
          <h2 className="text-lg font-semibold">我的資格</h2>
          <SelectField label="學校" value={form.profile.school} options={schools} onChange={(value) => updateProfile("school", value)} />
          <DepartmentCombobox
            label="主修系所"
            value={form.profile.majorDepartment}
            departments={departmentUnits}
            onChange={(value) => updateProfile("majorDepartment", value)}
          />
          <SelectField label="年級" value={form.profile.grade} options={grades} onChange={(value) => updateProfile("grade", value)} />

          {!isGraduate ? (
            <>
              <OptionalDepartmentField
                label="雙主修"
                value={form.profile.doubleMajorDepartment ?? ""}
                departments={departmentUnits}
                onChange={(value) => updateProfile("doubleMajorDepartment", value)}
              />
              <OptionalDepartmentField
                label="輔系"
                value={form.profile.minorDepartment ?? ""}
                departments={departmentUnits}
                onChange={(value) => updateProfile("minorDepartment", value)}
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
          <ExpandableChipSelector
            label="主題領域"
            options={topicAreaOptions}
            value={form.topicAreas}
            onChange={(value) => updateArray("topicAreas", value)}
            expanded={showMoreTopics}
            onToggle={() => setShowMoreTopics((value) => !value)}
            hasMore
          />
          <ChipSelector label="截止時間" options={deadlineFilters} value={form.deadlineFilters} onChange={(value) => updateArray("deadlineFilters", value)} />
          <ChipSelector label="獎勵形式" options={rewardTypes} value={form.rewardTypes} onChange={(value) => updateArray("rewardTypes", value)} />
          <PrizeRangeField
            min={prizeMin}
            max={prizeMax}
            limit={PRIZE_AMOUNT_LIMIT}
            step={PRIZE_AMOUNT_STEP}
            unlimited={prizeUnlimited}
            onUnlimitedChange={setPrizeUnlimited}
            onChange={updatePrizeRange}
          />
        </section>

        <section className="section-card space-y-5">
          <h2 className="text-lg font-semibold">我的偏好</h2>
          <ChipSelector label="感興趣關鍵字" options={interests} value={form.interests} onChange={(value) => updateArray("interests", value)} />
          <ChipSelector label="我擅長／願意做的能力" options={skills} value={form.skills} onChange={(value) => updateArray("skills", value)} />
          <ExpandableChipSelector
            label="交件形式"
            options={submissionTypeOptions}
            value={form.preferredSubmissionTypes}
            onChange={(value) => updateArray("preferredSubmissionTypes", value)}
            expanded={showMoreSubmissions}
            onToggle={() => setShowMoreSubmissions((value) => !value)}
            hasMore
          />
          <ChipSelector label="報名條件偏好" options={highlightTags} value={form.highlightTags} onChange={(value) => updateArray("highlightTags", value)} />
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

function ExpandableChipSelector({
  label,
  options,
  value,
  onChange,
  expanded,
  onToggle,
  hasMore,
}: {
  label: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  expanded: boolean;
  onToggle: () => void;
  hasMore?: boolean;
}) {
  return (
    <div className="space-y-2">
      <ChipSelector label={label} options={options} value={value} onChange={onChange} />
      {hasMore ? (
        <button
          type="button"
          onClick={onToggle}
          className="text-sm font-semibold text-[var(--action)]"
        >
          {expanded ? "收起" : "展開更多"}
        </button>
      ) : null}
    </div>
  );
}

function PrizeRangeField({
  min,
  max,
  limit,
  step,
  unlimited,
  onUnlimitedChange,
  onChange,
}: {
  min: number;
  max: number;
  limit: number;
  step: number;
  unlimited: boolean;
  onUnlimitedChange: (checked: boolean) => void;
  onChange: (min: number, max: number) => void;
}) {
  return (
    <fieldset className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <legend className="text-sm font-semibold">最高獎金</legend>
        <label className="flex items-center gap-2 text-sm font-semibold text-[var(--muted)]">
          <input
            type="checkbox"
            checked={unlimited}
            onChange={(event) => onUnlimitedChange(event.target.checked)}
            className="h-4 w-4 accent-[var(--action)]"
          />
          不限
        </label>
      </div>
      <div className={`rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-3 ${unlimited ? "opacity-55" : ""}`}>
        <div className="mb-3 flex justify-between text-sm font-semibold text-[var(--text)]">
          <span>{unlimited ? "不限" : `${min.toLocaleString()} 元`}</span>
          <span>{unlimited ? "" : `${max.toLocaleString()} 元`}</span>
        </div>
        <label className="grid gap-1 text-xs font-semibold text-[var(--muted)]">
          最低
          <input
            type="range"
            min={0}
            max={limit}
            step={step}
            value={min}
            disabled={unlimited}
            onChange={(event) => onChange(Number(event.target.value), max)}
            className="accent-[var(--action)]"
          />
        </label>
        <label className="mt-3 grid gap-1 text-xs font-semibold text-[var(--muted)]">
          最高
          <input
            type="range"
            min={0}
            max={limit}
            step={step}
            value={max}
            disabled={unlimited}
            onChange={(event) => onChange(min, Number(event.target.value))}
            className="accent-[var(--action)]"
          />
        </label>
      </div>
    </fieldset>
  );
}

function OptionalDepartmentField({
  label,
  value,
  departments,
  onChange,
}: {
  label: string;
  value: string;
  departments: ReturnType<typeof getDepartmentUnitsForSchool>;
  onChange: (value: string) => void;
}) {
  const enabled = value.length > 0;

  function toggle(checked: boolean) {
    onChange(checked ? departments[0]?.name ?? "" : "");
  }

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-3">
      <label className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-[var(--text)]">{label}</span>
        <span className="flex items-center gap-2 text-sm font-semibold text-[var(--muted)]">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => toggle(event.target.checked)}
            className="h-4 w-4 accent-[var(--action)]"
          />
          {enabled ? "有" : "沒有"}
        </span>
      </label>
      {enabled ? (
        <div className="mt-3">
          <DepartmentCombobox label={`${label}系所`} value={value} departments={departments} onChange={onChange} compact />
        </div>
      ) : null}
    </div>
  );
}

function DepartmentCombobox({
  label,
  value,
  departments,
  onChange,
  compact = false,
}: {
  label: string;
  value: string;
  departments: ReturnType<typeof getDepartmentUnitsForSchool>;
  onChange: (value: string) => void;
  compact?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selectedDepartment = departments.find((department) => department.name === value);
  const filteredDepartments = departments.filter((department) => isDepartmentSearchMatch(department, query));
  const groupedDepartments = filteredDepartments.reduce<Record<string, typeof departments>>((groups, department) => {
    groups[department.college] = [...(groups[department.college] ?? []), department];
    return groups;
  }, {});
  const inputValue = open ? query : selectedDepartment?.name ?? value;

  function selectDepartment(name: string) {
    onChange(name);
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="grid gap-2">
      <label className="text-sm font-semibold" htmlFor={`${label}-combobox`}>
        {label}
      </label>
      <div className="relative">
        <input
          id={`${label}-combobox`}
          type="search"
          value={inputValue}
          placeholder="搜尋系所"
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          className={`w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-3 text-sm font-bold text-[var(--text)] outline-none focus:border-[var(--action)] ${
            compact ? "py-2.5" : "py-3"
          }`}
          role="combobox"
          aria-expanded={open}
          aria-controls={`${label}-options`}
          aria-autocomplete="list"
        />
        {open ? (
          <div
            id={`${label}-options`}
            className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-2 shadow-lg"
            role="listbox"
          >
            {filteredDepartments.length > 0 ? (
              Object.entries(groupedDepartments).map(([college, collegeDepartments]) => (
                <div key={college} className="py-1">
                  <p className="px-2 pb-1 text-xs font-semibold text-[var(--muted)]">{college}</p>
                  <div className="space-y-1">
                    {collegeDepartments.map((department) => (
                      <button
                        type="button"
                        key={department.name}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => selectDepartment(department.name)}
                        className="w-full rounded-xl px-2 py-2 text-left text-sm font-semibold text-[var(--text)] hover:bg-[var(--paper-2)]"
                        role="option"
                        aria-selected={department.name === value}
                      >
                        {department.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="px-2 py-3 text-sm text-[var(--muted)]">找不到符合的系所</p>
            )}
          </div>
        ) : null}
      </div>
    </div>
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
