"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  useSimulationStore,
  type IDistributionRow,
  type ISimulationInput,
  type IOtherTenant,
} from "@/store/simulationStore";
import { runSimulation } from "@/lib/engine/bridge";

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString("ko-KR");

const fmtShort = (n: number) => {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억원`;
  if (n >= 10_000) return `${Math.round(n / 10_000).toLocaleString("ko-KR")}만원`;
  return `${n.toLocaleString("ko-KR")}원`;
};

const pct = (part: number, total: number) =>
  total === 0 ? "0" : ((part / total) * 100).toFixed(1);

// ── Build placeholder rows from input ────────────────────────────────────────

const buildPlaceholderRows = (input: ISimulationInput): IDistributionRow[] => {
  const rows: IDistributionRow[] = [];

  // 집행비용
  rows.push({
    step: "집행비용",
    category: "집행비용",
    creditorId: "execution_cost",
    creditorName: "집행기관",
    claimAmount: input.executionCost,
    distributedAmount: 0,
    remainingPool: 0,
    isMyTenant: false,
  });

  // 소액임차인
  rows.push({
    step: "STEP 1",
    category: "최선순위 소액임차인",
    creditorId: "my_tenant",
    creditorName: "나의 임차권",
    claimAmount: input.myDeposit,
    distributedAmount: 0,
    remainingPool: 0,
    isMyTenant: true,
    keyDate: input.myOpposabilityDate || undefined,
    note: "소액임차인 해당 여부는 엔진 계산 필요",
  });

  input.otherTenants
    .filter((ot: IOtherTenant) => ot.deposit > 0)
    .forEach((ot: IOtherTenant, i: number) => {
      rows.push({
        step: "STEP 1",
        category: "최선순위 소액임차인",
        creditorId: `other_tenant_${i}`,
        creditorName: `다른 세입자 ${i + 1}`,
        claimAmount: ot.deposit,
        distributedAmount: 0,
        remainingPool: 0,
        isMyTenant: false,
        keyDate: ot.opposabilityDate || undefined,
        note: "소액임차인 해당 여부는 엔진 계산 필요",
      });
    });

  // 당해세
  if (input.propertyTaxOption === "yes" && input.propertyTaxAmount > 0) {
    rows.push({
      step: "STEP 2",
      category: "당해세",
      creditorId: "property_tax",
      creditorName: "재산세",
      claimAmount: input.propertyTaxAmount,
      distributedAmount: 0,
      remainingPool: 0,
      isMyTenant: false,
      keyDate: input.propertyTaxLegalDate || undefined,
    });
  }

  // 날짜 경합
  if (input.mortgageMaxClaim > 0) {
    rows.push({
      step: "STEP 3",
      category: "근저당권",
      creditorId: "mortgage_1",
      creditorName: "선순위 근저당",
      claimAmount: input.mortgageMaxClaim,
      distributedAmount: 0,
      remainingPool: 0,
      isMyTenant: false,
      keyDate: input.mortgageRegDate || undefined,
    });
  }

  rows.push({
    step: "STEP 3",
    category: "확정일자 임차인",
    creditorId: "my_tenant_step3",
    creditorName: "나의 임차권",
    claimAmount: input.myDeposit,
    distributedAmount: 0,
    remainingPool: 0,
    isMyTenant: true,
    keyDate: input.myOpposabilityDate || undefined,
  });

  input.otherTenants
    .filter((ot: IOtherTenant) => ot.deposit > 0 && ot.opposabilityDate)
    .forEach((ot: IOtherTenant, i: number) => {
      rows.push({
        step: "STEP 3",
        category: "확정일자 임차인",
        creditorId: `other_tenant_step3_${i}`,
        creditorName: `다른 세입자 ${i + 1}`,
        claimAmount: ot.deposit,
        distributedAmount: 0,
        remainingPool: 0,
        isMyTenant: false,
        keyDate: ot.opposabilityDate || undefined,
      });
    });

  return rows;
};

// ── Category badge ────────────────────────────────────────────────────────────

// Notion-style muted category colors
const CATEGORY_COLORS: Record<string, string> = {
  "집행비용":           "bg-[#f7f7f5] text-[#787774] dark:bg-[#373737] dark:text-[#9b9b9b]",
  "최선순위 소액임차인": "bg-[#edf4f8] text-[#2474a0] dark:bg-[#28456c] dark:text-[#9ec5e0]",
  "상대적 소액임차인":   "bg-[#f3eef7] text-[#6940a5] dark:bg-[#432b6b] dark:text-[#c5aee0]",
  "당해세":            "bg-[#fdf5e3] text-[#9a6700] dark:bg-[#564328] dark:text-[#e8c469]",
  "담보물권":           "bg-[#fff0ee] text-[#c4554d] dark:bg-[#6e3b36] dark:text-[#e8a39a]",
  "확정일자 임차인":     "bg-[#eef6ee] text-[#2b7d2f] dark:bg-[#2b593f] dark:text-[#a5cba5]",
  "임금채권":           "bg-[#faf0f4] text-[#a84073] dark:bg-[#5a2d48] dark:text-[#dba1be]",
  "조세채권":           "bg-[#fdf1e4] text-[#b65c1e] dark:bg-[#5c3a1e] dark:text-[#dba67a]",
  "공과금":            "bg-[#eef4f8] text-[#2878a0] dark:bg-[#243d53] dark:text-[#8fbdd4]",
  "일반채권":           "bg-[#f3f3f1] text-[#6b6b69] dark:bg-[#3a3a3a] dark:text-[#9b9b9b]",
  "배당 불가":          "bg-[#f3f3f1] text-[#6b6b69] dark:bg-[#3a3a3a] dark:text-[#9b9b9b]",
  "근저당권":           "bg-[#fff0ee] text-[#c4554d] dark:bg-[#6e3b36] dark:text-[#e8a39a]",
};

// Mobile wrap map for long labels
const CATEGORY_WRAP: Record<string, [string, string]> = {
  "최선순위 소액임차인": ["최선순위", "소액임차인"],
  "상대적 소액임차인":   ["상대적", "소액임차인"],
  "확정일자 임차인":    ["확정일자", "임차인"],
};

const CategoryBadge = ({ category }: { category: string }) => {
  const wrap = CATEGORY_WRAP[category];
  return (
    <span
      className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-medium leading-tight
        ${CATEGORY_COLORS[category] ?? "bg-badge-bg text-muted"}`}
    >
      {wrap ? (
        <>
          <span className="hidden sm:inline">{wrap[0]} {wrap[1]}</span>
          <span className="sm:hidden">
            {wrap[0]}<br />{wrap[1]}
          </span>
        </>
      ) : (
        category
      )}
    </span>
  );
};

