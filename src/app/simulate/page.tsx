"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import {
  useSimulationStore,
  type IOtherTenant,
  type PropertyTaxOption,
  type PropertyType,
  type Region,
  type ISimulationInput,
} from "@/store/simulationStore";
import { runSimulation } from "@/lib/engine/bridge";

// ── 데모 데이터: 서울중앙지방법원 2023타경5053 ─────────────────────────────────
// 엑셀(임차인_대항력_정리.xlsx) 기준. "나" = 김○○ (대항력 2020-08-24, 보증금 1.8억)
// 최선순위 근저당 2017.12.04, 매각대금 1,784,756,000

const DEMO_2023TA5053 = {
  salePrice:     1_784_756_000,
  executionCost:     9_811_568,
  appraisalValue: 2_230_942_880,

  // 나의 임차권: 김○○
  myDeposit:            160_000_000,
  myOpposabilityDate:   "2020-08-24", // 대항력 발생일
  myHasOccupancy:       true,

  // 선순위 근저당 — 웰컴저축은행 근저당권부질권
  mortgagePrincipal: 784_560_000,
  mortgageMaxClaim:  784_560_000,
  mortgageRegDate:   "2017-12-04",

  propertyType: "multi_family" as const,
  region: "seoul" as const,

  propertyTaxOption: "no" as const,
  propertyTaxAmount: 0,
  propertyTaxLegalDate: "",

  // 다른 세입자 16명 (대항력 발생일 순)
  otherTenants: [
    { id: "t-01", deposit: 150_000_000, opposabilityDate: "2019-12-02", hasOccupancy: true  }, // 서○○
    { id: "t-02", deposit: 300_000_000, opposabilityDate: "2019-12-27", hasOccupancy: true  }, // 노○○
    { id: "t-03", deposit: 110_000_000, opposabilityDate: "2020-01-07", hasOccupancy: true  }, // LH(서진아)
    { id: "t-04", deposit: 100_000_000, opposabilityDate: "2021-01-13", hasOccupancy: true  }, // 나○○
    { id: "t-05", deposit: 150_000_000, opposabilityDate: "2021-06-04", hasOccupancy: true  }, // 김○○
    { id: "t-06", deposit: 120_000_000, opposabilityDate: "2021-08-13", hasOccupancy: true  }, // LH(양성경)
    { id: "t-07", deposit: 120_000_000, opposabilityDate: "2021-08-23", hasOccupancy: true  }, // LH(이예원)
    { id: "t-08", deposit: 120_000_000, opposabilityDate: "2021-12-29", hasOccupancy: true  }, // 박○○
    { id: "t-09", deposit: 120_000_000, opposabilityDate: "2021-12-31", hasOccupancy: true  }, // 박○○
    { id: "t-10", deposit: 100_000_000, opposabilityDate: "2022-02-08", hasOccupancy: true  }, // LH(임성준)
    { id: "t-11", deposit: 130_000_000, opposabilityDate: "2022-02-16", hasOccupancy: true  }, // LH(우대영)
    { id: "t-12", deposit: 120_000_000, opposabilityDate: "2022-04-21", hasOccupancy: true  }, // LH(유기학)
    { id: "t-13", deposit: 110_000_000, opposabilityDate: "2022-05-25", hasOccupancy: true  }, // LH(양현진)
    { id: "t-14", deposit: 120_000_000, opposabilityDate: "2022-07-01", hasOccupancy: true  }, // LH(조희수)
    { id: "t-15", deposit:  95_000_000, opposabilityDate: "2022-09-08", hasOccupancy: true  }, // 이○○
    { id: "t-16", deposit: 130_000_000, opposabilityDate: "2022-09-26", hasOccupancy: true  }, // 야○○
  ],
} satisfies ISimulationInput;

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatKRW = (n: number) =>
  n >= 100_000_000
    ? `${(n / 100_000_000).toFixed(1)}억`
    : n >= 10_000
    ? `${Math.round(n / 10_000).toLocaleString("ko-KR")}만원`
    : `${n.toLocaleString("ko-KR")}원`;

const REGION_LABELS: Record<Region, string> = {
  seoul: "서울특별시",
  metropolitan_overcrowded: "수도권 과밀억제권역",
  metropolitan: "광역시 등",
  others: "그 밖의 지역",
};

// ── Sub-components ─────────────────────────────────────────────────────────────

const SectionTitle = ({
  step,
  title,
  sub,
}: {
  step: string;
  title: string;
  sub?: string;
}) => (
  <div className="mb-5">
    <span className="text-xs font-medium text-accent uppercase tracking-widest">
      {step}
    </span>
    <h2 className="text-lg font-bold text-foreground mt-0.5">{title}</h2>
    {sub && <p className="text-sm text-sub-text mt-1 leading-relaxed">{sub}</p>}
  </div>
);

