"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

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

  const captureRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const handleSaveImage = useCallback(async () => {
    if (!captureRef.current || isCapturing) return;
    setIsCapturing(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(captureRef.current, {
        pixelRatio: 2,
        style: { padding: "16px" },
      });

      const link = document.createElement("a");
      link.download = `배당시뮬레이션_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing]);

  if (!hasInput) return null;

  const rows = result ? result.rows : buildPlaceholderRows(input);
  const hasResult = result !== null;
  const myAmount = result?.myDistributedAmount ?? 0;
  const remainingBalance = result?.remainingBalance ?? 0;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-10">
      <div className="mb-8 flex items-center justify-between">
        <Link
          href="/simulate"
          className="inline-flex items-center gap-1.5 text-sm text-sub-text transition-colors hover:text-foreground"
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

        {hasResult && (
          <button
            type="button"
            onClick={handleSaveImage}
            disabled={isCapturing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-card-border px-3 py-1.5 text-sm text-sub-text transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {isCapturing ? "저장 중..." : "이미지로 저장"}
          </button>
        )}
      </div>

      <div ref={captureRef} className="flex flex-col gap-5">
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