// ── Table row ─────────────────────────────────────────────────────────────────

const TableRow = ({
  row,
  index,
  hasResult,
}: {
  row: IDistributionRow;
  index: number;
  hasResult: boolean;
}) => {
  const isHighlight = row.isMyTenant;
  const isExecution = row.step === "집행비용";
  const gotNothing = hasResult && row.distributedAmount === 0;

  return (
    <tr
      className={`border-b border-divider transition-colors
        ${isHighlight ? "bg-accent-bg" : "hover:bg-hover-bg"}
        ${gotNothing ? "opacity-50" : ""}`}
    >
      <td className="px-2 py-2.5 text-center text-xs text-muted w-6">
        {index + 1}
      </td>
      <td className="px-1.5 py-2.5">
        <CategoryBadge category={row.category} />
      </td>
      <td className="px-2 py-2.5">
        <div className="flex items-center gap-1">
          {isHighlight && (
            <span className="text-accent text-sm" aria-label="나의 임차권">★</span>
          )}
          <span className={`text-[13px] font-medium ${isHighlight ? "text-accent" : "text-foreground"}`}>
            {row.creditorName}
          </span>
        </div>
        {row.note && (
          <p className="text-[10px] text-muted mt-0.5 leading-tight">{row.note}</p>
        )}
      </td>
      <td className="px-1.5 py-2.5 text-center text-xs text-sub-text tabular-nums whitespace-nowrap">
        {row.keyDate ?? "—"}
      </td>
      <td className="px-2 py-2.5 text-right text-[13px] text-foreground tabular-nums whitespace-nowrap">
        {isExecution ? "—" : `${fmt(row.claimAmount)}원`}
      </td>
      <td className="px-2 py-2.5 text-right tabular-nums whitespace-nowrap">
        {hasResult ? (
          <span className={`text-[13px] font-semibold ${isHighlight ? "text-accent" : row.distributedAmount > 0 ? "text-foreground" : "text-muted"}`}>
            {`${fmt(row.distributedAmount)}원`}
          </span>
        ) : (
          <span className="text-xs text-muted italic">계산 전</span>
        )}
      </td>
      <td className="px-2 py-2.5 text-right text-[13px] tabular-nums whitespace-nowrap">
        {hasResult ? (
          <span className="text-sub-text">{`${fmt(row.remainingPool)}원`}</span>
        ) : (
          <span className="text-xs text-muted italic">—</span>
        )}
      </td>
    </tr>
  );
};

