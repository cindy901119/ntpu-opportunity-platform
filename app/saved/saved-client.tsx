"use client";

import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/src/components/EmptyState";
import { OpportunityCard } from "@/src/components/OpportunityCard";
import { defaultPreferences, getPreferences, getSavedOpportunityIds } from "@/src/lib/localStorage";
import { getRecommendations } from "@/src/lib/recommendations";
import { getCurrentSavedUserId, mergeLocalSavedToCloud } from "@/src/lib/savedOpportunities";
import type { Opportunity, UserPreferences } from "@/src/types";

export function SavedClient({ opportunities }: { opportunities: Opportunity[] }) {
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [ready, setReady] = useState(false);
  const [syncMessage, setSyncMessage] = useState("收藏會先存在這台瀏覽器。");

  useEffect(() => {
    const refresh = () => setSavedIds(getSavedOpportunityIds());
    refresh();
    setPreferences(getPreferences());
    setReady(true);

    getCurrentSavedUserId()
      .then(async (userId) => {
        if (!userId) {
          setSyncMessage("收藏會先存在這台瀏覽器。登入後可同步到雲端。");
          return;
        }

        const mergedIds = await mergeLocalSavedToCloud(userId);
        setSavedIds(mergedIds);
        setSyncMessage("已登入，收藏會同步到雲端。");
      })
      .catch(() => {
        setSyncMessage("雲端收藏同步暫時失敗，本機收藏仍會保留。");
      });

    window.addEventListener("bonus-hunter:saved-updated", refresh);
    return () => window.removeEventListener("bonus-hunter:saved-updated", refresh);
  }, []);

  const results = useMemo(() => {
    const recommendations = getRecommendations(opportunities, preferences);

    return savedIds
      .map((id) => {
        const recommended = recommendations.find((result) => result.opportunity.id === id);
        if (recommended) {
          return recommended;
        }

        const opportunity = opportunities.find((item) => item.id === id);
        if (!opportunity) {
          return null;
        }

        return {
        opportunity,
        label: "需要再確認" as const,
        matchedReasons: ["這是你先前收藏的機會。"],
        preferenceMatches: opportunity.topicTags.concat(opportunity.skillTags).slice(0, 5),
        qualificationReasons: [opportunity.eligibilityText],
        warnings: opportunity.eligibilityRules.schoolScope === "需確認" ? ["公告資訊不完整，報名前建議確認官方簡章。"] : [],
          internalScore: 0,
        };
      })
      .filter((result): result is NonNullable<typeof result> => Boolean(result));
  }, [opportunities, preferences, savedIds]);

  return (
    <main className="mx-auto max-w-[1040px] px-4 py-5">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold">收藏</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{syncMessage}</p>
      </div>

      {ready && results.length === 0 ? (
        <EmptyState
          title="你還沒有收藏任何機會"
          description="看到想晚點再看的機會，可以先按收藏。"
          actionHref="/opportunities"
          actionLabel="去看機會"
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {results.map((result) => (
            <OpportunityCard key={result.opportunity.id} result={result} />
          ))}
        </div>
      )}
    </main>
  );
}
