"use client";

import {
  formatResultAmountDetail,
  formatPercentage,
} from "@/app/simulate/result/helpers";

interface IHeroProps {
  myAmount: number;
  myDeposit: number;
  hasResult: boolean;
}

export const Hero = ({ myAmount, myDeposit, hasResult }: IHeroProps) => (
  <div
    className={`rounded-2xl p-6 ${
      hasResult ? "bg-accent-solid" : "border border-card-border bg-card-bg"
    }`}
  >
    {hasResult ? (
      <div className="text-white">
        <p className="mb-1 text-sm font-medium opacity-80">예상 배당액</p>
        <p className="text-4xl font-bold tracking-tight">
          {formatResultAmountDetail(myAmount)}
        </p>
        <div className="mt-3 flex items-center gap-3 text-sm opacity-90">
          <span>보증금 {formatResultAmountDetail(myDeposit)} 중 회수율</span>
          <span className="text-xl font-bold">
            {formatPercentage(myAmount, myDeposit)}%
          </span>
        </div>
      </div>
    ) : (
      <div>
        <p className="mb-1 text-sm font-medium text-sub-text">예상 배당액</p>
        <p className="text-2xl font-bold text-foreground">계산 결과 대기 중</p>
        <p className="mt-2 text-sm text-muted">
          엔진 재구축 후 이 화면에 배당액이 표시됩니다.
        </p>
      </div>
    )}
  </div>
);
