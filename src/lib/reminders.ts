"use client";

import { getSupabaseAuthClient, hasSupabaseAuthConfig } from "@/src/lib/supabase/auth-client";

export type ReminderSetting = {
  opportunityId: string;
  remindEnabled: boolean;
  remindDaysBefore: number[];
  preferredSendTime: string;
  notificationEmail: string;
  emailVerified: boolean;
};

type ReminderDbRow = {
  opportunity_id: string;
  remind_enabled: boolean;
  remind_days_before: number[] | null;
  preferred_send_time: string | null;
  notification_email: string | null;
  email_verified: boolean | null;
};

async function getCurrentReminderUser() {
  if (!hasSupabaseAuthConfig()) {
    return null;
  }

  const { data, error } = await getSupabaseAuthClient().auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return data.user;
}

export async function getReminderSetting(opportunityId: string) {
  const user = await getCurrentReminderUser();

  if (!user) {
    return { status: "signed-out" as const, userEmail: "", setting: null };
  }

  const { data, error } = await getSupabaseAuthClient()
    .from("reminder_settings")
    .select("opportunity_id,remind_enabled,remind_days_before,preferred_send_time,notification_email,email_verified")
    .eq("user_id", user.id)
    .eq("opportunity_id", opportunityId)
    .maybeSingle();

  if (error) {
    return { status: "error" as const, userEmail: user.email ?? "", setting: null };
  }

  if (!data) {
    return { status: "empty" as const, userEmail: user.email ?? "", setting: null };
  }

  const row = data as ReminderDbRow;

  return {
    status: "loaded" as const,
    userEmail: user.email ?? "",
    setting: {
      opportunityId: row.opportunity_id,
      remindEnabled: row.remind_enabled,
      remindDaysBefore: row.remind_days_before ?? [30, 14],
      preferredSendTime: row.preferred_send_time?.slice(0, 5) ?? "09:00",
      notificationEmail: row.notification_email ?? user.email ?? "",
      emailVerified: row.email_verified ?? false,
    },
  };
}

export async function saveReminderSetting(setting: ReminderSetting) {
  const user = await getCurrentReminderUser();

  if (!user) {
    return "signed-out" as const;
  }

  const { error } = await getSupabaseAuthClient().from("reminder_settings").upsert(
    {
      user_id: user.id,
      opportunity_id: setting.opportunityId,
      remind_enabled: setting.remindEnabled,
      remind_days_before: setting.remindDaysBefore,
      preferred_send_time: setting.preferredSendTime || "09:00",
      notification_email: setting.notificationEmail || user.email || null,
      email_verified: setting.emailVerified,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,opportunity_id" },
  );

  return error ? ("error" as const) : ("saved" as const);
}

export async function sendReminderTestEmail(setting: ReminderSetting) {
  const user = await getCurrentReminderUser();

  if (!user) {
    return { status: "signed-out" as const };
  }

  const { data } = await getSupabaseAuthClient().auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    return { status: "signed-out" as const };
  }

  const response = await fetch("/api/reminders/send-test", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      opportunityId: setting.opportunityId,
      email: setting.notificationEmail,
    }),
  });

  const responseData = (await response.json().catch(() => ({}))) as {
    error?: string;
    detail?: string;
    missing?: string[];
    persistenceWarning?: string | null;
  };

  if (response.status === 401) {
    return { status: "signed-out" as const };
  }

  if (response.status === 503) {
    return {
      status: "gmail-not-configured" as const,
      detail: responseData.missing?.length ? `缺少環境變數：${responseData.missing.join("、")}` : undefined,
    };
  }

  if (response.ok) {
    return {
      status: "sent" as const,
      persistenceWarning: responseData.persistenceWarning ?? null,
    };
  }

  return {
    status: "error" as const,
    detail: responseData.detail,
    error: responseData.error,
  };
}
