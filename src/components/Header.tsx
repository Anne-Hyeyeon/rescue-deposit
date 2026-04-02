"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { MobileMenu } from "./MobileMenu";
import { useMobileMenu } from "./hooks/useMobileMenu";
import { useAuthStore } from "@/store/useAuthStore";

const PUBLIC_NAV = [
  { href: "/simulate", label: "배당 시뮬레이터" },
  { href: "/guide", label: "이용 가이드" },
] as const;

const AUTH_NAV = [
  { href: "/mypage", label: "마이페이지" },
] as const;

export function Header() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const pathname = usePathname();
  const menu = useMobileMenu();
  const isSharePage = pathname.startsWith("/share");

  const navItems = useMemo(
    () => [...PUBLIC_NAV, ...(user ? AUTH_NAV : [])],
    [user],
  );

  // Minimal header for shared result pages
  if (isSharePage) {
    return (
      <header className="sticky top-0 z-50 bg-background/60 backdrop-blur-xl border-b border-divider">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="font-bold text-base tracking-tight text-foreground hover:opacity-70 transition-opacity duration-200"
          >
            절대지켜
          </Link>
          <ThemeToggle />
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 bg-background/60 backdrop-blur-xl border-b border-divider">
      <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* 로고 + 네비게이션 */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="font-bold text-base tracking-tight text-foreground hover:opacity-70 transition-opacity duration-200"
          >
            절대지켜
          </Link>

          <nav className="hidden sm:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
                className={`text-sm px-3 py-1.5 transition-colors duration-200 ${
                  pathname === item.href
                    ? "text-foreground font-medium"
                    : "text-sub-text hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* 우측 액션 */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          <div className="hidden sm:block">
            {user ? (
              <button
                type="button"
                onClick={signOut}
                className="text-sm px-4 py-2 rounded-full border border-card-border text-sub-text hover:text-foreground hover:border-foreground transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
              >
                로그아웃
              </button>
            ) : (
              <Link
                href="/login"
                className="text-sm px-4 py-2 rounded-full border border-card-border text-sub-text hover:text-foreground hover:border-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
              >
                로그인
              </Link>
            )}
          </div>

          <button
            type="button"
            onClick={menu.toggle}
            className="sm:hidden w-9 h-9 flex items-center justify-center rounded-full text-muted hover:text-foreground hover:bg-hover-bg transition-[color,background-color] duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
            aria-label={menu.isOpen ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={menu.isOpen}
          >
            {menu.isOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="8" x2="20" y2="8" />
                <line x1="4" y1="16" x2="20" y2="16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {menu.isOpen && (
        <MobileMenu
          navItems={navItems}
          isLoggedIn={Boolean(user)}
          onSignOut={signOut}
          onClose={menu.close}
        />
      )}
    </header>
  );
}
