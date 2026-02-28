"use client";

import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { useAuthStore } from "@/store/useAuthStore";

export function Header() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  return (
    <header className="sticky top-0 z-50 bg-background/60 backdrop-blur-xl border-b border-divider">
      <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="font-bold text-base tracking-tight text-foreground hover:opacity-70 transition-opacity"
        >
          절대지켜✋
        </Link>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          {user ? (
            <button
              type="button"
              onClick={signOut}
              className="text-[13px] px-4 py-2 rounded-full border border-card-border text-sub-text hover:text-foreground hover:border-foreground transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
            >
              로그아웃
            </button>
          ) : (
            <Link
              href="/login"
              className="text-[13px] px-4 py-2 rounded-full border border-card-border text-sub-text hover:text-foreground hover:border-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
