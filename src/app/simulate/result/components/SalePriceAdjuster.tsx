"use client";

import {
  formatResultAmountShort,
} from "@/app/simulate/result/helpers";

const RATE_BUTTONS = [100, 90, 86, 80, 70, 60] as const;
const STEP_AMOUNT = 10_000_000;

interface ISalePriceAdjusterProps {
  salePrice: number;
  appraisalValue: number;
  onChange: (price: number) => void;
}

export const SalePriceAdjuster = ({
  salePrice,
  appraisalValue,
  onChange,
}: ISalePriceAdjusterProps) => {
  const hasAppraisal = appraisalValue > 0;
  const currentRate = hasAppraisal
    ? ((salePrice / appraisalValue) * 100).toFixed(1)
    : null;

  const handleStep = (direction: 1 | -1) => {
    const next = salePrice + direction * STEP_AMOUNT;
    if (next > 0) {
      onChange(next);
    }
  };

  return (
    <div className="rounded-2xl border border-card-border bg-card-bg p-5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-accent"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
        매각대금 조정
      </h3>

      <div className="mb-4 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => handleStep(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-card-border bg-background text-foreground transition-all hover:bg-hover-bg active:scale-95"
          aria-label="매각대금 1000만원 감소"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        <div className="text-center">
          <p className="text-2xl font-bold text-accent tabular-nums">
            {formatResultAmountShort(salePrice)}
          </p>
          {currentRate && (
            <p className="mt-0.5 text-xs text-sub-text">
              감정가 대비{" "}
              <span className="font-semibold text-foreground">
                {currentRate}%
              </span>
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => handleStep(1)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-card-border bg-background text-foreground transition-all hover:bg-hover-bg active:scale-95"
          aria-label="매각대금 1000만원 증가"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
      </div>

      {hasAppraisal && (
        <div>
          <p className="mb-2 text-center text-xs text-sub-text">
            감정가{" "}
            <span className="font-medium text-foreground">
              {formatResultAmountShort(appraisalValue)}
            </span>
          </p>
          <div className="flex justify-center gap-2">
            {RATE_BUTTONS.map((rate) => {
              const target = Math.round((appraisalValue * rate) / 100);
              const isActive = salePrice === target;

              return (
                <button
                  key={rate}
                  type="button"
                  onClick={() => onChange(target)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    isActive
                      ? "bg-accent text-white"
                      : "border border-card-border bg-background text-sub-text hover:bg-hover-bg hover:text-foreground"
                  }`}
                >
                  {rate}%
                </button>
              );
            })}
          </div>
        </div>
      )}

      <p className="mt-3 text-center text-xs text-muted">
        매각대금을 조정하면 배당 결과가 실시간으로 변경됩니다.
      </p>
    </div>
  );
};
