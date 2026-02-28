import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-card-border mt-16">
      <div className="max-w-screen-sm mx-auto px-4 py-8">
        <p className="text-sm text-sub-text">
          보증금 지킴이 · 다가구 피해자가 만든 보증금 정보 플랫폼
        </p>
        <p className="text-sm text-sub-text mt-1">
          문의 · contact@example.com
        </p>
        <div className="flex gap-4 mt-3">
          <Link
            href="/terms"
            className="text-sm text-sub-text hover:text-foreground transition-colors"
          >
            이용약관
          </Link>
          <Link
            href="/privacy"
            className="text-sm text-sub-text hover:text-foreground transition-colors"
          >
            개인정보처리방침
          </Link>
        </div>
      </div>
    </footer>
  );
}