// ── Hero ──────────────────────────────────────────────────────────────────────

const Hero = ({
  myAmount,
  myDeposit,
  hasResult,
}: {
  myAmount: number;
  myDeposit: number;
  hasResult: boolean;
}) => (
  <div className={`rounded-2xl p-6 ${hasResult ? "bg-accent" : "bg-card-bg border border-card-border"}`}>
    {hasResult ? (
      <div className="text-white">
        <p className="text-sm font-medium opacity-80 mb-1">예상 배당액</p>
        <p className="text-4xl font-bold tracking-tight">{fmtShort(myAmount)}</p>
        <div className="mt-3 flex items-center gap-3 text-sm opacity-90">
          <span>보증금 {fmtShort(myDeposit)} 중 회수율</span>
          <span className="text-xl font-bold">{pct(myAmount, myDeposit)}%</span>
        </div>
      </div>
    ) : (
      <div>
        <p className="text-sm font-medium text-sub-text mb-1">예상 배당액</p>
        <p className="text-2xl font-bold text-foreground">계산 결과 대기 중</p>
        <p className="text-sm text-muted mt-2">
          엔진 재구축 후 이 화면에 배당액이 표시됩니다.
        </p>
      </div>
    )}
  </div>
);

// ── Risk Panel ────────────────────────────────────────────────────────────────

const RiskPanel = ({ myAmount, myDeposit }: { myAmount: number; myDeposit: number }) => {
  const rate = myDeposit === 0 ? 100 : (myAmount / myDeposit) * 100;
  if (rate >= 80) return null;
  return (
    <div className="rounded-2xl border border-yellow-300/50 bg-yellow-50/80 dark:bg-yellow-900/10 dark:border-yellow-700/30 p-5">
      <div className="flex items-start gap-3">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className="text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" aria-hidden="true">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <div>
          <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
            {rate < 50 ? "회수 가능성이 낮습니다" : "부분 회수 예상"}
          </p>
          <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1 leading-relaxed">
            배당요구종기일 전에 반드시 배당요구를 신청하고, 임차권등기명령을 고려해 보세요.
          </p>
        </div>
      </div>
    </div>
  );
};

// ── Assumptions Panel (결과 페이지용) ──────────────────────────────────────────

const AssumptionsPanel = () => (
  <div className="rounded-2xl border border-card-border bg-card-bg p-5">
    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        className="text-yellow-500" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      이 결과의 전제 조건
    </h3>
    <ul className="text-xs text-sub-text space-y-1.5 leading-relaxed">
      <li className="flex items-start gap-1.5">
        <span className="mt-0.5 flex-shrink-0 text-yellow-500">•</span>
        <span>배당요구를 한 세입자만 계산에 포함되었습니다.</span>
      </li>
      <li className="flex items-start gap-1.5">
        <span className="mt-0.5 flex-shrink-0 text-yellow-500">•</span>
        <span>대항력 발생일이 입력되면 대항력이 있는 것으로 가정했습니다. 경매개시결정 등기 전 대항요건 구비 여부는 별도로 검증하지 않았습니다.</span>
      </li>
      <li className="flex items-start gap-1.5">
        <span className="mt-0.5 flex-shrink-0 text-yellow-500">•</span>
        <span>증액된 보증금은 반영되지 않았습니다. 계약 갱신으로 보증금이 변동된 경우 소액임차인 판정이 달라질 수 있습니다.</span>
      </li>
      <li className="flex items-start gap-1.5">
        <span className="mt-0.5 flex-shrink-0 text-yellow-500">•</span>
        <span>소액임차인 기준표의 지역 구간은 근저당 설정일 시점의 법령을 기준으로 판단했습니다. 같은 도시라도 시기에 따라 구간이 달라질 수 있습니다.</span>
      </li>
    </ul>
  </div>
);

