"use client";

interface IErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: IErrorProps) {
  return (
    <div className="max-w-2xl mx-auto px-6 pt-24 pb-20 flex flex-col items-center gap-6">
      <svg
        width="36"
        height="36"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-red-500"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <div className="text-center">
        <h2 className="text-lg font-bold text-foreground mb-2">
          문제가 발생했습니다
        </h2>
        <p className="text-sm text-sub-text mb-6">
          일시적인 오류가 발생했습니다. 다시 시도해 주세요.
        </p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="px-6 py-3 rounded-xl bg-accent-solid text-white text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
      >
        다시 시도
      </button>
    </div>
  );
}
