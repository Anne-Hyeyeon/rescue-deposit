interface IRiskPanelProps {
  myAmount: number;
  myDeposit: number;
}

export const RiskPanel = ({ myAmount, myDeposit }: IRiskPanelProps) => {
  const rate = myDeposit === 0 ? 100 : (myAmount / myDeposit) * 100;

  if (rate >= 80) return null;

  return (
    <div className="rounded-2xl border border-yellow-300/50 bg-yellow-50/80 p-5 dark:border-yellow-700/30 dark:bg-yellow-900/10">
      <div className="flex items-start gap-3">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="mt-0.5 shrink-0 text-yellow-600 dark:text-yellow-400"
          aria-hidden="true"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <div>
          <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
            {rate < 50 ? "회수 가능성이 낮습니다" : "부분 회수 예상"}
          </p>
        </div>
      </div>
    </div>
  );
};