// ── Action Links ──────────────────────────────────────────────────────────────

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
];

// ── Sale Price Adjuster ───────────────────────────────────────────────────────

const RATE_BUTTONS = [100, 90, 86, 80, 70, 60] as const;
const STEP_AMOUNT = 10_000_000; // ±1000만원

const SalePriceAdjuster = ({
  salePrice,
  appraisalValue,
  onChange,
}: {
  salePrice: number;
  appraisalValue: number;
  onChange: (price: number) => void;
}) => {
  const hasAppraisal = appraisalValue > 0;
  const currentRate = hasAppraisal ? ((salePrice / appraisalValue) * 100).toFixed(1) : null;

  const handleStep = (direction: 1 | -1) => {
    const next = salePrice + direction * STEP_AMOUNT;
    if (next > 0) onChange(next);
  };

  return (
    <div className="rounded-2xl bg-card-bg border border-card-border p-5">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className="text-accent" aria-hidden="true">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
        매각대금 조정
      </h3>

      {/* Current sale price + up/down */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <button
          type="button"
          onClick={() => handleStep(-1)}
          className="w-10 h-10 rounded-xl border border-card-border bg-background
            flex items-center justify-center text-foreground hover:bg-hover-bg
            active:scale-95 transition-all"
          aria-label="매각대금 1000만원 감소"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
        <div className="text-center">
          <p className="text-2xl font-bold text-accent tabular-nums">{fmtShort(salePrice)}</p>
          {currentRate && (
            <p className="text-xs text-sub-text mt-0.5">
              감정가 대비 <span className="font-semibold text-foreground">{currentRate}%</span>
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => handleStep(1)}
          className="w-10 h-10 rounded-xl border border-card-border bg-background
            flex items-center justify-center text-foreground hover:bg-hover-bg
            active:scale-95 transition-all rotate-180"
          aria-label="매각대금 1000만원 증가"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
      </div>

      {/* Appraisal info + rate buttons */}
      {hasAppraisal && (
        <div>
          <p className="text-xs text-sub-text text-center mb-2">
            감정가 <span className="font-medium text-foreground">{fmtShort(appraisalValue)}</span>
          </p>
          <div className="flex gap-2 justify-center">
            {RATE_BUTTONS.map((rate) => {
              const target = Math.round(appraisalValue * rate / 100);
              const isActive = salePrice === target;
              return (
                <button
                  key={rate}
                  type="button"
                  onClick={() => onChange(target)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                    ${isActive
                      ? "bg-accent text-white"
                      : "bg-background border border-card-border text-sub-text hover:text-foreground hover:bg-hover-bg"
                    }`}
                >
                  {rate}%
                </button>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-xs text-muted text-center mt-3">
        매각대금을 조정하면 배당 결과가 실시간으로 변경됩니다.
      </p>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SimulateResultPage() {
  const router = useRouter();
  const { input, result, setInput, setResult } = useSimulationStore();

  const hasInput = input.myDeposit > 0 && input.mortgageRegDate;
  useEffect(() => {
    if (!hasInput) router.replace("/simulate");
  }, [hasInput, router]);

  const handleSalePriceChange = useCallback(
    (price: number) => {
      setInput({ salePrice: price });
      const newResult = runSimulation({ ...input, salePrice: price });
      setResult(newResult);
    },
    [input, setInput, setResult],
  );

  if (!hasInput) return null;

  const rows = result ? result.rows : buildPlaceholderRows(input);
  const hasResult = result !== null;
  const myAmount = result?.myDistributedAmount ?? 0;
  const remainingBalance = result?.remainingBalance ?? 0;

  return (
    <div className="max-w-3xl mx-auto px-4 pt-10 pb-24">
      {/* Back */}
      <Link
        href="/simulate"
        className="inline-flex items-center gap-1.5 text-sm text-sub-text hover:text-foreground transition-colors mb-8"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        다시 입력하기
      </Link>

      <div className="flex flex-col gap-5">
        {/* Hero */}
        <Hero myAmount={myAmount} myDeposit={input.myDeposit} hasResult={hasResult} />

        {/* Sale Price Adjuster */}
        {hasResult && (
          <SalePriceAdjuster
            salePrice={input.salePrice}
            appraisalValue={input.appraisalValue}
            onChange={handleSalePriceChange}
          />
        )}

        {/* Risk */}
        {hasResult && <RiskPanel myAmount={myAmount} myDeposit={input.myDeposit} />}

        {/* Assumptions */}
        <AssumptionsPanel />

        {/* Distribution Table */}
        <div className="bg-card-bg border border-card-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-divider">
            <h2 className="text-sm font-semibold text-foreground">배당 순서표</h2>
            <p className="text-xs text-sub-text mt-0.5">
              집행비용부터 배당 순서대로 • 매각대금{" "}
              <span className="font-medium text-foreground">{fmtShort(input.salePrice)}</span>
              {" "}→ 배당가능액{" "}
              <span className="font-medium text-foreground">{fmtShort(input.salePrice - input.executionCost)}</span>
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-divider bg-badge-bg/60">
                  <th className="px-2 py-2 text-center text-xs font-medium text-muted w-6">#</th>
                  <th className="px-1.5 py-2 text-left text-xs font-medium text-muted">구분</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-muted">채권자</th>
                  <th className="px-1.5 py-2 text-center text-xs font-medium text-muted">일자</th>
                  <th className="px-2 py-2 text-right text-xs font-medium text-muted">채권액</th>
                  <th className="px-2 py-2 text-right text-xs font-medium text-muted">배당액</th>
                  <th className="px-2 py-2 text-right text-xs font-medium text-muted">잔액</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <TableRow key={`${row.creditorId}-${i}`} row={row} index={i} hasResult={hasResult} />
                ))}
              </tbody>
            </table>
          </div>

          {hasResult && (
            <div className="px-5 py-3 border-t border-divider bg-badge-bg/40 flex items-center justify-between">
              <span className="text-xs text-sub-text">최종 잔여금 (소유자 반환)</span>
              <span className="text-sm font-semibold text-foreground tabular-nums">
                {fmt(remainingBalance)}원
              </span>
            </div>
          )}

          {!hasResult && (
            <div className="px-5 py-4 border-t border-divider">
              <p className="text-xs text-muted text-center">
                ※ 배당액 · 잔액 칼럼은 엔진 재구축 후 자동으로 채워집니다.
              </p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 px-1">
          {[
            "집행비용", "최선순위 소액임차인", "상대적 소액임차인", "당해세",
            "담보물권", "확정일자 임차인", "임금채권", "조세채권", "공과금", "일반채권",
          ].map((cat) => (
            <div key={cat} className="flex items-center gap-1.5">
              <CategoryBadge category={cat} />
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <span className="text-accent text-xs">★</span>
            <span className="text-xs text-muted">나의 임차권</span>
          </div>
        </div>

        {/* Action Links */}
        <div className="rounded-2xl bg-card-bg border border-card-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">지금 해야 할 일</h3>
          <ul className="flex flex-col gap-1">
            {ACTION_ITEMS.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3 p-3 rounded-xl hover:bg-hover-bg transition-colors duration-150"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    className="text-accent mt-0.5 flex-shrink-0" aria-hidden="true">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">
                      {item.title}
                    </p>
                    <p className="text-xs text-sub-text mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Disclaimer */}
        <div className="rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 px-4 py-3">
          <p className="text-xs text-muted text-center leading-relaxed">
            이 결과는 입력하신 정보를 기반으로 한 <strong>참고용 시뮬레이션</strong>입니다.
            실제 배당 결과는 법원의 판단에 따라 달라질 수 있으며,
            중요한 결정을 내리기 전에 반드시 법률 전문가와 상담하시기 바랍니다.
            <br />
            <span className="text-yellow-600 dark:text-yellow-400">
              증액보증금 반영 불가 · 배당요구 미신청자 미포함 · 대항요건 구비 시점 미검증
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}