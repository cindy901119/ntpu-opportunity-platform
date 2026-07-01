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
      className="rounded-full border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-2 text-sm font-semibold text-[var(--muted)]"
      aria-label={theme === "night" ? "切換淺色模式" : "切換深色模式"}
    >
      {theme === "night" ? "夜" : "日"}
    </button>
  );
}
