"use client";

import { getSavedOpportunityIds, setSavedOpportunityIds } from "@/src/lib/localStorage";
import { getSupabaseAuthClient, hasSupabaseAuthConfig } from "@/src/lib/supabase/auth-client";

type SavedCompetitionRow = {
  opportunity_id: string;
};

export async function getCurrentSavedUserId() {
  if (!hasSupabaseAuthConfig()) {
    return null;
  }

  const { data, error } = await getSupabaseAuthClient().auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return data.user.id;
}

export async function getCloudSavedOpportunityIds(userId: string) {
  const { data, error } = await getSupabaseAuthClient()
    .from("saved_competitions")
    .select("opportunity_id")
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return ((data ?? []) as SavedCompetitionRow[]).map((row) => row.opportunity_id);
}

export async function isCloudOpportunitySaved(userId: string, opportunityId: string) {
  const { data, error } = await getSupabaseAuthClient()
    .from("saved_competitions")
    .select("opportunity_id")
    .eq("user_id", userId)
    .eq("opportunity_id", opportunityId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
}

export async function mergeLocalSavedToCloud(userId: string) {
  const localIds = getSavedOpportunityIds();
  const cloudIds = await getCloudSavedOpportunityIds(userId);
  const mergedIds = Array.from(new Set([...cloudIds, ...localIds]));
  const missingCloudIds = mergedIds.filter((id) => !cloudIds.includes(id));

  if (missingCloudIds.length > 0) {
    const { error } = await getSupabaseAuthClient()
      .from("saved_competitions")
      .upsert(
        missingCloudIds.map((id) => ({
          user_id: userId,
          opportunity_id: id,
        })),
        { onConflict: "user_id,opportunity_id" },
      );

    if (error) {
      throw error;
    }
  }

  setSavedOpportunityIds(mergedIds);
  return mergedIds;
}

export async function setCloudSavedOpportunity(userId: string, opportunityId: string, saved: boolean) {
  if (saved) {
    const { error } = await getSupabaseAuthClient()
      .from("saved_competitions")
      .upsert(
        {
          user_id: userId,
          opportunity_id: opportunityId,
        },
        { onConflict: "user_id,opportunity_id" },
      );

    if (error) {
      throw error;
    }

    return;
  }

  const { error } = await getSupabaseAuthClient()
    .from("saved_competitions")
    .delete()
    .eq("user_id", userId)
    .eq("opportunity_id", opportunityId);

  if (error) {
    throw error;
  }
}
