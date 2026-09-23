"use client";

import { Moon, Sun } from "lucide-react";
import {
  useCallback,
  useEffect,
  useSyncExternalStore,
} from "react";

type Theme = "light" | "dark";

const THEME_CHANGE_EVENT = "nexty-theme-change";

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.dataset.theme = theme;
}

function readTheme(storageKey: string): Theme {
  if (typeof window === "undefined") {
    return "light";
  }

  const savedTheme = window.localStorage.getItem(storageKey);

  if (savedTheme === "dark" || savedTheme === "light") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function useResolvedTheme(storageKey: string) {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

      const handleStorage = (event: StorageEvent) => {
        if (event.key === storageKey) {
          onStoreChange();
        }
      };

      const handleThemeChange = () => {
        onStoreChange();
      };

      window.addEventListener("storage", handleStorage);
      window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);
      mediaQuery.addEventListener("change", handleThemeChange);

      return () => {
        window.removeEventListener("storage", handleStorage);
        window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
        mediaQuery.removeEventListener("change", handleThemeChange);
      };
    },
    [storageKey],
  );

  const getSnapshot = useCallback(
    () => readTheme(storageKey),
    [storageKey],
  );

  const getServerSnapshot = useCallback((): Theme => "light", []);

  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
}

export function ThemeToggle({ userId }: { userId: string }) {
  const storageKey = `nexty-theme:${userId}`;
  const theme = useResolvedTheme(storageKey);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function toggleTheme() {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";

    window.localStorage.setItem(storageKey, nextTheme);
    applyTheme(nextTheme);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-[#343940] dark:bg-[#24272c] dark:text-[#aab0b8] dark:hover:bg-[#2b2f35] dark:hover:text-[#eceef2]"
      aria-label={isDark ? "Gunakan tema terang" : "Gunakan tema gelap"}
      title={isDark ? "Tema terang" : "Tema gelap"}
    >
      {isDark ? (
        <Sun size={16} strokeWidth={1.9} />
      ) : (
        <Moon size={16} strokeWidth={1.9} />
      )}
    </button>
  );
}