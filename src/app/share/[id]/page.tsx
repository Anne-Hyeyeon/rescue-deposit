"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { downloadSimulationResultExcel } from "@/lib/excel/generator";

import {
  AssumptionsPanel,
  DistributionTable,
  Hero,
  Legend,
  ResultDisclaimer,
  RiskPanel,
} from "@/app/simulate/result/components";
import { buildResultViewModel } from "@/app/simulate/helpers";
import { getSharedResultByShareId, type ISharedResult } from "@/lib/supabase/shared-results";

type PageState = "loading" | "found" | "not-found";

export default function SharePage() {
  const params = useParams<{ id: string }>();
  const [state, setState] = useState<PageState>("loading");
  const [shared, setShared] = useState<ISharedResult | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getSharedResultByShareId(params.id);
        if (data) {
          setShared(data);
          setState("found");
        } else {
          setState("not-found");
        }
      } catch {
        setState("not-found");
      }
    };
    load();
  }, [params.id]);

  if (state === "loading") {
    return (
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-10">
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-sub-text">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          결과를 불러오는 중...
        </div>
      </div>
    );
  }

  if (state === "not-found" || !shared) {
    return (
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-10">
        <div className="flex flex-col items-center gap-4 py-20">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4" strokeLinecap="round" />
            <circle cx="12" cy="16" r="0.5" fill="currentColor" />
          </svg>
          <p className="text-base font-medium text-foreground">결과를 찾을 수 없습니다</p>
          <p className="text-sm text-sub-text text-center">
            링크가 만료되었거나 삭제되었을 수 있습니다.
          </p>
          <Link
            href="/"
            className="mt-2 rounded-xl bg-accent-solid px-6 py-3 text-sm font-medium text-white transition-colors hover:opacity-90"
          >
            절대지켜 홈으로 이동
          </Link>
        </div>
      </div>
    );
  }

  const { input, result, title, show_my_info: showMyInfo } = shared;
  const resultView = showMyInfo ? buildResultViewModel(input) : { showHero: false, showRiskPanel: false, highlightMyTenant: false };
  const myAmount = result.myDistributedAmount;
  const remainingBalance = result.remainingBalance;

  const displayRows = showMyInfo
    ? result.rows
    : result.rows.map((row) => row.isMyTenant ? { ...row, isMyTenant: false, creditorName: "임차인" } : row);

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
      link.download = `${title || "배당시뮬레이션"}_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing, title]);

  const secondaryBtn =
    "inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-card-border px-3 text-sm text-sub-text transition-colors hover:border-accent hover:text-accent cursor-pointer";

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-10">
      {/* Title Banner + Actions */}
      <div className="mb-8 flex flex-col gap-4">
        <div className="rounded-2xl border border-card-border bg-card-bg p-5">
          <p className="text-xs font-medium uppercase tracking-widest text-muted">
            배당 시뮬레이션 결과
          </p>
          <h1 className="mt-1.5 text-lg font-bold tracking-tight text-foreground">
            {title || "배당 시뮬레이션"}
          </h1>
          <p className="mt-1 text-xs text-sub-text">
            {new Date(shared.created_at).toLocaleDateString("ko-KR")} {new Date(shared.created_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })} 시뮬레이션
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
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

      {/* Result Content */}
      <div ref={captureRef} className="flex flex-col gap-5">
        {resultView.showHero && (
          <Hero
            myAmount={myAmount}
            myDeposit={input.myDeposit}
            hasResult
          />
        )}

        {resultView.showRiskPanel && (
          <RiskPanel myAmount={myAmount} myDeposit={input.myDeposit} />
        )}

        <AssumptionsPanel />

        <DistributionTable
          rows={displayRows}
          hasResult
          salePrice={input.salePrice}
          executionCost={input.executionCost}
          remainingBalance={remainingBalance}
        />

        <Legend showMyTenant={resultView.highlightMyTenant} />
        <ResultDisclaimer />
      </div>

      {/* CTA */}
      <div className="mt-10 flex flex-col items-center gap-3">
        <p className="text-sm text-sub-text">
          보증금 미반환, 더 이상 혼자 고민하지 마세요.
        </p>
        <Link
          href="/"
          className="rounded-xl bg-accent-solid px-6 py-3 text-sm font-medium text-white transition-colors hover:opacity-90"
        >
          절대지켜 홈페이지로 이동하기
        </Link>
      </div>
    </div>
  );
}
