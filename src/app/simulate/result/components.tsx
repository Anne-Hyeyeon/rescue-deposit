"use client";

import type { IDistributionRow } from "@/types/simulation";
import {
  categoryColors,
  categoryWrap,
  formatPercentage,
  formatResultAmount,
  formatResultAmountDetail,
  formatResultAmountShort,
} from "@/app/simulate/result/helpers";

const ACTION_ITEMS = [
  {
    title: "배당요구종기일 확인 및 신청",
    desc: "법원 경매정보 사이트에서 해당 사건의 종기일을 확인하고 기간 내 배당요구 신청을 해야 합니다.",
    href: "https://www.courtauction.go.kr",
  },
  {
    title: "임차권등기명령 신청",
    desc: "이사를 가야 할 경우 대항력을 유지하기 위해 법원에 임차권등기명령을 신청하세요.",
    href: "https://www.iros.go.kr",
  },
  {
    title: "HUG 전세보증금반환보증 안내",
    desc: "HUG(주택도시보증공사) 전세사기 피해자 지원센터를 통해 추가 지원을 받을 수 있습니다.",
    href: "https://www.khug.or.kr",
  },
] as const;

const LEGEND_CATEGORIES = [
  "집행비용",
  "최선순위 소액임차인",
  "상대적 소액임차인",
  "당해세",
  "담보물권",
  "확정일자 임차인",
  "임금채권",
  "조세채권",
  "공과금",
  "일반채권",
] as const;

const RATE_BUTTONS = [100, 90, 86, 80, 70, 60] as const;
const STEP_AMOUNT = 10_000_000;

interface ICategoryBadgeProps {
  category: string;
}

const CategoryBadge = ({ category }: ICategoryBadgeProps) => {
  const wrap = categoryWrap[category];

  return (
    <span
      className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-medium leading-tight ${
        categoryColors[category] ?? "bg-badge-bg text-muted"
      }`}
    >
      {wrap ? (
        <>
          <span className="hidden sm:inline">
            {wrap[0]} {wrap[1]}
          </span>
          <span className="sm:hidden">
            {wrap[0]}
            <br />
            {wrap[1]}
          </span>
        </>
      ) : (
        category
      )}
    </span>
  );
};

interface ITableRowProps {
  row: IDistributionRow;
  index: number;
  hasResult: boolean;
}

const TableRow = ({ row, index, hasResult }: ITableRowProps) => {
  const isHighlight = row.isMyTenant;
  const isExecution = row.step === "집행비용";
  const gotNothing = hasResult && row.distributedAmount === 0;

  return (
    <tr
      data-row-index={index}
      className={`border-b border-divider transition-colors ${
        isHighlight ? "bg-accent-bg" : "hover:bg-hover-bg"
      } ${gotNothing ? "opacity-50" : ""}`}
    >
      <td className="w-6 px-2 py-2.5 text-center text-xs text-muted">
        {index + 1}
      </td>
      <td className="px-1.5 py-2.5">
        <CategoryBadge category={row.category} />
      </td>
      <td className="px-2 py-2.5">
        <div className="flex items-center gap-1">
          {isHighlight && (
            <span className="text-sm text-accent" aria-label="나의 임차권">
              ★
            </span>
          )}
          <span
            className={`text-[13px] font-medium ${
              isHighlight ? "text-accent" : "text-foreground"
            }`}
          >
            {row.creditorName}
          </span>
        </div>
        {row.note && (
          <p className="mt-0.5 text-[10px] leading-tight text-muted">
            {row.note}
          </p>
        )}
      </td>
      <td className="whitespace-nowrap px-1.5 py-2.5 text-center text-xs tabular-nums text-sub-text">
        {row.keyDate ?? "—"}
      </td>
      <td className="whitespace-nowrap px-2 py-2.5 text-right text-[13px] tabular-nums text-foreground">
        {isExecution ? "—" : `${formatResultAmount(row.claimAmount)}원`}
      </td>
      <td className="whitespace-nowrap px-2 py-2.5 text-right tabular-nums">
        {hasResult ? (
          <span
            className={`text-[13px] font-semibold ${
              isHighlight
                ? "text-accent"
                : row.distributedAmount > 0
                  ? "text-foreground"
                  : "text-muted"
            }`}
          >
            {`${formatResultAmount(row.distributedAmount)}원`}
          </span>
        ) : (
          <span className="text-xs italic text-muted">계산 전</span>
        )}
      </td>
      <td className="whitespace-nowrap px-2 py-2.5 text-right text-[13px] tabular-nums">
        {hasResult ? (
          <span className="text-sub-text">{`${formatResultAmount(row.remainingPool)}원`}</span>
        ) : (
          <span className="text-xs italic text-muted">—</span>
        )}
      </td>
    </tr>
  );
};

interface IHeroProps {
  myAmount: number;
  myDeposit: number;
  hasResult: boolean;
}

export const Hero = ({ myAmount, myDeposit, hasResult }: IHeroProps) => (
  <div
    className={`rounded-2xl p-6 ${
      hasResult ? "bg-accent" : "border border-card-border bg-card-bg"
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

export const AssumptionsPanel = () => (
  <div className="rounded-2xl border border-card-border bg-card-bg p-5">
    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-yellow-500"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      이 결과의 전제 조건
    </h3>
    <ul className="space-y-1.5 text-xs leading-relaxed text-sub-text">
      <li className="flex items-start gap-1.5">
        <span className="mt-0.5 shrink-0 text-yellow-500">•</span>
        <span>배당요구를 한 세입자만 계산에 포함되었습니다.</span>
      </li>
      <li className="flex items-start gap-1.5">
        <span className="mt-0.5 shrink-0 text-yellow-500">•</span>
        <span>
          대항력 발생일이 입력되면 대항력이 있는 것으로 가정했습니다.
          경매개시결정 등기 전 대항요건 구비 여부는 별도로 검증하지 않았습니다.
        </span>
      </li>
      <li className="flex items-start gap-1.5">
        <span className="mt-0.5 shrink-0 text-yellow-500">•</span>
        <span>
          증액된 보증금은 반영되지 않았습니다. 계약 갱신으로 보증금이 변동된
          경우 소액임차인 판정이 달라질 수 있습니다.
        </span>
      </li>
      <li className="flex items-start gap-1.5">
        <span className="mt-0.5 shrink-0 text-yellow-500">•</span>
        <span>
          소액임차인 기준표의 지역 구간은 근저당 설정일 시점의 법령을 기준으로
          판단했습니다. 같은 도시라도 시기에 따라 구간이 달라질 수 있습니다.
        </span>
      </li>
    </ul>
  </div>
);

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

interface IDistributionTableProps {
  rows: IDistributionRow[];
  hasResult: boolean;
  salePrice: number;
  executionCost: number;
  remainingBalance: number;
}

export const DistributionTable = ({
  rows,
  hasResult,
  salePrice,
  executionCost,
  remainingBalance,
}: IDistributionTableProps) => (
  <div className="overflow-hidden rounded-2xl border border-card-border bg-card-bg">
    <div className="border-b border-divider px-5 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">배당 순서표</h2>
          <p className="mt-0.5 text-xs text-sub-text">
            집행비용부터 배당 순서대로 • 매각대금{" "}
            <span className="font-medium text-foreground">
              {formatResultAmountShort(salePrice)}
            </span>{" "}
            → 배당가능액{" "}
            <span className="font-medium text-foreground">
              {formatResultAmountShort(salePrice - executionCost)}
            </span>
          </p>
        </div>
      </div>
    </div>

    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-divider bg-badge-bg/60">
            <th className="w-6 px-2 py-2 text-center text-xs font-medium text-muted">
              #
            </th>
            <th className="px-1.5 py-2 text-left text-xs font-medium text-muted">
              구분
            </th>
            <th className="px-2 py-2 text-left text-xs font-medium text-muted">
              채권자
            </th>
            <th className="px-1.5 py-2 text-center text-xs font-medium text-muted">
              일자
            </th>
            <th className="px-2 py-2 text-right text-xs font-medium text-muted">
              채권액
            </th>
            <th className="px-2 py-2 text-right text-xs font-medium text-muted">
              배당액
            </th>
            <th className="px-2 py-2 text-right text-xs font-medium text-muted">
              잔액
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <TableRow
              key={`${row.creditorId}-${index}`}
              row={row}
              index={index}
              hasResult={hasResult}
            />
          ))}
        </tbody>
      </table>
    </div>

    {hasResult ? (
      <div className="flex items-center justify-between border-t border-divider bg-badge-bg/40 px-5 py-3">
        <span className="text-xs text-sub-text">최종 잔여금 (소유자 반환)</span>
        <span className="text-sm font-semibold text-foreground tabular-nums">
          {formatResultAmount(remainingBalance)}원
        </span>
      </div>
    ) : (
      <div className="border-t border-divider px-5 py-4">
        <p className="text-center text-xs text-muted">
          ※ 배당액 · 잔액 칼럼은 엔진 재구축 후 자동으로 채워집니다.
        </p>
      </div>
    )}
  </div>
);

