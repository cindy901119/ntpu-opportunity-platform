import Link from "next/link";
import { notFound } from "next/navigation";
import { ReminderControl } from "@/src/components/ReminderControl";
import { SaveButton } from "@/src/components/SaveButton";
import { RecommendationLabelTag, Tag } from "@/src/components/Tag";
import { getCompetitionById, getPublishedCompetitions } from "@/src/lib/competitions";
import { formatDeadline, getDeadlineTone, getPrizeTone, shortList } from "@/src/lib/format";
import { defaultPreferences } from "@/src/lib/localStorage";
import { getRecommendations } from "@/src/lib/recommendations";

export const dynamic = "force-dynamic";

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const opportunity = await getCompetitionById(id);

  if (!opportunity) {
    notFound();
  }

  const recommendation = getRecommendations([opportunity], defaultPreferences)[0];
  const deadlineTone = getDeadlineTone(opportunity.deadline);
  const prizeTone = getPrizeTone(opportunity.prizeText);
  const officialUrl = opportunity.officialUrl ?? opportunity.sourceUrl;
  const opportunities = await getPublishedCompetitions();
  const similar = opportunities
    .filter((item) => item.id !== opportunity.id)
    .filter((item) => item.opportunityType === opportunity.opportunityType || item.topicTags.some((tag) => opportunity.topicTags.includes(tag)))
    .slice(0, 3);

  return (
    <div className="app-shell">
      <header className="sticky top-0 z-10 flex items-center gap-2.5 border-b border-[var(--line)] bg-[rgba(236,229,217,.94)] px-4 py-3 backdrop-blur">
        <Link
          href="/opportunities"
          className="grid h-9 w-9 place-items-center rounded-full border border-[var(--line)] bg-[var(--paper)] text-xl font-semibold text-[var(--muted)]"
        >
          ‹
        </Link>
        <div className="text-sm font-bold text-[var(--muted)]">機會詳情</div>
      </header>

      <section className="border-b border-[var(--line)] bg-[var(--paper)] px-4 py-5 md:px-7">
        <div className="mb-2.5 flex items-center justify-between gap-3">
          {recommendation ? <RecommendationLabelTag label={recommendation.label} /> : <Tag tone="muted">可以考慮</Tag>}
        </div>
        <h1 className="text-2xl font-semibold leading-snug text-[var(--text)]">{opportunity.title}</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">主辦單位：{opportunity.organizer}</p>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <KeyCard label="報名截止">
            <span className={`info-chip info-chip-${deadlineTone}`}>
              {formatDeadline(opportunity.deadline)}
            </span>
          </KeyCard>
          <KeyCard label="最高獎金">
            <span className={`info-chip info-chip-${prizeTone}`}>{opportunity.prizeText}</span>
          </KeyCard>
          <KeyCard label="參賽方式">{opportunity.participationText ?? "依官方簡章"}</KeyCard>
          <KeyCard label="主要交件">{shortList(opportunity.firstStageDeliverables, "待確認", 2)}</KeyCard>
        </div>
      </section>

      <main className="px-4 py-4 md:px-7">
        <div className="grid gap-3 md:grid-cols-2">
          <Section title="參賽資格">
            <Rows
              rows={[
                ["資格", opportunity.eligibilityText],
                ["學校", opportunity.eligibilityRules.allowedSchools?.join("、") ?? opportunity.eligibilityRules.schoolScope],
                ["系所", opportunity.eligibilityRules.allowedDepartments?.join("、") ?? "不限或依簡章"],
                ["年級", opportunity.eligibilityRules.allowedGrades?.join("、") ?? "依簡章"],
                ["組隊", opportunity.participationText ?? "依簡章"],
                ["指導老師", "資料未標示"],
              ]}
            />
          </Section>

          <Section title="交件內容">
            <ul className="space-y-1.5 pl-5 text-sm leading-7">
              {opportunity.firstStageDeliverables.map((item) => (
                <li key={item}>{item}</li>
              ))}
              <li>交件形式：{opportunity.submissionTypes.join("、")}</li>
            </ul>
          </Section>

          <Section title="特別注意">
            <ul className="space-y-1.5 pl-5 text-sm leading-7">
              {opportunity.specialNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </Section>

          <Section title="重要時程">
            {opportunity.schedule?.length ? (
              <div className="space-y-3">
                {opportunity.schedule.map((item) => (
                  <div key={`${item.date}-${item.label}`} className="grid grid-cols-[5rem_1fr] gap-3 text-sm">
                    <span className="text-[var(--muted)]">{item.date}</span>
                    <span className="font-bold leading-6">{item.label}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--muted)]">目前資料未提供更多時程。</p>
            )}
          </Section>

          <Section title="比賽內容" full>
            <Rows
              rows={[
                ["摘要", opportunity.summary],
                ["類型", opportunity.opportunityType],
                ["主題", opportunity.topicTags.join("、")],
                ["能力", opportunity.skillTags.join("、")],
                ...(opportunity.judgingText ? ([["評分", opportunity.judgingText]] as [string, string][]) : []),
              ]}
            />
          </Section>

          <Section title="與你的設定相符" full>
            <p className="text-sm leading-7">符合你目前選擇的偏好：</p>
            <p className="mt-1 font-semibold text-[var(--action)]">
              {recommendation?.preferenceMatches.length ? recommendation.preferenceMatches.join("、") : "可至偏好頁調整設定"}
            </p>
            {recommendation?.qualificationReasons.length ? (
              <ul className="mt-3 space-y-1.5 pl-5 text-sm leading-7">
                {recommendation.qualificationReasons.slice(0, 3).map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            ) : null}
            <p className="mt-3 rounded-2xl border border-[var(--line)] bg-[var(--paper-2)] p-3 text-sm leading-6 text-[var(--muted)]">
              這裡只呈現設定交集。實際資格與規則仍以官方簡章為準。
            </p>
          </Section>

          <Section title="官方資料" full>
            <Rows
              rows={[
                ["官方簡章", "報名前建議打開確認完整規則。"],
                ["官方連結", officialUrl],
                ["北大公告", opportunity.sourceUrl],
              ]}
            />
          </Section>

          <div className="md:col-span-2">
            <ReminderControl opportunityId={opportunity.id} />
          </div>

          <Section title="你可能也會有興趣…" full>
            <div className="space-y-2">
              {similar.map((item) => (
                <Link key={item.id} href={`/opportunities/${item.id}`} className="block rounded-2xl border border-[var(--line)] bg-[var(--paper-2)] p-3">
                  <div className="font-semibold">{item.title}</div>
                  <div className="mt-1 text-sm text-[var(--muted)]">
                    {formatDeadline(item.deadline)}｜{item.prizeText}
                  </div>
                </Link>
              ))}
            </div>
          </Section>
        </div>
      </main>

      <div className="sticky bottom-0 z-10 flex gap-2 border-t border-[var(--line)] bg-[var(--paper-2)] px-4 py-3">
        <SaveButton opportunityId={opportunity.id} />
        <a
          href={officialUrl}
          target="_blank"
          rel="noreferrer"
          className="flex-1 rounded-2xl bg-[var(--action)] px-4 py-3 text-center font-semibold text-[var(--paper)]"
        >
          查看官方簡章
        </a>
      </div>
    </div>
  );
}

function KeyCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-3">
      <div className="mb-1.5 text-xs text-[var(--muted)]">{label}</div>
      <div className="text-sm font-semibold leading-6">{children}</div>
    </div>
  );
}

function Section({ title, children, full = false }: { title: string; children: React.ReactNode; full?: boolean }) {
  return (
    <section className={`section-card ${full ? "md:col-span-2" : ""}`}>
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Rows({ rows }: { rows: [string, string][] }) {
  return (
    <div className="space-y-2">
      {rows.map(([label, value]) => (
        <div key={`${label}-${value}`} className="grid grid-cols-[5rem_1fr] gap-3 border-b border-[var(--line)] pb-2 text-sm last:border-b-0 last:pb-0">
          <span className="text-[var(--muted)]">{label}</span>
          <span className="font-semibold leading-6">{value}</span>
        </div>
      ))}
    </div>
  );
}
