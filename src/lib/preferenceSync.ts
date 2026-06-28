"use client";

import { getPreferences, savePreferences } from "@/src/lib/localStorage";
import { saveProfileForCurrentUser } from "@/src/lib/profileSync";
import { getSupabaseAuthClient, hasSupabaseAuthConfig } from "@/src/lib/supabase/auth-client";
import type { UserPreferences } from "@/src/types";

type PreferenceRow = {
  preferences: UserPreferences | Record<string, unknown> | null;
};

function mergeWithDefaults(preferences: UserPreferences): UserPreferences {
  return {
    ...getPreferences(),
    ...preferences,
    profile: {
      ...getPreferences().profile,
      ...(preferences.profile ?? {}),
    },
  };
}

async function getCurrentUserId() {
  if (!hasSupabaseAuthConfig()) {
    return null;
  }

  const { data, error } = await getSupabaseAuthClient().auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return data.user.id;
}

export async function mergeCloudPreferencesToLocal() {
  const userId = await getCurrentUserId();

  if (!userId) {
    return { status: "signed-out" as const, preferences: getPreferences() };
  }

  const supabase = getSupabaseAuthClient();
  const { data, error } = await supabase
    .from("user_preferences")
    .select("preferences")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return { status: "error" as const, preferences: getPreferences() };
  }

  if (!data?.preferences) {
    const local = getPreferences();
    await saveCloudPreferences(local);
    return { status: "local-seeded" as const, preferences: local };
  }

  const merged = mergeWithDefaults((data as PreferenceRow).preferences as UserPreferences);
  savePreferences(merged);
  return { status: "cloud-loaded" as const, preferences: merged };
}

export async function saveCloudPreferences(preferences: UserPreferences) {
  const userId = await getCurrentUserId();

  if (!userId) {
    return "signed-out" as const;
  }

  const supabase = getSupabaseAuthClient();
  const { error } = await supabase.from("user_preferences").upsert(
    {
      user_id: userId,
      preferences,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    return "error" as const;
  }

  const profileResult = await saveProfileForCurrentUser(preferences.profile);
  return profileResult === "error" ? ("profile-error" as const) : ("saved" as const);
}
