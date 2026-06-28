"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthStatus } from "./AuthStatus";

const items = [
  { href: "/opportunities", label: "機會" },
  { href: "/preferences", label: "偏好" },
  { href: "/saved", label: "收藏" },
  { href: "/data-entry", label: "匯入" },
  { href: "/data-staging", label: "審核" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-10 border-b border-[var(--line)] bg-[rgba(236,229,217,.92)] px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-[760px] items-center justify-between gap-4">
        <Link href="/" className="text-lg font-semibold tracking-wide text-[var(--text)]">
          北大機會雷達
        </Link>
        <div className="flex gap-1">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3 py-2 text-sm font-semibold ${
                  active ? "bg-[var(--action)] text-[var(--paper)]" : "text-[var(--muted)]"
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
