import type { RecommendationLabel } from "@/src/types";

type TagProps = {
  children: React.ReactNode;
  tone?: "default" | "active" | "muted";
};

export function Tag({ children, tone = "default" }: TagProps) {
  const toneClass = {
    default: "border-[var(--line)] bg-[var(--paper)] text-[var(--muted)]",
    active: "border-[var(--action)] bg-[var(--action)] text-[var(--paper)]",
    muted: "border-[var(--line)] bg-[var(--paper-2)] text-[var(--muted)]",
  }[tone];

  return (
    <span className={`inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-xs font-bold leading-tight ${toneClass}`}>
      {children}
    </span>
  );
}

export function RecommendationLabelTag({ label }: { label: RecommendationLabel }) {
  const displayLabel = label === "很適合你" || label === "可以考慮" ? label : "再確認";
  const className = {
    很適合你: "bg-[var(--ok-bg)] text-[var(--ok-text)]",
    可以考慮: "bg-[var(--maybe-bg)] text-[var(--maybe-text)]",
    再確認: "bg-[var(--check-bg)] text-[var(--check-text)]",
  }[displayLabel];

  return <span className={`inline-flex min-w-[4.75rem] justify-center rounded-full px-2.5 py-1.5 text-xs font-semibold ${className}`}>{displayLabel}</span>;
}
