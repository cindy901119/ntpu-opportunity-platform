"use client";

import { getPreferences, savePreferences } from "@/src/lib/localStorage";
import { getSupabaseAuthClient, hasSupabaseAuthConfig } from "@/src/lib/supabase/auth-client";
import type { UserProfile } from "@/src/types";

type ProfileDbRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  school: string;
  major_department: string;
  grade: string;
  double_major_department: string | null;
  minor_department: string | null;
};

export function profileFromDb(row: ProfileDbRow): UserProfile {
  return {
    school: row.school,
    majorDepartment: row.major_department,
    grade: row.grade,
    doubleMajorDepartment: row.double_major_department ?? "",
    minorDepartment: row.minor_department ?? "",
  };
}

export async function getCloudProfileForCurrentUser() {
  if (!hasSupabaseAuthConfig()) {
    return null;
  }

  const supabase = getSupabaseAuthClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,display_name,school,major_department,grade,double_major_department,minor_department")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    user: userData.user,
    profile: profileFromDb(data as ProfileDbRow),
  };
}

export async function mergeCloudProfileToLocalPreferences() {
  const cloud = await getCloudProfileForCurrentUser();

  if (!cloud) {
    return null;
  }

  const merged = {
    ...getPreferences(),
    profile: cloud.profile,
  };

  savePreferences(merged);
  return merged;
}

export async function saveProfileForCurrentUser(profile: UserProfile) {
  if (!hasSupabaseAuthConfig()) {
    return "signed-out" as const;
  }

  const supabase = getSupabaseAuthClient();
  const { data, error: userError } = await supabase.auth.getUser();

  if (userError || !data.user) {
    return "signed-out" as const;
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      id: data.user.id,
      email: data.user.email ?? null,
      display_name: data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? null,
      school: profile.school,
      major_department: profile.majorDepartment,
      grade: profile.grade,
      double_major_department: profile.doubleMajorDepartment || null,
      minor_department: profile.minorDepartment || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  return error ? ("error" as const) : ("saved" as const);
}
