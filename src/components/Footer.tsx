import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-divider">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <p className="text-sm text-sub-text">
          절대지켜 · 다가구 피해자가 만든 보증금 정보 플랫폼
        </p>
        <p className="text-sm text-sub-text mt-1.5">
          문의 · contact@example.com
        </p>
        <div className="flex gap-5 mt-5">
          <Link
            href="/terms"
            className="text-sm text-sub-text hover:text-foreground transition-colors duration-200"
          >
            이용약관
          </Link>
          <Link
            href="/privacy"
            className="text-sm text-sub-text hover:text-foreground transition-colors duration-200"
          >
            개인정보처리방침
          </Link>
        </div>
        <p className="text-sm text-muted mt-5">© 2026 절대지켜</p>
      </div>
    </footer>
  );
}
