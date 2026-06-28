"use client";

import Link from "next/link";
import { useState } from "react";
import { formatDeadline, getDeadlineTone, getPrizeTone, shortList } from "@/src/lib/format";
import type { Opportunity, RecommendationLabel } from "@/src/types";
import { RecommendationReason } from "./RecommendationReason";
import { SaveButton } from "./SaveButton";
import { RecommendationLabelTag, Tag } from "./Tag";

type OpportunityCardProps = {
  result: {
    opportunity: Opportunity;
    label: RecommendationLabel;
    matchedReasons: string[];
    preferenceMatches: string[];
    qualificationReasons: string[];
    warnings: string[];
  };
};

export function OpportunityCard({ result }: OpportunityCardProps) {
  const [open, setOpen] = useState(false);
  const { opportunity } = result;
  const deadlineTone = getDeadlineTone(opportunity.deadline);
  const prizeTone = getPrizeTone(opportunity.prizeText);

  return (
    <article className="rounded-[18px] border border-[var(--soft)] bg-[var(--paper)] p-4 shadow-[0_6px_18px_rgba(55,46,35,.045)]">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <RecommendationLabelTag label={result.label} />
      </div>

      <h2 className="mb-3 text-xl font-semibold leading-snug text-[var(--text)]">{opportunity.title}</h2>

      <div className="space-y-2 text-sm">
        <InfoRow label="截止">
          <span className={`info-chip info-chip-${deadlineTone}`}>
            {formatDeadline(opportunity.deadline)}
          </span>
        </InfoRow>
        <InfoRow label="獎金">
          <span className={`info-chip info-chip-${prizeTone}`}>{opportunity.prizeText}</span>
        </InfoRow>
        <InfoRow label="資格">{opportunity.eligibilityText}</InfoRow>
        <InfoRow label="交件">{shortList(opportunity.firstStageDeliverables, "交件待確認", 2)}</InfoRow>
      </div>

      <div className="mt-3">
        <div className="mb-1 text-sm font-semibold text-[var(--text)]">簡介</div>
        <p className="line-clamp-2 text-sm leading-6 text-[var(--muted)]">{opportunity.summary}</p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {opportunity.topicTags.concat(opportunity.skillTags).slice(0, 3).map((tag) => (
          <Tag key={tag}>{tag}</Tag>
        ))}
      </div>

      <div className="mt-4 border-t border-[var(--soft)] pt-3">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="text-sm font-semibold text-[var(--info)] underline underline-offset-4"
        >
          與你的設定相符 {open ? "▲" : "▼"}
        </button>
        {open ? (
          <RecommendationReason
            qualificationReasons={result.qualificationReasons}
            preferenceMatches={result.preferenceMatches}
            warnings={result.warnings}
          />
        ) : null}
      </div>

      <div className="mt-4 grid gap-2">
        <Link
          href={`/opportunities/${opportunity.id}`}
          className="rounded-xl bg-[var(--action)] px-3.5 py-2.5 text-center text-sm font-semibold text-[var(--paper)]"
        >
          查看詳情
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SaveButton opportunityId={opportunity.id} compact />
          <a
            href={opportunity.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-xs font-semibold text-[var(--info)]"
          >
            查看官方簡章
          </a>
        </div>
      </div>
    </article>
  );
}

function InfoRow({ label, children, valueClassName = "" }: { label: string; children: React.ReactNode; valueClassName?: string }) {
  return (
    <div className="grid grid-cols-[3.5rem_1fr] items-start gap-2.5">
      <span className="text-[var(--muted)]">{label}</span>
      <span className={`font-semibold leading-6 text-[var(--text)] ${valueClassName}`}>{children}</span>
    </div>
  );
}
