"use client";

import { formatKRW } from "@/app/simulate/helpers";

interface IThresholdInfoPanelProps {
  depositMax: number | null;
  priorityMax: number | null;
}

export const ThresholdInfoPanel = ({
  depositMax,
  priorityMax,
}: IThresholdInfoPanelProps) => {
  if (depositMax === null || priorityMax === null) {
    return (
      <div className="mt-3 rounded-xl border border-card-border bg-card-bg px-4 py-3">
        <p className="text-xs text-sub-text">
          근저당 설정일을 입력하면 해당 시기의 최우선변제금액을 확인할 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-accent/30 bg-accent-bg px-4 py-3" role="status">
      <p className="text-xs font-semibold text-accent mb-1.5">
        소액임차인 최우선변제 기준
      </p>
      <div className="flex gap-4">
        <div>
          <p className="text-[11px] text-sub-text">보증금 상한</p>
          <p className="text-sm font-medium text-foreground">{formatKRW(depositMax)}</p>
        </div>
        <div>
          <p className="text-[11px] text-sub-text">최우선변제금</p>
          <p className="text-sm font-medium text-foreground">{formatKRW(priorityMax)}</p>
        </div>
      </div>
    </div>
  );
};
