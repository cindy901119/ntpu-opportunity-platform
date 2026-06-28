type RecommendationReasonProps = {
  qualificationReasons: string[];
  preferenceMatches: string[];
  warnings: string[];
};

function QualificationList({ items }: { items: string[] }) {
  if (!items.length) {
    return null;
  }

  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold text-[var(--muted)]">資格符合</h3>
      <ul className="space-y-1.5 text-sm leading-6 text-[var(--text)]">
        {items.slice(0, 3).map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-[var(--action)]">✓</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PreferenceTags({ items }: { items: string[] }) {
  if (!items.length) {
    return null;
  }

  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold text-[var(--muted)]">偏好交集</h3>
      <div className="flex flex-wrap gap-2">
        {items.slice(0, 5).map((item) => (
          <span key={item} className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-2.5 py-1 text-xs font-semibold text-[var(--info)]">
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

function WarningLine({ warnings }: { warnings: string[] }) {
  if (!warnings.length) {
    return null;
  }

  return (
    <p className="border-t border-[var(--line)] pt-2 text-xs leading-5 text-[var(--attention)]">
      {warnings[0]}
    </p>
  );
}

export function RecommendationReason({
  qualificationReasons,
  preferenceMatches,
  warnings,
}: RecommendationReasonProps) {
  return (
    <div className="mt-3 space-y-3 rounded-2xl border border-[var(--line)] bg-[var(--paper-2)] p-3">
      <QualificationList items={qualificationReasons} />
      <PreferenceTags items={preferenceMatches} />
      <WarningLine warnings={warnings} />
    </div>
  );
}
