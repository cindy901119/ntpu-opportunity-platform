"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthStatus } from "./AuthStatus";
import { ThemeToggle } from "./ThemeToggle";

const items = [
  { href: "/opportunities", label: "機會" },
  { href: "/preferences", label: "偏好" },
  { href: "/saved", label: "收藏" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-10 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--paper-2)_92%,transparent)] px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-[760px] items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <Link href="/" className="truncate text-lg font-semibold tracking-wide text-[var(--text)]">
            鳶來有獎
          </Link>
          <ThemeToggle />
        </div>
        <div className="flex gap-1">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3 py-2 text-sm font-semibold ${
                  active ? "bg-[var(--primary)] text-[var(--primary-ink)]" : "text-[var(--muted)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <AuthStatus />
        </div>
      </div>
    </nav>
  );
}
