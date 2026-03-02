"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  useSimulationStore,
  type IDistributionRow,
  type ISimulationInput,
  type IOtherTenant,
} from "@/store/simulationStore";

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
// Until the engine is rebuilt this produces the table structure with 0s for
// calculated columns so the UI is fully visible and testable.

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

  // STEP 1: 소액임차인 (placeholder — engine will determine eligibility)
  rows.push({
    step: "STEP 1",
    category: "소액임차인 최우선변제",
    creditorId: "my_tenant",
    creditorName: "나의 임차권",
    claimAmount: input.myDeposit,
    distributedAmount: 0,
    remainingPool: 0,
    isMyTenant: true,
    note: "소액임차인 해당 여부는 엔진 계산 필요",
  });

  input.otherTenants
    .filter((ot: IOtherTenant) => ot.deposit > 0)
    .forEach((ot: IOtherTenant, i: number) => {
      rows.push({
        step: "STEP 1",
        category: "소액임차인 최우선변제",
        creditorId: `other_tenant_${i}`,
        creditorName: `다른 세입자 ${i + 1}`,
        claimAmount: ot.deposit,
        distributedAmount: 0,
        remainingPool: 0,
        isMyTenant: false,
        note: "소액임차인 해당 여부는 엔진 계산 필요",
      });
    });

  // STEP 2: 당해세
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
    });
  }

  // STEP 3: 날짜 경합 (근저당 + 확정일자 임차인)
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
  });

  input.otherTenants
    .filter((ot: IOtherTenant) => ot.deposit > 0 && ot.confirmedDate)
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
      });
    });

  return rows;
};

// ── Step badge ────────────────────────────────────────────────────────────────

const STEP_COLORS: Record<string, string> = {
  "집행비용": "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
  "STEP 1":  "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300",
  "STEP 2":  "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
  "STEP 3":  "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  "STEP 4":  "bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-300",
  "STEP 5":  "bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-300",
  "STEP 6":  "bg-red-50 text-red-500 dark:bg-red-950 dark:text-red-300",
  "STEP 7":  "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500",
};

const StepBadge = ({ step }: { step: string }) => (
  <span
    className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap
      ${STEP_COLORS[step] ?? "bg-badge-bg text-muted"}`}
  >
    {step}
  </span>
);

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
      {/* # */}
      <td className="px-3 py-3 text-center text-xs text-muted w-8">
        {index + 1}
      </td>

      {/* 단계 */}
      <td className="px-3 py-3 w-24">
        <StepBadge step={row.step} />
      </td>

      {/* 구분 */}
      <td className="px-3 py-3 text-xs text-sub-text whitespace-nowrap">
        {row.category}
      </td>

      {/* 채권자 */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5">
          {isHighlight && (
            <span className="text-accent" aria-label="나의 임차권">★</span>
          )}
          <span className={`text-sm font-medium ${isHighlight ? "text-accent" : "text-foreground"}`}>
            {row.creditorName}
          </span>
        </div>
        {row.note && (
          <p className="text-[10px] text-muted mt-0.5">{row.note}</p>
        )}
      </td>

      {/* 채권액 */}
      <td className="px-3 py-3 text-right text-sm text-foreground tabular-nums whitespace-nowrap">
        {isExecution ? "—" : `${fmt(row.claimAmount)}원`}
      </td>

      {/* 배당액 */}
      <td className="px-3 py-3 text-right tabular-nums whitespace-nowrap">
        {hasResult ? (
          <span className={`text-sm font-semibold ${isHighlight ? "text-accent" : row.distributedAmount > 0 ? "text-foreground" : "text-muted"}`}>
            {`${fmt(row.distributedAmount)}원`}
          </span>
        ) : (
          <span className="text-xs text-muted italic">계산 전</span>
        )}
      </td>

      {/* 배당 후 잔액 */}
      <td className="px-3 py-3 text-right text-sm tabular-nums whitespace-nowrap">
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

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SimulateResultPage() {
  const router = useRouter();
  const { input, result } = useSimulationStore();

  // Redirect if user lands here without going through the form
  const hasInput = input.myDeposit > 0 && input.mortgageRegDate;
  useEffect(() => {
    if (!hasInput) router.replace("/simulate");
  }, [hasInput, router]);

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

        {/* Risk */}
        {hasResult && <RiskPanel myAmount={myAmount} myDeposit={input.myDeposit} />}

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

          {/* Scrollable table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-divider bg-badge-bg/60">
                  <th className="px-3 py-2.5 text-center text-xs font-medium text-muted w-8">#</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-muted w-24">단계</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-muted">구분</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-muted">채권자</th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium text-muted">채권액</th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium text-muted">배당액</th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium text-muted">배당 후 잔액</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <TableRow key={`${row.creditorId}-${i}`} row={row} index={i} hasResult={hasResult} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Remaining balance footer */}
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
        <div className="flex flex-wrap gap-x-5 gap-y-2 px-1">
          {[
            ["집행비용", STEP_COLORS["집행비용"]],
            ["STEP 1 소액임차인", STEP_COLORS["STEP 1"]],
            ["STEP 2 당해세", STEP_COLORS["STEP 2"]],
            ["STEP 3 날짜경합", STEP_COLORS["STEP 3"]],
            ["STEP 4 임금", STEP_COLORS["STEP 4"]],
            ["STEP 5 일반조세", STEP_COLORS["STEP 5"]],
            ["STEP 6 공과금", STEP_COLORS["STEP 6"]],
            ["STEP 7 일반채권", STEP_COLORS["STEP 7"]],
          ].map(([label, cls]) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${cls}`}>
                {(label as string).split(" ")[0]}
              </span>
              <span className="text-xs text-muted">{(label as string).split(" ").slice(1).join(" ")}</span>
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
        <p className="text-xs text-muted text-center leading-relaxed px-2">
          이 결과는 입력하신 정보를 기반으로 한 참고용 시뮬레이션입니다.
          실제 배당 결과는 법원의 판단에 따라 달라질 수 있으며,
          중요한 결정을 내리기 전에 반드시 법률 전문가와 상담하시기 바랍니다.
        </p>
      </div>
    </div>
  );
}

