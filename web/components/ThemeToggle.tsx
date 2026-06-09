"use client";

import { useEffect, useState } from "react";
import { useLocale } from "./i18n/LocaleProvider";

const KEY = "redditalpha:theme";

export function ThemeToggle() {
  const { dict } = useLocale();
  const [theme, setTheme] = useState<"dark" | "light">("light");

  useEffect(() => {
    const stored = (localStorage.getItem(KEY) as "dark" | "light" | null) ?? null;
    setTheme(stored ?? (document.documentElement.classList.contains("dark") ? "dark" : "light"));
  }, []);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "light" ? dict.chrome.themeToDark : dict.chrome.themeToLight}
      title={theme === "light" ? dict.chrome.themeDark : dict.chrome.themeLight}
      className="fixed bottom-5 right-5 z-[60] grid place-items-center w-11 h-11 rounded-full panel ring-1 ring-inset ring-line text-neutral-400 hover:text-reddit transition hover:-translate-y-0.5"
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}
