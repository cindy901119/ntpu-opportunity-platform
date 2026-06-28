import { NextResponse } from "next/server";
import { hasGmailConfig, sendGmailMessage } from "@/src/lib/gmail";
import { getSupabaseServerClient, getUserFromRequest } from "@/src/lib/supabase/server-auth";

type TestEmailRequest = {
  opportunityId?: string;
  email?: string;
};

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  const { token, user } = await getUserFromRequest(request);

  if (!token || !user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!hasGmailConfig()) {
    return NextResponse.json({ error: "gmail_not_configured" }, { status: 503 });
  }

  const body = (await request.json()) as TestEmailRequest;
  const email = body.email?.trim() ?? "";
  const opportunityId = body.opportunityId?.trim() ?? "";

  if (!opportunityId || !isEmail(email)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient(token);
  let providerMessageId: string | null = null;

  try {
    const result = await sendGmailMessage({
      to: email,
      subject: "北大機會雷達提醒測試信",
      text: [
        "這是一封提醒測試信。",
        "",
        "如果你收到這封信，代表這個 Email 可以接收北大機會雷達的提醒。",
        "正式提醒會依照你在機會詳情頁設定的提前天數與寄送時間寄出。",
        "",
        "這不是報名催促，也不會取代官方簡章。報名前仍請確認官方規則。",
      ].join("\n"),
    });

    providerMessageId = result.id ?? null;

    await supabase
      .from("reminder_settings")
      .update({
        notification_email: email,
        email_verified: true,
        email_test_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("opportunity_id", opportunityId);

    await supabase.from("notification_logs").insert({
      user_id: user.id,
      opportunity_id: opportunityId,
      notification_type: "email_test",
      sent_to: email,
      provider: "gmail_api",
      provider_message_id: providerMessageId,
      status: "sent",
      sent_at: new Date().toISOString(),
    });

    return NextResponse.json({ status: "sent", providerMessageId });
  } catch (error) {
    await supabase.from("notification_logs").insert({
      user_id: user.id,
      opportunity_id: opportunityId,
      notification_type: "email_test",
      sent_to: email,
      provider: "gmail_api",
      provider_message_id: providerMessageId,
      status: "failed",
      error_message: error instanceof Error ? error.message.slice(0, 1000) : "Unknown error",
      sent_at: new Date().toISOString(),
    });

    return NextResponse.json({ error: "send_failed" }, { status: 500 });
  }
}

