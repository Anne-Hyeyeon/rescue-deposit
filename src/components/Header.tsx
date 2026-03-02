"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { useAuthStore } from "@/store/useAuthStore";

const navItems = [
  { href: "/calculator", label: "배당표 계산기" },
  { href: "/chat", label: "AI 상담" },
  { href: "/qna", label: "Q&A" },
  { href: "/mypage", label: "마이페이지" },
];

export function Header() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  // 라우트 변경 시 모바일 메뉴 닫기 (렌더 중 상태 조정)
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

  // 모바일 메뉴 열릴 때 body 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Escape 키로 모바일 메뉴 닫기
  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-50 bg-background/60 backdrop-blur-xl border-b border-divider">
      <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* 로고 */}
        <Link
          href="/"
          className="font-bold text-base tracking-tight text-foreground hover:opacity-70 transition-opacity duration-200"
        >
          절대지켜
        </Link>

        {/* 데스크탑 네비게이션 */}
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

        {/* 우측 액션 */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {/* 데스크탑: 로그인/로그아웃 */}
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

          {/* 모바일: 햄버거 버튼 */}
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="sm:hidden w-9 h-9 flex items-center justify-center rounded-full text-muted hover:text-foreground hover:bg-hover-bg transition-[color,background-color] duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
            aria-label={mobileOpen ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
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

      {/* 모바일 메뉴 오버레이 */}
      {mobileOpen && (
        <div className="sm:hidden fixed inset-0 top-16 z-40">
          {/* 배경 딤 */}
          <button
            type="button"
            className="absolute inset-0 bg-background/80 backdrop-blur-sm cursor-default"
            onClick={() => setMobileOpen(false)}
            aria-label="메뉴 닫기"
            tabIndex={-1}
          />

          {/* 메뉴 패널 */}
          <nav className="relative bg-background border-b border-divider">
            <div className="max-w-2xl mx-auto px-6 py-4 flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={pathname === item.href ? "page" : undefined}
                  className={`text-base px-4 py-3 transition-colors duration-200 ${
                    pathname === item.href
                      ? "text-foreground font-medium"
                      : "text-sub-text hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              ))}

              {/* 구분선 */}
              <div className="border-t border-divider my-2" />

              {/* 로그인/로그아웃 */}
              {user ? (
                <button
                  type="button"
                  onClick={() => {
                    signOut();
                    setMobileOpen(false);
                  }}
                  className="text-base px-4 py-3 text-sub-text hover:text-foreground transition-colors duration-200 text-left cursor-pointer"
                >
                  로그아웃
                </button>
              ) : (
                <Link
                  href="/login"
                  className="text-base px-4 py-3 text-sub-text hover:text-foreground transition-colors duration-200"
                >
                  로그인
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
