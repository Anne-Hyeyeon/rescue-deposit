"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

import {
  ActionLinksPanel,
  AssumptionsPanel,
  DistributionTable,
  Hero,
  Legend,
  ResultDisclaimer,
  RiskPanel,
  SalePriceAdjuster,
} from "@/app/simulate/result/components";
import { buildPlaceholderRows } from "@/app/simulate/result/helpers";
import { runSimulation } from "@/lib/engine/bridge";
import { useSimulationStore } from "@/store/simulationStore";

export default function SimulateResultPage() {
  const router = useRouter();
  const { input, result, setInput, setResult } = useSimulationStore();

  const hasInput = input.myDeposit > 0 && input.mortgageRegDate;

  useEffect(() => {
    if (!hasInput) {
      router.replace("/simulate");
    }
  }, [hasInput, router]);

  const handleSalePriceChange = useCallback(
    (price: number) => {
      setInput({ salePrice: price });
      setResult(runSimulation({ ...input, salePrice: price }));
    },
    [input, setInput, setResult],
  );

  if (!hasInput) return null;

  const rows = result ? result.rows : buildPlaceholderRows(input);
  const hasResult = result !== null;
  const myAmount = result?.myDistributedAmount ?? 0;
  const remainingBalance = result?.remainingBalance ?? 0;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-10">
      <Link
        href="/simulate"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-sub-text transition-colors hover:text-foreground"
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
          <polyline points="15 18 9 12 15 6" />
        </svg>
        다시 입력하기
      </Link>

      <div className="flex flex-col gap-5">
        <Hero
          myAmount={myAmount}
          myDeposit={input.myDeposit}
          hasResult={hasResult}
        />

        {hasResult && (
          <SalePriceAdjuster
            salePrice={input.salePrice}
            appraisalValue={input.appraisalValue}
            onChange={handleSalePriceChange}
          />
        )}

        {hasResult && (
          <RiskPanel myAmount={myAmount} myDeposit={input.myDeposit} />
        )}

        <AssumptionsPanel />

        <DistributionTable
          rows={rows}
          hasResult={hasResult}
          salePrice={input.salePrice}
          executionCost={input.executionCost}
          remainingBalance={remainingBalance}
        />

        <Legend />
        <ActionLinksPanel />
        <ResultDisclaimer />
      </div>
    </div>
  );
}
