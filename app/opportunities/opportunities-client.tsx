"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { OpportunityCard } from "@/src/components/OpportunityCard";
import { Tag } from "@/src/components/Tag";
import { getDaysUntilDeadline } from "@/src/lib/format";
import { defaultPreferences, getPreferences, savePreferences } from "@/src/lib/localStorage";
import { getRecommendations } from "@/src/lib/recommendations";
import type { Opportunity, UserPreferences } from "@/src/types";

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
  const activeFilters = effectivePreferences
    ? [
        ...effectivePreferences.preferredOpportunityTypes,
        ...effectivePreferences.topicAreas,
        ...effectivePreferences.deadlineFilters,
        ...effectivePreferences.rewardTypes,
        effectivePreferences.maxPrizeAmount ? `最高獎金 ${effectivePreferences.maxPrizeAmount.toLocaleString()}+` : "",
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
        <div className="mx-auto max-w-[760px]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold tracking-wide">北大機會雷達</h1>
              <p className="mt-1 text-sm text-[var(--muted)]">先看能不能報，再看值不值得報</p>
            </div>
            <Link
              href="/preferences"
              className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm font-semibold text-[var(--action)]"
            >
              篩選
            </Link>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {(filtersRelaxed ? ["已放寬篩選"] : activeFilters.length ? activeFilters : ["尚未設定篩選"]).map((chip) => (
              <Tag key={chip} tone="active">
                {chip}
              </Tag>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[760px] px-4 py-5">
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
            {includeExpired ? "已包含截止" : expiredCount ? `顯示已截止 ${expiredCount}` : "已截止 0"}
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
          <div className="grid gap-3 md:grid-cols-2">
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
