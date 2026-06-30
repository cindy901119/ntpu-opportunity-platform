import { NextResponse } from "next/server";
import { hasGmailConfig, sendGmailMessage } from "@/src/lib/gmail";
import { getSupabaseAdminClient, hasSupabaseAdminConfig } from "@/src/lib/supabase/admin";

type ReminderRow = {
  user_id: string;
  opportunity_id: string;
  remind_days_before: number[] | null;
  preferred_send_time: string | null;
  notification_email: string | null;
};

type CompetitionRow = {
  id: string;
  title: string;
  deadline: string | null;
  official_url: string | null;
  source_url: string | null;
};

const msPerDay = 24 * 60 * 60 * 1000;

function getCronSecret(request: Request) {
  const auth = request.headers.get("authorization") ?? "";
  const [scheme, token] = auth.split(" ");

  if (scheme?.toLowerCase() === "bearer" && token) {
    return token;
  }

  return new URL(request.url).searchParams.get("secret");
}

function isAuthorized(request: Request) {
  const expected = process.env.CRON_SECRET;

  if (!expected) {
    return false;
  }

  return getCronSecret(request) === expected;
}

function dateOnly(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function daysUntil(deadline: string) {
  const parsed = new Date(`${deadline}T00:00:00+08:00`);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return Math.ceil((dateOnly(parsed).getTime() - dateOnly(new Date()).getTime()) / msPerDay);
}

function shouldRespectSendTime(request: Request) {
  return new URL(request.url).searchParams.get("ignoreTime") !== "1";
}

function isWithinSendHour(preferredSendTime: string | null) {
  if (!preferredSendTime) {
    return true;
  }

  const hour = Number(preferredSendTime.slice(0, 2));

  if (!Number.isInteger(hour)) {
    return true;
  }

  const taipeiHour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      hour12: false,
      timeZone: "Asia/Taipei",
    }).format(new Date()),
  );

  return taipeiHour === hour;
}

function reminderText(row: ReminderRow, opportunity: CompetitionRow, leadDays: number) {
  const guideUrl = opportunity.official_url || opportunity.source_url || "";
  const guideLabel = opportunity.official_url ? "官方簡章" : "北大公告來源";

  return [
    `你追蹤的機會「${opportunity.title}」距離截止還有 ${leadDays} 天。`,
    "",
    `截止日：${opportunity.deadline ?? "待確認"}`,
    row.preferred_send_time ? `你設定的提醒時間：${row.preferred_send_time.slice(0, 5)}` : "",
    guideUrl ? `${guideLabel}：${guideUrl}` : "",
    "",
    "這封信是提早提醒你評估是否值得投入準備，報名前仍請以官方簡章為準。",
  ]
    .filter(Boolean)
    .join("\n");
}

async function handleRequest(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!hasSupabaseAdminConfig()) {
    return NextResponse.json({ error: "supabase_admin_not_configured" }, { status: 503 });
  }

  if (!hasGmailConfig()) {
    return NextResponse.json({ error: "gmail_not_configured" }, { status: 503 });
  }

  const supabase = getSupabaseAdminClient();
  const { data: settings, error: settingsError } = await supabase
    .from("reminder_settings")
    .select("user_id,opportunity_id,remind_days_before,preferred_send_time,notification_email")
    .eq("remind_enabled", true)
    .eq("email_verified", true)
    .not("notification_email", "is", null);

  if (settingsError) {
    return NextResponse.json({ error: "settings_query_failed" }, { status: 500 });
  }

  const rows = (settings ?? []) as ReminderRow[];
  const opportunityIds = Array.from(new Set(rows.map((row) => row.opportunity_id)));

  if (!opportunityIds.length) {
    return NextResponse.json({ checked: 0, sent: 0, failed: 0, skipped: 0 });
  }

  const { data: opportunities, error: opportunitiesError } = await supabase
    .from("competitions")
    .select("id,title,deadline,official_url,source_url")
    .eq("status", "published")
    .in("id", opportunityIds);

  if (opportunitiesError) {
    return NextResponse.json({ error: "opportunities_query_failed" }, { status: 500 });
  }

  const opportunitiesById = new Map((opportunities ?? []).map((row) => [row.id, row as CompetitionRow]));
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const row of rows) {
    const opportunity = opportunitiesById.get(row.opportunity_id);
    const leadDays = opportunity?.deadline ? daysUntil(opportunity.deadline) : null;
    const remindDays = row.remind_days_before ?? [];

    if (
      !opportunity ||
      leadDays === null ||
      leadDays < 0 ||
      !remindDays.includes(leadDays) ||
      (shouldRespectSendTime(request) && !isWithinSendHour(row.preferred_send_time))
    ) {
      skipped += 1;
      continue;
    }

    const { data: existingLog } = await supabase
      .from("notification_logs")
      .select("id")
      .eq("user_id", row.user_id)
      .eq("opportunity_id", row.opportunity_id)
      .eq("notification_type", "deadline_reminder")
      .eq("lead_days", leadDays)
      .eq("status", "sent")
      .maybeSingle();

    if (existingLog) {
      skipped += 1;
      continue;
    }

    try {
      const result = await sendGmailMessage({
        to: row.notification_email ?? "",
        subject: `北大機會雷達提醒｜${opportunity.title}`,
        text: reminderText(row, opportunity, leadDays),
      });

      await supabase.from("notification_logs").insert({
        user_id: row.user_id,
        opportunity_id: row.opportunity_id,
        notification_type: "deadline_reminder",
        sent_to: row.notification_email,
        provider: "gmail_api",
        provider_message_id: result.id ?? null,
        status: "sent",
        lead_days: leadDays,
        sent_at: new Date().toISOString(),
      });

      sent += 1;
    } catch (error) {
      await supabase.from("notification_logs").insert({
        user_id: row.user_id,
        opportunity_id: row.opportunity_id,
        notification_type: "deadline_reminder",
        sent_to: row.notification_email,
        provider: "gmail_api",
        status: "failed",
        lead_days: leadDays,
        error_message: error instanceof Error ? error.message.slice(0, 1000) : "Unknown error",
        sent_at: new Date().toISOString(),
      });

      failed += 1;
    }
  }

  return NextResponse.json({ checked: rows.length, sent, failed, skipped });
}

export async function GET(request: Request) {
  return handleRequest(request);
}

export async function POST(request: Request) {
  return handleRequest(request);
}
