"use client";

import { useEffect, useState } from "react";
import { getSavedOpportunityIds, isOpportunitySaved, setSavedOpportunityIds, toggleSavedOpportunity } from "@/src/lib/localStorage";
import { getCurrentSavedUserId, isCloudOpportunitySaved, setCloudSavedOpportunity } from "@/src/lib/savedOpportunities";

export function SaveButton({ opportunityId, compact = false }: { opportunityId: string; compact?: boolean }) {
  const [saved, setSaved] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<"idle" | "syncing" | "error">("idle");

  useEffect(() => {
    setSaved(isOpportunitySaved(opportunityId));

    getCurrentSavedUserId()
      .then(async (currentUserId) => {
        setUserId(currentUserId);

        if (!currentUserId) {
          return;
        }

        const cloudSaved = await isCloudOpportunitySaved(currentUserId, opportunityId);

        if (cloudSaved) {
          setSaved(true);
          setSavedOpportunityIds([...getSavedOpportunityIds(), opportunityId]);
        }
      })
      .catch(() => setUserId(null));
  }, [opportunityId]);

  async function handleToggle() {
    const nextSaved = toggleSavedOpportunity(opportunityId).includes(opportunityId);
    setSaved(nextSaved);

    if (!userId) {
      return;
    }

    setSyncState("syncing");

    try {
      await setCloudSavedOpportunity(userId, opportunityId, nextSaved);
      setSyncState("idle");
    } catch {
      setSyncState("error");
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={
        compact
          ? "rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-xs font-semibold text-[var(--muted)]"
          : "rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm font-semibold text-[var(--muted)]"
      }
      title={syncState === "error" ? "雲端同步失敗，已先保留在本機收藏。" : undefined}
    >
      {syncState === "syncing" ? "同步中" : saved ? "已收藏" : "收藏"}
    </button>
  );
}
