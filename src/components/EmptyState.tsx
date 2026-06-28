import Link from "next/link";

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <section className="rounded-[18px] border border-[var(--soft)] bg-[var(--paper)] p-5 text-center">
      <h2 className="text-lg font-semibold text-[var(--text)]">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{description}</p>
      <Link
        href={actionHref}
        className="mt-4 inline-flex rounded-xl bg-[var(--action)] px-4 py-3 text-sm font-semibold text-[var(--paper)]"
      >
        {actionLabel}
      </Link>
    </section>
  );
}
