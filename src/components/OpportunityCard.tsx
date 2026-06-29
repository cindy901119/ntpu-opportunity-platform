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
    <article className="flex h-full flex-col rounded-[18px] border border-[var(--soft)] bg-[var(--paper)] p-4 shadow-[0_6px_18px_rgba(55,46,35,.045)]">
      <div className="mb-2.5 flex min-h-8 items-center justify-between gap-3">
        <RecommendationLabelTag label={result.label} />
      </div>

      <h2 className="mb-3 text-xl font-semibold leading-snug text-[var(--text)]">{opportunity.title}</h2>

      <div className="space-y-2 text-sm">
        <InfoRow label="截止／獎金">
          <span className="flex flex-wrap gap-2">
            <span className={`info-chip info-chip-${deadlineTone}`}>{formatDeadline(opportunity.deadline)}</span>
            <span className={`info-chip info-chip-${prizeTone}`}>{opportunity.prizeText}</span>
          </span>
        </InfoRow>
        <InfoRow label="資格" valueClassName="line-clamp-2">{opportunity.eligibilityText}</InfoRow>
        <InfoRow label="交件" valueClassName="line-clamp-2">{shortList(opportunity.firstStageDeliverables, "交件待確認", 2)}</InfoRow>
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

      <div className="mt-auto grid gap-2 pt-4">
        <Link
          href={`/opportunities/${opportunity.id}`}
          className="rounded-xl bg-[var(--action)] px-3.5 py-2.5 text-center text-sm font-semibold text-[var(--paper)]"
        >
          查看詳情
        </Link>
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="text-sm font-semibold text-[var(--info)] underline underline-offset-4"
          >
            為什麼推薦你？ {open ? "▲" : "▼"}
          </button>
          <SaveButton opportunityId={opportunity.id} compact />
        </div>
        {open ? (
          <div className="border-t border-[var(--soft)] pt-2">
            <RecommendationReason
              qualificationReasons={result.qualificationReasons}
              preferenceMatches={result.preferenceMatches}
              warnings={result.warnings}
            />
          </div>
        ) : null}
      </div>
    </article>
  );
}

function InfoRow({ label, children, valueClassName = "" }: { label: string; children: React.ReactNode; valueClassName?: string }) {
  return (
    <div className="grid grid-cols-[4.5rem_1fr] items-start gap-2.5">
      <span className="text-[var(--muted)]">{label}</span>
      <span className={`font-semibold leading-6 text-[var(--text)] ${valueClassName}`}>{children}</span>
    </div>
  );
}
