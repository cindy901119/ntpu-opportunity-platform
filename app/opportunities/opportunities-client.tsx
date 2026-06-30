"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { OpportunityCard } from "@/src/components/OpportunityCard";
import { Tag } from "@/src/components/Tag";
import { getDaysUntilDeadline } from "@/src/lib/format";
import { defaultPreferences, getPreferences, savePreferences } from "@/src/lib/localStorage";
import { getRecommendations, isFilterGroupActive } from "@/src/lib/recommendations";
import type { Opportunity, UserPreferences } from "@/src/types";

const opportunityTypeOptions = ["比賽", "獎學金", "補助／計畫", "其他"];
const topicAreaOptions = ["商業／企劃", "創業／新創", "科技／程式", "法政／公共議題", "社會／永續", "不限／不適用", "人文／寫作", "語言／國際", "設計／創作", "其他"];
const deadlineFilterOptions = ["三天內", "一週內", "一個月內", "一個月以上", "截止日未明"];
const rewardTypeOptions = ["獎金", "獎品", "證書", "補助", "無明確獎勵", "未寫清楚"];

export function OpportunitiesClient({ opportunities }: { opportunities: Opportunity[] }) {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [filtersRelaxed, setFiltersRelaxed] = useState(false);
  const [includeExpired, setIncludeExpired] = useState(false);

  useEffect(() => {
    setPreferences(getPreferences());
  }, []);

  const effectivePreferences = useMemo(() => {
    if (!preferences || !filtersRelaxed) {
      return preferences;
    }

    return {
      ...preferences,
      preferredOpportunityTypes: [],
      topicAreas: [],
      deadlineFilters: [],
      rewardTypes: [],
      maxPrizeAmount: 0,
      prizeAmountMin: 0,
      prizeAmountMax: 0,
    };
  }, [filtersRelaxed, preferences]);

  const results = useMemo(
    () => (effectivePreferences ? getRecommendations(opportunities, effectivePreferences) : []),
    [effectivePreferences, opportunities],
  );
  const visibleResults = useMemo(
    () => results.filter((result) => includeExpired || (getDaysUntilDeadline(result.opportunity.deadline) ?? 0) >= 0),
    [includeExpired, results],
  );
  const expiredCount = results.length - visibleResults.length;
  const prizeMin = effectivePreferences?.prizeAmountMin ?? effectivePreferences?.maxPrizeAmount ?? 0;
  const prizeMax = effectivePreferences?.prizeAmountMax ?? 0;
  const activePrizeFilter = Boolean(prizeMin || (prizeMax && prizeMax < 100000));
  const activeFilters = effectivePreferences
    ? [
        ...(isFilterGroupActive(effectivePreferences.preferredOpportunityTypes, opportunityTypeOptions) ? effectivePreferences.preferredOpportunityTypes : []),
        ...(isFilterGroupActive(effectivePreferences.topicAreas, topicAreaOptions) ? effectivePreferences.topicAreas : []),
        ...(isFilterGroupActive(effectivePreferences.deadlineFilters, deadlineFilterOptions) ? effectivePreferences.deadlineFilters : []),
        ...(isFilterGroupActive(effectivePreferences.rewardTypes, rewardTypeOptions) ? effectivePreferences.rewardTypes : []),
        activePrizeFilter ? `獎金 ${prizeMin.toLocaleString()}-${(prizeMax || 100000).toLocaleString()}` : "",
      ].filter(Boolean).slice(0, 8)
    : [];

  function resetPreferences() {
    savePreferences(defaultPreferences);
    setPreferences(defaultPreferences);
    setFiltersRelaxed(false);
    setIncludeExpired(false);
  }

  return (
    <>
      <header className="border-b border-[var(--line)] bg-[rgba(236,229,217,.92)] px-4 py-4">
        <div className="mx-auto max-w-[1040px]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="mb-2 text-xs font-semibold text-[var(--muted)]">已套用條件</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {(filtersRelaxed ? ["已放寬篩選"] : activeFilters.length ? activeFilters : ["尚未設定篩選"]).map((chip) => (
                  <Tag key={chip} tone="active">
                    {chip}
                  </Tag>
                ))}
              </div>
            </div>
            <Link
              href="/preferences"
              className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm font-semibold text-[var(--action)]"
            >
              篩選
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1040px] px-4 py-5">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">推薦給你</h2>
            <p className="text-xs text-[var(--muted)]">依偏好即時排序</p>
          </div>
          <button
            type="button"
            onClick={() => setIncludeExpired((value) => !value)}
            className={`rounded-full border px-3 py-2 text-xs font-semibold ${
              includeExpired
                ? "border-[var(--action)] bg-[var(--action)] text-[var(--paper)]"
                : "border-[var(--line)] bg-[var(--paper)] text-[var(--muted)]"
            }`}
          >
            {includeExpired ? "隱藏已截止" : `顯示已截止（${expiredCount}）`}
          </button>
        </div>

        {preferences && visibleResults.length === 0 ? (
          <section className="rounded-[18px] border border-[var(--soft)] bg-[var(--paper)] p-5">
            <h3 className="text-lg font-semibold text-[var(--text)]">目前沒有符合這組條件的機會</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              可能是截止時間、獎勵形式或資格條件太窄。你可以先暫時放寬篩選、查看已截止資料，或回到偏好頁重新設定。
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-4">
              <button
                type="button"
                onClick={() => setFiltersRelaxed(true)}
                className="rounded-xl bg-[var(--action)] px-4 py-3 text-sm font-semibold text-[var(--paper)]"
              >
                放寬篩選
              </button>
              <button
                type="button"
                onClick={() => setIncludeExpired(true)}
                className="rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm font-semibold text-[var(--action)]"
              >
                顯示已截止
              </button>
              <button
                type="button"
                onClick={resetPreferences}
                className="rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm font-semibold text-[var(--action)]"
              >
                重設偏好
              </button>
              <Link
                href="/preferences"
                className="rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-center text-sm font-semibold text-[var(--muted)]"
              >
                調整偏好
              </Link>
            </div>
          </section>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {visibleResults.map((result) => (
              <OpportunityCard key={result.opportunity.id} result={result} />
            ))}
          </div>
        )}

        <section className="mt-5 rounded-[18px] border border-[var(--line)] bg-[var(--paper)] p-4 text-sm leading-6 text-[var(--muted)]">
          系統會先排除明確不符合資格的機會。資料若有需確認處，報名前請打開官方簡章確認完整規則。
        </section>
      </main>
    </>
  );
}
