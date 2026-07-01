"use client";

import { useEffect, useState } from "react";

const storageKey = "bonus-hunter-theme";

type Theme = "light" | "night";

function applyTheme(theme: Theme) {
  if (theme === "night") {
    document.documentElement.dataset.theme = "night";
    return;
  }

  delete document.documentElement.dataset.theme;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme: Theme = saved === "night" || (!saved && prefersDark) ? "night" : "light";

    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  function toggleTheme() {
    const nextTheme: Theme = theme === "night" ? "light" : "night";
    setTheme(nextTheme);
    applyTheme(nextTheme);
    window.localStorage.setItem(storageKey, nextTheme);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="relative inline-grid h-8 w-[58px] grid-cols-2 items-center rounded-full border border-[var(--line-strong)] bg-[var(--paper)] px-1 text-xs font-semibold text-[var(--muted)]"
      aria-label={theme === "night" ? "切換淺色模式" : "切換深色模式"}
      aria-pressed={theme === "night"}
    >
      <span
        aria-hidden="true"
        className={`absolute top-1 h-6 w-6 rounded-full bg-[var(--primary)] transition-transform ${
          theme === "night" ? "translate-x-[26px]" : "translate-x-0"
        }`}
      />
      <span aria-hidden="true" className={`relative z-10 text-center ${theme === "night" ? "text-[var(--muted)]" : "text-[var(--primary-ink)]"}`}>
        ☀
      </span>
      <span aria-hidden="true" className={`relative z-10 text-center ${theme === "night" ? "text-[var(--primary-ink)]" : "text-[var(--muted)]"}`}>
        ☾
      </span>
    </button>
  );
}
