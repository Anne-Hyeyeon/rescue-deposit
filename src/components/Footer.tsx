import Image from "next/image";

export const BMC_URL = "https://buymeacoffee.com/annehyeyeon";

export function Footer() {
  return (
    <footer className="border-t border-divider">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <p className="text-sm text-sub-text">
          절대지켜 · 보증금 미반환 대응 플랫폼
        </p>
        <p className="text-sm text-sub-text mt-1.5">
          문의 · dlswptkfkd@gmail.com
        </p>
        <div className="mt-5">
          <a
            href={BMC_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="/bmc-full-logo.png"
              alt="Buy me a coffee"
              width={150}
              height={40}
              className="hover:opacity-80 transition-opacity duration-200"
            />
          </a>
        </div>
        <p className="text-sm text-muted mt-5">&copy; 2026 절대지켜</p>
      </div>
    </footer>
  );
}
