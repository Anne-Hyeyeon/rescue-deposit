"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface INavItem {
  href: string;
  label: string;
}

interface IMobileMenuProps {
  navItems: INavItem[];
  isLoggedIn: boolean;
  onSignOut: () => void;
  onClose: () => void;
}

export const MobileMenu = ({
  navItems,
  isLoggedIn,
  onSignOut,
  onClose,
}: IMobileMenuProps) => {
  const pathname = usePathname();

  return (
    <div className="sm:hidden fixed inset-0 top-16 z-40">
      <button
        type="button"
        className="absolute inset-0 bg-background/80 backdrop-blur-sm cursor-default"
        onClick={onClose}
        aria-label="메뉴 닫기"
        tabIndex={-1}
      />

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

          <div className="border-t border-divider my-2" />

          {isLoggedIn ? (
            <button
              type="button"
              onClick={() => {
                onSignOut();
                onClose();
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
  );
};
