"use client";

import type { IDistributionRow } from "@/types/simulation";
import {
  formatResultAmount,
  formatResultAmountShort,
} from "@/app/simulate/result/helpers";
import { TableRow } from "./TableRow";

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
            집행비용부터 배당 순서대로 &bull; 매각대금{" "}
            <span className="font-medium text-foreground">
              {formatResultAmountShort(salePrice)}
            </span>{" "}
            &rarr; 배당가능액{" "}
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
          ※ 배당액 &middot; 잔액 칼럼은 엔진 재구축 후 자동으로 채워집니다.
        </p>
      </div>
    )}
  </div>
);
