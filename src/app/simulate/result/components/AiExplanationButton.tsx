"use client";

interface IAiExplanationButtonProps {
  onClick: () => void;
  isStreaming: boolean;
  hasExplanation: boolean;
  remainingCredits: number;
  totalCredits: number;
  isDemo: boolean;
  creditsLoading?: boolean;
}

export const AiExplanationButton = ({
  onClick,
  isStreaming,
  hasExplanation,
  remainingCredits,
  totalCredits,
  isDemo,
  creditsLoading = false,
}: IAiExplanationButtonProps) => {
  const isExhausted = !isDemo && remainingCredits <= 0 && !hasExplanation;

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={isStreaming || isExhausted || creditsLoading || hasExplanation}
        aria-busy={isStreaming}
        className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-accent to-accent/80 px-6 py-3.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:shadow-xl hover:shadow-accent/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:shadow-none disabled:translate-y-0 cursor-pointer"
      >
        {/* 배경 shimmer */}
        {!isStreaming && !hasExplanation && !isExhausted && (
          <span className="absolute inset-0 -translate-x-full animate-[shimmer_3s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        )}

        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
          className={isStreaming ? "animate-spin" : ""}
        >
          {isStreaming ? (
            <>
              <circle cx="12" cy="12" r="10" className="opacity-20" strokeWidth="3" />
              <path d="M12 2a10 10 0 0 1 10 10" strokeWidth="3" strokeLinecap="round" />
            </>
          ) : (
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          )}
        </svg>

        {isStreaming
          ? "AI 해설 생성 중..."
          : isExhausted
            ? "크레딧 소진"
            : hasExplanation
              ? "해설이 완료되었습니다"
              : "AI 배당표 해설 받기"}

        {!isDemo && !isStreaming && !hasExplanation && !isExhausted && (
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
            {remainingCredits}/{totalCredits}
          </span>
        )}
      </button>

      {isDemo && !hasExplanation && (
        <p className="text-xs text-accent">
          예시 데이터이므로 토큰이 차감되지 않습니다.
        </p>
      )}

      {isExhausted && (
        <p className="text-xs text-muted">
          무료 크레딧이 소진되었습니다. 유료 버전은 오픈 예정입니다.
        </p>
      )}
    </div>
  );
};