const FieldLabel = ({
  htmlFor,
  children,
  info,
}: {
  htmlFor: string;
  children: React.ReactNode;
  info?: string;
}) => {
  const [showInfo, setShowInfo] = useState(false);
  return (
    <div className="flex items-center gap-1.5 mb-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground">
        {children}
      </label>
      {info && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowInfo(v => !v)}
            className="w-4 h-4 rounded-full bg-card-border text-muted text-[10px] font-bold
              hover:bg-accent hover:text-white transition-colors cursor-pointer flex items-center justify-center"
            aria-label="안내"
          >
            i
          </button>
          {showInfo && (
            <div className="absolute left-6 top-0 z-10 w-64 px-3 py-2 rounded-lg bg-foreground text-background
              text-xs leading-relaxed shadow-lg">
              {info}
              <button
                type="button"
                onClick={() => setShowInfo(false)}
                className="block mt-1 text-accent text-[10px] underline cursor-pointer"
              >
                닫기
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const InputField = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={`w-full px-3 py-2.5 rounded-xl border border-card-border bg-background text-foreground text-sm
      placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent
      transition-colors duration-150 ${props.className ?? ""}`}
  />
);

const MONEY_BUTTONS = [
  { label: "+1억", value: 100_000_000 },
  { label: "+1000만", value: 10_000_000 },
  { label: "+100만", value: 1_000_000 },
] as const;

const MoneyInput = ({
  id,
  value,
  onChange,
  placeholder = "0",
  compact = false,
}: {
  id: string;
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
  compact?: boolean;
}) => {
  const [raw, setRaw] = useState(value ? value.toLocaleString("ko-KR") : "");
  const [isFocused, setIsFocused] = useState(false);

  // Sync from parent when not focused
  useEffect(() => {
    if (!isFocused) {
      setRaw(value ? value.toLocaleString("ko-KR") : "");
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/[^0-9]/g, "");
    const num = input ? Number(input) : 0;
    setRaw(input ? num.toLocaleString("ko-KR") : "");
    onChange(num);
  };

  const handleFocus = () => {
    setIsFocused(true);
    // Show raw digits on focus for easy editing
    setRaw(value ? String(value) : "");
  };

  const handleBlur = () => {
    setIsFocused(false);
    setRaw(value ? value.toLocaleString("ko-KR") : "");
  };

  const addAmount = (amount: number) => {
    const next = value + amount;
    onChange(next);
    if (!isFocused) setRaw(next.toLocaleString("ko-KR"));
  };

  return (
    <div>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={raw}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl border border-card-border bg-background text-foreground text-sm
          placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent
          transition-colors duration-150 tabular-nums"
      />
      {!compact && (
        <div className="flex gap-1.5 mt-2">
          {MONEY_BUTTONS.map(({ label, value: amt }) => (
            <button
              key={label}
              type="button"
              onClick={() => addAmount(amt)}
              className="px-2.5 py-1.5 rounded-lg border border-card-border bg-background text-xs font-medium
                text-sub-text hover:border-accent hover:text-accent active:bg-accent-bg
                transition-colors duration-150 cursor-pointer"
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => { onChange(0); setRaw(""); }}
            className="px-2.5 py-1.5 rounded-lg border border-card-border bg-background text-xs font-medium
              text-muted hover:border-error hover:text-error active:bg-error-bg
              transition-colors duration-150 cursor-pointer"
          >
            초기화
          </button>
        </div>
      )}
      {value > 0 && (
        <p className="text-xs text-sub-text mt-1.5">{formatKRW(value)}</p>
      )}
    </div>
  );
};

const DateInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <InputField
    type="date"
    {...props}
    className="[color-scheme:light] dark:[color-scheme:dark]"
  />
);

const InfoChip = ({ children }: { children: React.ReactNode }) => (
  <div className="mt-2 px-3 py-2 rounded-lg bg-accent-bg text-accent text-xs leading-relaxed">
    {children}
  </div>
);

const FieldTip = ({
  label = "도움말",
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 text-xs text-sub-text hover:text-accent
          transition-colors duration-150 cursor-pointer focus-visible:outline-none
          focus-visible:ring-2 focus-visible:ring-accent/40 rounded"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span>{label}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div
          className="mt-2 px-4 py-3 rounded-xl bg-card-bg border border-card-border
            text-xs text-sub-text leading-relaxed space-y-2 animate-in fade-in slide-in-from-top-1 duration-200"
        >
          {children}
        </div>
      )}
    </div>
  );
};

const WarningChip = ({ children }: { children: React.ReactNode }) => (
  <div className="mt-2 px-3 py-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/40 text-yellow-800 dark:text-yellow-300 text-xs leading-relaxed">
    {children}
  </div>
);

const Card = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`bg-card-bg border border-card-border rounded-2xl p-5 ${className}`}>
    {children}
  </div>
);

const AccordionSection = ({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-card-border rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-medium text-foreground
          hover:bg-hover-bg transition-colors duration-150 cursor-pointer focus-visible:outline-none
          focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <span>{title}</span>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-card-border bg-card-bg">
          {children}
        </div>
      )}
    </div>
  );
};

