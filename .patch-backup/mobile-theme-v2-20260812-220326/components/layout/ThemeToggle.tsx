"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect } from "react";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.dataset.theme = theme;
}

export function ThemeToggle({ userId }: { userId: string }) {
  const storageKey = `nexty-theme:${userId}`;

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(storageKey);
    const systemTheme: Theme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";

    const initialTheme: Theme =
      savedTheme === "dark" || savedTheme === "light" ? savedTheme : systemTheme;

    applyTheme(initialTheme);
  }, [storageKey]);

  function toggleTheme() {
    const nextTheme: Theme = document.documentElement.classList.contains("dark")
      ? "light"
      : "dark";

    applyTheme(nextTheme);
    window.localStorage.setItem(storageKey, nextTheme);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
      aria-label="Ganti tema terang atau gelap"
      title="Ganti tema"
    >
      <Moon size={16} strokeWidth={2} className="block dark:hidden" />
      <Sun size={16} strokeWidth={2} className="hidden dark:block" />
    </button>
  );
}