interface ILegendProps {
  showMyTenant?: boolean;
}

export const Legend = ({ showMyTenant = true }: ILegendProps) => (
  <div className="flex flex-wrap gap-x-4 gap-y-2 px-1">
    {LEGEND_CATEGORIES.map((category) => (
      <div key={category} className="flex items-center gap-1.5">
        <CategoryBadge category={category} />
      </div>
    ))}
    {showMyTenant && (
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-accent">★</span>
        <span className="text-xs text-muted">나의 임차권</span>
      </div>
    )}
  </div>
);

export const ActionLinksPanel = () => (
  <div className="rounded-2xl border border-card-border bg-card-bg p-5">
    <h3 className="mb-3 text-sm font-semibold text-foreground">
      지금 해야 할 일
    </h3>
    <ul className="flex flex-col gap-1">
      {ACTION_ITEMS.map((item) => (
        <li key={item.href}>
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-3 rounded-xl p-3 transition-colors duration-150 hover:bg-hover-bg"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="mt-0.5 shrink-0 text-accent"
              aria-hidden="true"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            <div>
              <p className="text-sm font-medium text-foreground transition-colors group-hover:text-accent">
                {item.title}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-sub-text">
                {item.desc}
              </p>
            </div>
          </a>
        </li>
      ))}
    </ul>
  </div>
);

export const ResultDisclaimer = () => (
  <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
    <p className="text-center text-xs leading-relaxed text-muted">
      이 결과는 입력하신 정보를 기반으로 한 <strong>참고용 시뮬레이션</strong>
      입니다. 실제 배당 결과는 법원의 판단에 따라 달라질 수 있으며, 중요한
      결정을 내리기 전에 반드시 법률 전문가와 상담하시기 바랍니다.
      <br />
      <span className="text-yellow-600 dark:text-yellow-400">
        증액보증금 반영 불가 · 배당요구 미신청자 미포함 · 대항요건 구비 시점
        미검증
      </span>
    </p>
  </div>
);
