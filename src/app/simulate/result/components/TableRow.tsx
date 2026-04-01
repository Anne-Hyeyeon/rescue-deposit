import type { IDistributionRow } from "@/types/simulation";
import { formatResultAmount } from "@/app/simulate/result/helpers";
import { CategoryBadge } from "./CategoryBadge";

interface ITableRowProps {
  row: IDistributionRow;
  index: number;
  hasResult: boolean;
}

export const TableRow = ({ row, index, hasResult }: ITableRowProps) => {
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
        {row.keyDate ?? "\u2014"}
      </td>
      <td className="whitespace-nowrap px-2 py-2.5 text-right text-[13px] tabular-nums text-foreground">
        {isExecution ? "\u2014" : `${formatResultAmount(row.claimAmount)}원`}
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
          <span className="text-xs italic text-muted">\u2014</span>
        )}
      </td>
    </tr>
  );
};
