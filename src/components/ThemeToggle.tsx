"use client";

import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center w-14 h-7 rounded-full bg-card-bg border border-card-border cursor-pointer transition-colors hover:bg-hover-bg"
      aria-label={theme === "light" ? "다크모드로 전환" : "라이트모드로 전환"}
    >
      <span className="absolute left-1 text-sm">☀️</span>
      <span className="absolute right-1 text-sm">🌙</span>
      <span
        className={`absolute w-5 h-5 rounded-full bg-foreground transition-transform duration-200 ${
          theme === "dark" ? "translate-x-7.5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