// ── Other Tenant Row ──────────────────────────────────────────────────────────

const OtherTenantRow = ({
  tenant,
  onChange,
  onRemove,
  index,
}: {
  tenant: IOtherTenant;
  onChange: (t: IOtherTenant) => void;
  onRemove: () => void;
  index: number;
}) => (
  <fieldset className="border border-card-border rounded-xl p-4 mb-3">
    <legend className="text-xs font-medium text-sub-text px-1">
      다른 세입자 {index + 1}
    </legend>
    <div className="grid grid-cols-2 gap-3 mt-2">
      <div>
        <FieldLabel htmlFor={`ot-deposit-${tenant.id}`}>보증금</FieldLabel>
        <MoneyInput
          id={`ot-deposit-${tenant.id}`}
          value={tenant.deposit}
          onChange={(v) => onChange({ ...tenant, deposit: v })}
          placeholder="0"
          compact
        />
      </div>
      <div>
        <FieldLabel htmlFor={`ot-opposability-${tenant.id}`}>대항력 발생일</FieldLabel>
        <DateInput
          id={`ot-opposability-${tenant.id}`}
          value={tenant.opposabilityDate}
          onChange={(e) => onChange({ ...tenant, opposabilityDate: e.target.value })}
        />
      </div>
    </div>
    <button
      type="button"
      onClick={onRemove}
      className="mt-3 text-xs text-error hover:underline cursor-pointer"
    >
      삭제
    </button>
  </fieldset>
);

// ── Assumptions Banner ────────────────────────────────────────────────────────

