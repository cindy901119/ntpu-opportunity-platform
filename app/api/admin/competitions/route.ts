import { NextResponse } from "next/server";
import { getSupabaseServiceRoleClient, getUserFromRequest, hasSupabaseServiceRoleConfig } from "@/src/lib/supabase/server-auth";

const adminEmail = "cindy901119@gmail.com";

type AdminCompetitionPayload = {
  title?: string;
  organizer?: string;
  source_url?: string;
  source_name?: string;
  source_type?: string;
  source_posted_date?: string;
  source_fetched_at?: string;
  source_content_hash?: string;
  source_item_key?: string;
  series_key?: string;
  instance_key?: string;
  deadline?: string;
  opportunity_type?: string;
  topic_areas?: string[];
  category_tags?: string[];
  skill_tags?: string[];
  submission_types?: string[];
  first_stage_deliverables?: string[];
  eligibility_text?: string;
  school_limit?: string;
  department_limit?: string;
  grade_limit?: string;
  prize_text?: string;
  reward_types?: string[];
  max_prize_amount?: number;
  summary?: string;
  special_notes?: string[];
  participation_text?: string;
  schedule?: Array<{ date: string; label: string }>;
  judging_text?: string;
  status?: "draft" | "published";
};

function emptyToNull(value: string | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed || null;
}

function cleanStringArray(value: string[] | undefined) {
  return (value ?? []).map((item) => item.trim()).filter(Boolean);
}

function validatePayload(payload: AdminCompetitionPayload) {
  const missing = [
    !payload.title?.trim() ? "標題" : "",
    !payload.source_url?.trim() ? "官方簡章連結" : "",
    !payload.eligibility_text?.trim() ? "資格文字" : "",
    !payload.summary?.trim() ? "摘要" : "",
  ].filter(Boolean);

  if (missing.length) {
    return `缺少必要欄位：${missing.join("、")}`;
  }

  return null;
}

export async function POST(request: Request) {
  const { user } = await getUserFromRequest(request);

  if (user?.email?.toLowerCase() !== adminEmail) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  if (!hasSupabaseServiceRoleConfig()) {
    return NextResponse.json({ error: "service_role_not_configured" }, { status: 503 });
  }

  const payload = (await request.json()) as AdminCompetitionPayload;
  const validationError = validatePayload(payload);

  if (validationError) {
    return NextResponse.json({ error: "invalid_payload", detail: validationError }, { status: 400 });
  }

  const row = {
    title: payload.title?.trim(),
    organizer: emptyToNull(payload.organizer),
    source_url: payload.source_url?.trim(),
    source_name: emptyToNull(payload.source_name),
    source_type: emptyToNull(payload.source_type) ?? "manual_public_source",
    source_posted_date: emptyToNull(payload.source_posted_date),
    source_fetched_at: emptyToNull(payload.source_fetched_at) ?? new Date().toISOString(),
    source_content_hash: emptyToNull(payload.source_content_hash),
    source_item_key: emptyToNull(payload.source_item_key),
    series_key: emptyToNull(payload.series_key),
    instance_key: emptyToNull(payload.instance_key),
    deadline: emptyToNull(payload.deadline),
    opportunity_type: payload.opportunity_type ?? "其他",
    topic_areas: cleanStringArray(payload.topic_areas),
    category_tags: cleanStringArray(payload.category_tags),
    skill_tags: cleanStringArray(payload.skill_tags),
    submission_types: cleanStringArray(payload.submission_types),
    first_stage_deliverables: cleanStringArray(payload.first_stage_deliverables),
    eligibility_text: payload.eligibility_text?.trim(),
    school_limit: emptyToNull(payload.school_limit),
    department_limit: emptyToNull(payload.department_limit) ?? "不限",
    grade_limit: emptyToNull(payload.grade_limit),
    prize_text: emptyToNull(payload.prize_text) ?? "未寫清楚",
    reward_types: cleanStringArray(payload.reward_types),
    max_prize_amount: payload.max_prize_amount || null,
    summary: payload.summary?.trim(),
    special_notes: cleanStringArray(payload.special_notes),
    participation_text: emptyToNull(payload.participation_text),
    schedule: payload.schedule ?? [],
    judging_text: emptyToNull(payload.judging_text),
    status: payload.status ?? "draft",
  };

  const supabase = getSupabaseServiceRoleClient();
  let query;

  if (row.source_item_key) {
    const { data: existing, error: lookupError } = await supabase
      .from("competitions")
      .select("id")
      .eq("source_item_key", row.source_item_key)
      .maybeSingle();

    if (lookupError) {
      return NextResponse.json({ error: "database_lookup_failed", detail: lookupError.message }, { status: 500 });
    }

    query = existing
      ? supabase.from("competitions").update(row).eq("id", existing.id).select("id,title,status").single()
      : supabase.from("competitions").insert(row).select("id,title,status").single();
  } else {
    query = supabase.from("competitions").insert(row).select("id,title,status").single();
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: "database_write_failed", detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ status: "saved", competition: data });
}
