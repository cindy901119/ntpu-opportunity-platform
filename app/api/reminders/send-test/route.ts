import { NextResponse } from "next/server";
import { getMissingGmailConfig, hasGmailConfig, sendGmailMessage } from "@/src/lib/gmail";
import { getSupabaseServerClient, getUserFromRequest } from "@/src/lib/supabase/server-auth";

type TestEmailRequest = {
  opportunityId?: string;
  email?: string;
};

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function classifySendError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";

  if (message.includes("Gmail token exchange failed")) {
    return {
      code: "gmail_token_failed",
      detail: "Gmail 授權失敗，請重新產生 refresh token，並確認 scope 包含 gmail.send。",
    };
  }

  if (message.includes("Gmail send failed")) {
    return {
      code: "gmail_send_failed",
      detail: "Gmail API 拒絕寄送，請確認寄件帳號、Gmail API 權限與 OAuth consent screen。",
    };
  }

  return {
    code: "send_failed",
    detail: "測試信寄送失敗，請查看 Vercel logs 或 notification_logs。",
  };
}

export async function POST(request: Request) {
  const { token, user } = await getUserFromRequest(request);

  if (!token || !user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!hasGmailConfig()) {
    return NextResponse.json({ error: "gmail_not_configured", missing: getMissingGmailConfig() }, { status: 503 });
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
      subject: "鳶來有獎提醒測試信",
      text: [
        "這是一封提醒測試信。",
        "",
        "如果你收到這封信，代表這個 Email 可以接收鳶來有獎的提醒。",
        "正式提醒會依照你在機會詳情頁設定的提前天數與寄送時間寄出。",
        "",
        "這不是報名催促，也不會取代官方簡章。報名前仍請確認官方規則。",
      ].join("\n"),
    });

    providerMessageId = result.id ?? null;

    const { error: reminderError } = await supabase.from("reminder_settings").upsert(
      {
        user_id: user.id,
        opportunity_id: opportunityId,
        notification_email: email,
        email_verified: true,
        email_test_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,opportunity_id" },
    );

    const { error: logError } = await supabase.from("notification_logs").insert({
      user_id: user.id,
      opportunity_id: opportunityId,
      notification_type: "email_test",
      sent_to: email,
      provider: "gmail_api",
      provider_message_id: providerMessageId,
      status: "sent",
      sent_at: new Date().toISOString(),
    });

    return NextResponse.json({
      status: "sent",
      providerMessageId,
      persistenceWarning: reminderError || logError ? "email_sent_but_database_update_failed" : null,
    });
  } catch (error) {
    const classified = classifySendError(error);

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

    return NextResponse.json({ error: classified.code, detail: classified.detail }, { status: 500 });
  }
}
