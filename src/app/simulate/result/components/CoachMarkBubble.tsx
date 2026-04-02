"use client";

import { useState } from "react";

interface ICoachMarkBubbleProps {
  content: string;
  isStreaming: boolean;
  isPersisted?: boolean;
  isDemo?: boolean;
  onClose?: () => void;
}

export const CoachMarkBubble = ({
  content,
  isStreaming,
  isPersisted = false,
  isDemo = false,
  onClose,
}: ICoachMarkBubbleProps) => {
  const [copied, setCopied] = useState(false);

  if (!content && !isStreaming) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 API 미지원 시 fallback
      const textarea = document.createElement("textarea");
      textarea.value = content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative mt-3 rounded-xl border border-accent/30 bg-accent/5 p-4">
      {/* 상단 삼각형 */}
      <div className="absolute -top-2 left-6 h-0 w-0 border-l-[8px] border-r-[8px] border-b-[8px] border-l-transparent border-r-transparent border-b-accent/30" />

      {/* 데모 안내 */}
      {isDemo && (
        <p className="mb-3 text-xs text-accent font-medium">
          예시 데이터이므로 토큰이 차감되지 않습니다.
        </p>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 text-sm leading-relaxed text-foreground whitespace-pre-line" aria-live="polite">
          {content}
          {isStreaming && (
            <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-accent" />
          )}
        </div>
        {!isPersisted && !isStreaming && content && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-muted transition-colors hover:text-foreground cursor-pointer"
            aria-label="해설 닫기"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* 로딩 */}
      {isStreaming && !content && (
        <div className="flex items-center gap-2 text-sm text-muted">
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              className="opacity-20"
            />
            <path
              d="M12 2a10 10 0 0 1 10 10"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          AI가 분석 중입니다...
        </div>
      )}

      {/* 복사 버튼 */}
      {content && !isStreaming && (
        <div className="mt-3 flex justify-end border-t border-accent/10 pt-3">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2.5 min-h-[44px] text-xs text-muted transition-colors hover:text-foreground hover:bg-accent/10 cursor-pointer"
          >
            {copied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                복사됨
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                복사
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