const AssumptionsBanner = () => (
  <Card className="border-yellow-200 dark:border-yellow-800/40 bg-yellow-50/50 dark:bg-yellow-900/10">
    <div className="flex items-start gap-3">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        className="text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <div>
        <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
          시뮬레이션 전제 조건
        </p>
        <ul className="text-xs text-yellow-700 dark:text-yellow-400 space-y-1.5 leading-relaxed">
          <li className="flex items-start gap-1.5">
            <span className="mt-0.5 flex-shrink-0">•</span>
            <span>
              <strong>배당요구를 한 세입자만</strong> 계산에 포함됩니다.
              배당요구를 하지 않은 세입자는 배당 대상에서 제외됩니다.
            </span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="mt-0.5 flex-shrink-0">•</span>
            <span>
              대항력 발생일이 입력되면 <strong>대항력이 있는 것으로 가정</strong>합니다.
              경매개시결정 등기 전 대항요건 구비 여부는 별도로 검증하지 않습니다.
            </span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="mt-0.5 flex-shrink-0">•</span>
            <span>
              <strong>증액된 보증금은 반영되지 않습니다.</strong>
              계약 갱신 시 보증금이 올라간 경우 소액임차인 여부가 달라질 수 있으나
              이 시뮬레이터는 현재 입력된 보증금만으로 판단합니다.
            </span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="mt-0.5 flex-shrink-0">•</span>
            <span>
              이 결과는 <strong>참고용</strong>이며, 실제 배당 결과는 법원의 판단에 따라 달라질 수 있습니다.
            </span>
          </li>
        </ul>
      </div>
    </div>
  </Card>
);

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SimulatePage() {
  const router = useRouter();
  const { input, setInput, setResult } = useSimulationStore();

  const [address, setAddress] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Section 1 state
  type BidRateOption = "none" | "100" | "90" | "86" | "80" | "custom";
  const [appraisalMode, setAppraisalMode] = useState<"known" | "unknown">("known");
  const [appraisalValue, setAppraisalValue] = useState(0);
  const [isSold, setIsSold] = useState(false);
  const [bidRateOption, setBidRateOption] = useState<BidRateOption>("none");
  const [customBidRate, setCustomBidRate] = useState(85);

  const loadDemo = () => {
    setInput(DEMO_2023TA5053);
    setAddress("서울시 동작구 대방동 393-57");
    setAppraisalMode("known");
    setAppraisalValue(2_230_942_880);
    setIsSold(true);
    setBidRateOption("none");
    setErrors({});
  };

  // Calculate sale price from base amount + bid rate
  const calcFromRate = (base: number, rate: number) =>
    base > 0 && rate > 0 ? Math.round(base * (rate / 100)) : 0;

  const handleBidRateSelect = (option: BidRateOption, base: number) => {
    setBidRateOption(option);
    if (option === "none") return;
    const rate = option === "custom" ? customBidRate : Number(option);
    const v = calcFromRate(base, rate);
    if (v > 0) setInput({ salePrice: v });
  };

  const handleCustomRateInput = (rate: number, base: number) => {
    setCustomBidRate(rate);
    const v = calcFromRate(base, rate);
    if (v > 0) setInput({ salePrice: v });
  };

  const addOtherTenant = () => {
    setInput({
      otherTenants: [
        ...input.otherTenants,
        {
          id: crypto.randomUUID(),
          deposit: 0,
          opposabilityDate: "",
          hasOccupancy: true,
        },
      ],
    });
  };

  const updateOtherTenant = (id: string, t: IOtherTenant) => {
    setInput({ otherTenants: input.otherTenants.map((ot) => (ot.id === id ? t : ot)) });
  };

  const removeOtherTenant = (id: string) => {
    setInput({ otherTenants: input.otherTenants.filter((ot) => ot.id !== id) });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!input.salePrice || input.salePrice <= 0) errs.salePrice = "매각대금을 입력해주세요";
    if (!input.myDeposit || input.myDeposit <= 0) errs.myDeposit = "보증금을 입력해주세요";
    if (!input.myOpposabilityDate) errs.myOpposabilityDate = "대항력 발생일을 입력해주세요";
    if (!input.mortgageRegDate) errs.mortgageRegDate = "근저당 설정일을 입력해주세요";
    if (!input.mortgageMaxClaim || input.mortgageMaxClaim <= 0) errs.mortgageMaxClaim = "채권최고액을 입력해주세요";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setInput({ appraisalValue });
    const updatedInput = { ...input, appraisalValue };
    const result = runSimulation(updatedInput);
    setResult(result);
    router.push("/simulate/result");
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pt-10 pb-24">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          배당 시뮬레이터
        </h1>
        <p className="text-sm text-sub-text mt-2 leading-relaxed">
          경매 매각대금에서 내 보증금이 얼마나 돌아올 수 있는지 계산해 드려요.
          <br />
          입력 정보는 서버에 저장되지 않습니다.
        </p>

        {/* 데모 배너 */}
        <button
          type="button"
          onClick={loadDemo}
          className="mt-4 w-full flex items-center gap-3 px-4 py-3 rounded-xl
            bg-accent-bg border border-accent/20 hover:border-accent/50
            transition-colors duration-150 cursor-pointer text-left group"
        >
          <span className="text-lg" aria-hidden="true">⚖️</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-accent">
              실제 사례로 바로 체험하기
            </p>
            <p className="text-xs text-sub-text mt-0.5">
              서울중앙지방법원 2023타경5053 · 다가구 · 17.8억 · 임차인 17명
            </p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className="text-accent flex-shrink-0 group-hover:translate-x-0.5 transition-transform" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* 전제 조건 배너 */}
      <div className="mb-6">
        <AssumptionsBanner />
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-5">

          {/* ── SECTION 1: 매각대금 ── */}
          <Card>
            <SectionTitle step="Section 1" title="건물 감정가 및 예상 매각대금"
              sub="감정가를 알면 낙찰가율로 예상 매각대금을 계산할 수 있어요." />

            {/* 감정가 모드 선택 */}
            <fieldset className="mb-4">
              <legend className="text-sm font-medium text-foreground mb-3">건물 감정가를 알고 있나요?</legend>
              <div className="flex gap-3">
                {([["known", "알고 있어요"], ["unknown", "모릅니다"]] as const).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => { setAppraisalMode(val); setBidRateOption("none"); }}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors duration-150 cursor-pointer
                      ${appraisalMode === val
                        ? "border-accent bg-accent-bg text-accent"
                        : "border-card-border bg-background text-sub-text hover:border-accent/50"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>

            {appraisalMode === "known" ? (
              <div className="flex flex-col gap-4">
                {/* 감정가 입력 */}
                <div>
                  <FieldLabel htmlFor="appraisalValue">감정가 (원)</FieldLabel>
                  <MoneyInput
                    id="appraisalValue"
                    value={appraisalValue}
                    onChange={setAppraisalValue}
                    placeholder="500,000,000"
                  />
                </div>

                {/* 낙찰 여부 */}
                {appraisalValue > 0 && (
                  <>
                    <fieldset>
                      <legend className="text-sm font-medium text-foreground mb-3">건물이 낙찰되었나요?</legend>
                      <div className="flex gap-3">
                        {([
                          [true, "네, 낙찰되었어요"],
                          [false, "아직 낙찰 전이에요"],
                        ] as const).map(([val, label]) => (
                          <button
                            key={String(val)}
                            type="button"
                            onClick={() => { setIsSold(val); setBidRateOption("none"); }}
                            className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors duration-150 cursor-pointer
                              ${isSold === val
                                ? "border-accent bg-accent-bg text-accent"
                                : "border-card-border bg-background text-sub-text hover:border-accent/50"}`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </fieldset>

                    {isSold ? (
                      /* 낙찰가 직접 입력 */
                      <div>
                        <FieldLabel htmlFor="salePrice-sold">낙찰가 (원)</FieldLabel>
                        <MoneyInput
                          id="salePrice-sold"
                          value={input.salePrice}
                          onChange={(v) => setInput({ salePrice: v })}
                          placeholder="400,000,000"
                        />
                        {input.salePrice > 0 && appraisalValue > 0 && (
                          <p className="text-xs text-accent mt-1 font-medium">
                            낙찰가율 {((input.salePrice / appraisalValue) * 100).toFixed(1)}%
                          </p>
                        )}
                      </div>
                    ) : (
                      /* 예상 매각대금 + 낙찰가율 도우미 */
                      <>
                        <div>
                          <FieldLabel htmlFor="salePrice-expected">예상 매각대금 (원)</FieldLabel>
                          <MoneyInput
                            id="salePrice-expected"
                            value={input.salePrice}
                            onChange={(v) => { setInput({ salePrice: v }); setBidRateOption("none"); }}
                            placeholder="400,000,000"
                          />
                        </div>

                        <div>
                          <p className="text-xs font-medium text-sub-text mb-2">
                            낙찰가율로 자동 계산
                          </p>
                          <div className="grid grid-cols-5 gap-2">
                            {([
                              ["100", "100%"],
                              ["90", "90%"],
                              ["86", "86%"],
                              ["80", "80%"],
                              ["custom", "직접"],
                            ] as const).map(([val, label]) => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => handleBidRateSelect(val, appraisalValue)}
                                className={`py-2 rounded-lg border text-xs font-medium transition-colors duration-150 cursor-pointer
                                  ${bidRateOption === val
                                    ? "border-accent bg-accent-bg text-accent"
                                    : "border-card-border bg-background text-sub-text hover:border-accent/50"}`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                          {bidRateOption === "custom" && (
                            <div className="mt-2 flex items-center gap-2">
                              <InputField
                                id="customBidRate"
                                type="number"
                                min={1}
                                max={150}
                                step={1}
                                value={customBidRate}
                                onChange={(e) => handleCustomRateInput(Number(e.target.value), appraisalValue)}
                                className="max-w-[100px]"
                              />
                              <span className="text-sm text-sub-text">%</span>
                            </div>
                          )}
                          <FieldTip label="낙찰가율 안내">
                            <p>
                              <span className="font-medium text-foreground">낙찰가율</span>은
                              감정가 대비 실제 낙찰되는 비율입니다. 유찰될수록 낮아집니다.
                            </p>
                            <div className="mt-1 space-y-0.5">
                              <p><span className="font-medium text-foreground">1회 유찰:</span> 감정가의 80%</p>
                              <p><span className="font-medium text-foreground">2회 유찰:</span> 감정가의 64% (80% x 80%)</p>
                              <p><span className="font-medium text-foreground">3회 유찰:</span> 감정가의 51% (80% x 80% x 80%)</p>
                            </div>
                            <p className="mt-1">
                              서울 다가구 기준 평균 낙찰가율은 약 75~90% 수준입니다.
                            </p>
                          </FieldTip>
                        </div>

                        {bidRateOption !== "none" && input.salePrice > 0 && (
                          <InfoChip>
                            감정가 {formatKRW(appraisalValue)}의{" "}
                            {bidRateOption === "custom" ? customBidRate : bidRateOption}%
                            = <strong>{formatKRW(input.salePrice)}</strong>
                          </InfoChip>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            ) : (
              /* ── 감정가 모름 모드 ── */
              <div className="flex flex-col gap-4">
                <div>
                  <FieldLabel htmlFor="appraisalGuess">예상 감정가 (원)</FieldLabel>
                  <MoneyInput
                    id="appraisalGuess"
                    value={appraisalValue}
                    onChange={setAppraisalValue}
                    placeholder="500,000,000"
                  />
                  <FieldTip label="감정가 추정하는 법">
                    <p>
                      부동산 실거래가 사이트(국토교통부, 네이버 부동산 등)에서
                      같은 동네의 비슷한 다가구주택이 <strong>얼마에 거래되었는지</strong> 확인해 보세요.
                    </p>
                    <p>
                      경매 물건은 보통 주변 시세보다 <strong>더 저렴하게</strong> 낙찰되는 경향이 있어,
                      인근 거래가를 감정가의 참고 기준으로 삼을 수 있습니다.
                    </p>
                    <p>
                      비교적 최근 지어진 건물이라면 등기부등본이나 건축물대장에서
                      <strong> 최초 매입가</strong>를 확인할 수도 있습니다.
                    </p>
                  </FieldTip>
                </div>

                <div>
                  <FieldLabel htmlFor="salePrice-unknown">예상 매각대금 (원)</FieldLabel>
                  <MoneyInput
                    id="salePrice-unknown"
                    value={input.salePrice}
                    onChange={(v) => { setInput({ salePrice: v }); setBidRateOption("none"); }}
                    placeholder="400,000,000"
                  />
                  {errors.salePrice && (
                    <p className="text-xs text-error mt-1" role="alert">{errors.salePrice}</p>
                  )}
                </div>

                {/* 낙찰가율 도우미 (감정가 입력 시에만) */}
                {appraisalValue > 0 && (
                  <div>
                    <p className="text-xs font-medium text-sub-text mb-2">
                      낙찰가율로 자동 계산
                    </p>
                    <div className="grid grid-cols-5 gap-2">
                      {([
                        ["100", "100%"],
                        ["90", "90%"],
                        ["86", "86%"],
                        ["80", "80%"],
                        ["custom", "직접"],
                      ] as const).map(([val, label]) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleBidRateSelect(val, appraisalValue)}
                          className={`py-2 rounded-lg border text-xs font-medium transition-colors duration-150 cursor-pointer
                            ${bidRateOption === val
                              ? "border-accent bg-accent-bg text-accent"
                              : "border-card-border bg-background text-sub-text hover:border-accent/50"}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    {bidRateOption === "custom" && (
                      <div className="mt-2 flex items-center gap-2">
                        <InputField
                          id="customBidRateUnknown"
                          type="number"
                          min={1}
                          max={150}
                          step={1}
                          value={customBidRate}
                          onChange={(e) => handleCustomRateInput(Number(e.target.value), appraisalValue)}
                          className="max-w-[100px]"
                        />
                        <span className="text-sm text-sub-text">%</span>
                      </div>
                    )}
                    {bidRateOption !== "none" && input.salePrice > 0 && (
                      <InfoChip>
                        예상 감정가 {formatKRW(appraisalValue)}의{" "}
                        {bidRateOption === "custom" ? customBidRate : bidRateOption}%
                        = <strong>{formatKRW(input.salePrice)}</strong>
                      </InfoChip>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="mt-4">
              <AccordionSection title="집행비용 설정 (기본값: 1,000만원)">
                <div className="mt-3">
                  <FieldLabel htmlFor="executionCost">집행비용 (원)</FieldLabel>
                  <MoneyInput
                    id="executionCost"
                    value={input.executionCost}
                    onChange={(v) => setInput({ executionCost: v })}
                    placeholder="10,000,000"
                  />
                  <p className="text-xs text-sub-text mt-1.5">
                    실제 집행비용을 모를 경우 기본값(1,000만원)을 사용하세요.
                  </p>
                </div>
              </AccordionSection>
            </div>
          </Card>

          {/* ── SECTION 2: 나의 임차 정보 ── */}
          <Card>
            <SectionTitle step="Section 2" title="나의 임차 정보"
              sub="등기부등본 전입세대 열람과 임대차계약서를 기준으로 입력하세요." />

            <div className="flex flex-col gap-4">
              <div>
                <FieldLabel htmlFor="myDeposit">보증금 (원)</FieldLabel>
                <MoneyInput
                  id="myDeposit"
                  value={input.myDeposit}
                  onChange={(v) => setInput({ myDeposit: v })}
                  placeholder="50,000,000"
                />
                {errors.myDeposit && <p className="text-xs text-error mt-1" role="alert">{errors.myDeposit}</p>}
                <WarningChip>
                  계약 갱신으로 보증금이 증액된 경우, <strong>현재 보증금</strong>을 입력하세요.
                  증액 전 보증금과의 차이에 따른 소액임차인 판정 변동은 반영되지 않습니다.
                </WarningChip>
              </div>

              <div>
                <FieldLabel
                  htmlFor="myOpposabilityDate"
                  info="전입신고일의 다음날이 대항력 발생일입니다. 확정일자가 더 늦으면 확정일자가 기준일이 됩니다."
                >
                  대항력 발생일
                </FieldLabel>
                <DateInput
                  id="myOpposabilityDate"
                  value={input.myOpposabilityDate}
                  onChange={(e) => setInput({ myOpposabilityDate: e.target.value })}
                />
                {errors.myOpposabilityDate && <p className="text-xs text-error mt-1" role="alert">{errors.myOpposabilityDate}</p>}
                <FieldTip label="대항력 발생일 계산법">
                  <p>
                    <span className="font-medium text-foreground">대항력 발생일</span>{" "}
                    = 전입신고일 다음날과 확정일자 중 <strong>더 늦은 날</strong>입니다.
                  </p>
                  <div className="mt-1 space-y-1">
                    <p>
                      <span className="font-medium text-foreground">예시 1:</span>{" "}
                      전입신고 3/1, 확정일자 3/1 → 대항력 발생일 <strong>3/2</strong>
                    </p>
                    <p>
                      <span className="font-medium text-foreground">예시 2:</span>{" "}
                      전입신고 3/1, 확정일자 3/5 → 대항력 발생일 <strong>3/5</strong>
                    </p>
                  </div>
                  <p className="mt-1">
                    전입신고일은 주민센터 방문일이며, 확정일자는 임대차계약서에
                    확정일자 도장을 받은 날입니다. 두 날짜 모두 임대차계약서와 전입세대
                    열람으로 확인할 수 있어요.
                  </p>
                </FieldTip>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" id="myHasOccupancy"
                  checked={input.myHasOccupancy}
                  onChange={(e) => setInput({ myHasOccupancy: e.target.checked })}
                  className="w-4 h-4 accent-accent" />
                <span className="text-sm text-foreground">
                  현재 해당 주소에 실거주 중 (점유 유지)
                </span>
              </label>
            </div>
          </Card>

          {/* ── SECTION 3: 건물 정보 + 선순위 근저당 ── */}
          <Card>
            <SectionTitle step="Section 3" title="건물 정보 및 선순위 근저당"
              sub="등기부등본 을구(乙區)에서 가장 오래된 근저당권을 확인하세요." />

            <div className="flex flex-col gap-4">
              <div>
                <FieldLabel htmlFor="address">건물 주소</FieldLabel>
                <InputField id="address" type="text" value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="예: 서울시 동작구 대방동 393-57" />
                <p className="text-xs text-sub-text mt-1.5">
                  주소를 입력하면 소액임차인 기준표의 지역 구간을 자동으로 판단합니다.
                </p>
                {address && (
                  <InfoChip>
                    자동 판단된 지역: <strong>{REGION_LABELS[input.region]}</strong>
                    {" "}— 다르다면 아래에서 직접 수정하세요.
                  </InfoChip>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel htmlFor="region">지역 (직접 선택)</FieldLabel>
                  <select id="region" value={input.region}
                    onChange={(e) => setInput({ region: e.target.value as Region })}
                    className="w-full px-3 py-2.5 rounded-xl border border-card-border bg-background text-foreground text-sm
                      focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors duration-150">
                    <option value="seoul">서울특별시</option>
                    <option value="metropolitan_overcrowded">수도권 과밀억제권역</option>
                    <option value="metropolitan">광역시 등</option>
                    <option value="others">그 밖의 지역</option>
                  </select>
                </div>
                <div>
                  <FieldLabel htmlFor="propertyType">주택 유형</FieldLabel>
                  <select id="propertyType" value={input.propertyType}
                    onChange={(e) => setInput({ propertyType: e.target.value as PropertyType })}
                    className="w-full px-3 py-2.5 rounded-xl border border-card-border bg-background text-foreground text-sm
                      focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors duration-150">
                    <option value="multi_family">다가구</option>
                    <option value="multi_unit">다세대</option>
                  </select>
                </div>
              </div>

              <div>
                <FieldLabel htmlFor="mortgageRegDate">근저당 설정일 (등기부등본 기준)</FieldLabel>
                <DateInput id="mortgageRegDate" value={input.mortgageRegDate}
                  onChange={(e) => setInput({ mortgageRegDate: e.target.value })} />
                {errors.mortgageRegDate && <p className="text-xs text-error mt-1" role="alert">{errors.mortgageRegDate}</p>}
                <FieldTip label="근저당 찾는 법">
                  <p>
                    등기부등본 <span className="font-medium text-foreground">을구(乙區)</span>에서
                    &quot;근저당권설정&quot;이라고 적힌 항목 중{" "}
                    <strong>가장 오래된(먼저 설정된) 근저당</strong>의 접수일을 입력하세요.
                  </p>
                  <p>
                    말소된 근저당(밑줄 처리)은 제외하고, 현재 살아 있는
                    근저당만 확인하면 됩니다.
                  </p>
                </FieldTip>
              </div>

              <div>
                <FieldLabel htmlFor="mortgageMaxClaim">채권최고액 (원)</FieldLabel>
                <MoneyInput
                  id="mortgageMaxClaim"
                  value={input.mortgageMaxClaim}
                  onChange={(v) => setInput({ mortgageMaxClaim: v })}
                  placeholder="120,000,000"
                />
                {errors.mortgageMaxClaim && <p className="text-xs text-error mt-1" role="alert">{errors.mortgageMaxClaim}</p>}
                <FieldTip label="채권최고액이란?">
                  <p>
                    <span className="font-medium text-foreground">채권최고액</span>은
                    등기부등본 을구에 기재된 금액으로, 실제 대출금(채권원금)이 아니라
                    은행이 우선 변제받을 수 있는 <strong>최대 한도</strong>입니다.
                  </p>
                  <p>
                    보통 대출금의 120~130% 수준으로 설정됩니다.
                    예: 대출 1억 → 채권최고액 1.2~1.3억
                  </p>
                </FieldTip>
              </div>
            </div>
          </Card>

          {/* ── SECTION 4: 선택 사항 ── */}
          <div>
            <p className="text-xs font-medium text-sub-text uppercase tracking-widest mb-3">Section 4</p>
            <div className="flex flex-col gap-3">
              {/* Other Tenants */}
              <AccordionSection title="다른 세입자 정보 (선택)">
                <p className="text-sm text-sub-text mb-3 mt-2 leading-relaxed">
                  같은 건물의 다른 세입자 정보를 추가하면 소액임차인 경합 시 더 정확한 결과를 얻을 수 있어요.
                </p>
                <WarningChip>
                  <strong>배당요구를 한 세입자만</strong> 추가하세요. 배당요구를 하지 않은 세입자는
                  경매 절차에서 배당 대상이 아니므로 여기에 입력하면 결과가 부정확해집니다.
                </WarningChip>
                <div className="mt-4">
                  {input.otherTenants.map((ot, i) => (
                    <OtherTenantRow key={ot.id} tenant={ot} index={i}
                      onChange={(t) => updateOtherTenant(ot.id, t)}
                      onRemove={() => removeOtherTenant(ot.id)} />
                  ))}
                </div>
                <button type="button" onClick={addOtherTenant}
                  className="w-full py-2.5 rounded-xl border border-dashed border-card-border text-sm text-sub-text
                    hover:border-accent hover:text-accent transition-colors duration-150 cursor-pointer">
                  + 세입자 추가
                </button>
              </AccordionSection>

              {/* Property Tax */}
              <AccordionSection title="재산세 / 당해세 (선택)">
                <p className="text-sm text-sub-text mb-4 mt-2 leading-relaxed">
                  재산세(당해세)가 있을 경우 배당 순위에 영향을 줄 수 있어요.
                </p>
                <fieldset>
                  <legend className="text-sm font-medium text-foreground mb-3">재산세 존재 여부</legend>
                  <div className="flex flex-col gap-2">
                    {([["yes","있음"],["no","없음"],["unknown","모름"]] as [PropertyTaxOption,string][]).map(([val,label]) => (
                      <label key={val} className="flex items-center gap-3 cursor-pointer">
                        <input type="radio" name="propertyTaxOption" value={val}
                          checked={input.propertyTaxOption === val}
                          onChange={() => setInput({ propertyTaxOption: val })}
                          className="w-4 h-4 accent-accent" />
                        <span className="text-sm text-foreground">{label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                {input.propertyTaxOption === "yes" && (
                  <div className="mt-4 flex flex-col gap-3">
                    <div>
                      <FieldLabel htmlFor="propertyTaxAmount">재산세 금액 (원)</FieldLabel>
                      <MoneyInput
                        id="propertyTaxAmount"
                        value={input.propertyTaxAmount}
                        onChange={(v) => setInput({ propertyTaxAmount: v })}
                        placeholder="5,000,000"
                      />
                    </div>
                    <div>
                      <FieldLabel htmlFor="propertyTaxLegalDate">법정기일</FieldLabel>
                      <DateInput id="propertyTaxLegalDate" value={input.propertyTaxLegalDate}
                        onChange={(e) => setInput({ propertyTaxLegalDate: e.target.value })} />
                    </div>
                  </div>
                )}
              </AccordionSection>
            </div>
          </div>

          {/* Submit */}
          <button type="submit"
            className="w-full py-4 rounded-2xl bg-accent text-white font-semibold text-base
              hover:opacity-90 active:scale-[0.98] transition-all duration-150
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40
              cursor-pointer shadow-sm">
            배당액 계산하기
          </button>
        </div>
      </form>
    </div>
  );
}
