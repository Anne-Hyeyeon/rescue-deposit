"use client";

import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { useAuthStore } from "@/store/useAuthStore";

export function Header() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-card-border">
      <div className="max-w-screen-sm mx-auto px-4 h-14 flex items-center justify-between">
        {/* 로고 */}
        <Link href="/" className="font-bold text-lg text-foreground">
          보증금 지킴이
        </Link>

        {/* 우측: 다크모드 토글 + 로그인/로그아웃 */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <button
              onClick={signOut}
              className="text-sm px-3 py-1.5 rounded-md border border-card-border text-foreground hover:bg-hover-bg transition-colors cursor-pointer"
            >
              로그아웃
            </button>
          ) : (
            <Link
              href="/login"
              className="text-sm px-3 py-1.5 rounded-md border border-card-border text-foreground hover:bg-hover-bg transition-colors"
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
