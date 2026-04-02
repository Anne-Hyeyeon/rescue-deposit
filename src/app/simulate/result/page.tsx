"use client";

import Image from "next/image";
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
  ResultActions,
} from "@/app/simulate/result/components";
import { BMC_URL } from "@/components/Footer";
import {
  buildResultViewModel,
  canAccessSimulationResult,
} from "@/app/simulate/helpers";
import { buildPlaceholderRows } from "@/app/simulate/result/helpers";
import { runSimulation } from "@/lib/engine/bridge";
import { downloadSimulationResultExcel } from "@/lib/excel/generator";
import { useSimulationStore } from "@/store/simulationStore";

export default function SimulateResultPage() {
  const router = useRouter();
  const { input, result, setInput, setResult } = useSimulationStore();
  const hasInput = canAccessSimulationResult(input);
  const resultView = buildResultViewModel(input);

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
  const secondaryBtn =
    "inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-card-border px-3 text-sm text-sub-text transition-colors hover:border-accent hover:text-accent disabled:opacity-50 cursor-pointer";

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-10">
      {/* 뒤로가기 */}
      <div className="mb-6">
        <Link
          href="/simulate"
          className="inline-flex items-center gap-1.5 text-sm text-sub-text transition-colors hover:text-foreground"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          다시 입력하기
        </Link>
      </div>

      <div ref={captureRef} className="flex flex-col gap-5">
        {resultView.showHero && (
          <Hero
            myAmount={myAmount}
            myDeposit={input.myDeposit}
            hasResult={hasResult}
          />
        )}

        {hasResult && (
          <SalePriceAdjuster
            salePrice={input.salePrice}
            appraisalValue={input.appraisalValue}
            onChange={handleSalePriceChange}
          />
        )}

        {hasResult && resultView.showRiskPanel && (
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

        <Legend showMyTenant={resultView.highlightMyTenant} />
        {/* <ActionLinksPanel /> */}
        <ResultDisclaimer />
      </div>

      {/* 액션 버튼: 결과를 다 본 뒤 자연스럽게 노출 */}
      {hasResult && result && (
        <div className="mt-8 rounded-2xl border border-card-border bg-card-bg p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
            결과 활용하기
          </p>
          {/* 저장 / 공유 */}
          <ResultActions input={input} result={result} />
          {/* 다운로드 */}
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => downloadSimulationResultExcel(input, result)}
              className={secondaryBtn}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              엑셀로 저장
            </button>
            <button
              type="button"
              onClick={handleSaveImage}
              disabled={isCapturing}
              className={secondaryBtn}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              {isCapturing ? "저장 중..." : "이미지로 저장"}
            </button>
          </div>
        </div>
      )}

      {hasResult && (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-card-border bg-card-bg p-6">
          <p className="text-sm text-sub-text text-center">
            도움이 되셨다면, 커피 한 잔의 응원이 큰 힘이 됩니다.
          </p>
          <a
            href={BMC_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="/bmc-button.png"
              alt="Buy me a coffee"
              width={180}
              height={50}
              className="rounded-lg dark:invert hover:opacity-80 transition-opacity duration-200"
            />
          </a>
        </div>
      )}
    </div>
  );
}
