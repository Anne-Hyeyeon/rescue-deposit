"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { addDays, format, parseISO } from "date-fns";
import {
  useSimulationStore,
  type IOtherTenant,
  type PropertyTaxOption,
  type PropertyType,
  type Region,
  type ISimulationInput,
} from "@/store/simulationStore";

// ── 데모 데이터: 서울중앙지방법원 2023타경5053 ─────────────────────────────────
// 실제 배당표 기준 입력값. 최선순위 근저당 2017.12.04 기준 서울 소액임차인 한도: 1억/3,400만
// "나의 임차권" = 야경석 (후순위 균분 임차인, 실제 배당률 14.69%)

const DEMO_2023TA5053 = {
  salePrice:     1_784_756_000,
  executionCost:     9_811_568,

  // 나의 임차권 (야경석)
  myDeposit:        50_000_000,
  myMoveInDate:     "2021-06-04",
  myConfirmedDate:  "2021-06-05",
  myHasOccupancy:   true,

  // 선순위 근저당 — 웰컴저축은행 근저당권부질권 (2017.12.04)
  mortgagePrincipal: 784_560_000,
  mortgageMaxClaim:  784_560_000,
  mortgageRegDate:   "2017-12-04",

  propertyType: "multi_family" as const,
  region: "seoul" as const,

  propertyTaxOption: "no" as const,
  propertyTaxAmount: 0,
  propertyTaxLegalDate: "",

  otherTenants: [
    // ── 최선순위 소액임차인 (deposit ≤ 1억, 3,400만 최우선변제) ──────────────
    { id: "d-01", deposit: 34_000_000,  moveInDate: "2018-01-15", confirmedDate: "2018-02-01",  hasOccupancy: true  }, // 한국토지주택공사(임성준)
    { id: "d-02", deposit: 34_000_000,  moveInDate: "2018-03-01", confirmedDate: "2018-03-15",  hasOccupancy: true  }, // 이혜인

    // ── STEP3 날짜경합 채권자들 ─────────────────────────────────────────────
    { id: "d-03", deposit:  50_000_000, moveInDate: "2019-11-01", confirmedDate: "2019-11-15",  hasOccupancy: true  }, // 한국토지주택공사(양현진) — 상대적 소액임차인 3,700만
    { id: "d-04", deposit: 300_000_000, moveInDate: "2019-12-27", confirmedDate: "2019-12-28",  hasOccupancy: true  }, // 노태우 — 확정일자 2019.12.28
    { id: "d-05", deposit: 110_000_000, moveInDate: "2019-12-10", confirmedDate: "2019-12-28",  hasOccupancy: false }, // 서울보증보험(서진아 대위) — 상대적 소액임차인 3,700만
    { id: "d-06", deposit:  73_000_000, moveInDate: "2020-01-12", confirmedDate: "2020-01-13",  hasOccupancy: false }, // 서울보증보험(서진아 대위) — 확정일자 2020.01.13
    { id: "d-07", deposit: 150_000_000, moveInDate: "2020-01-19", confirmedDate: "2020-01-20",  hasOccupancy: true  }, // 서정국 — 확정일자 2020.01.20
    { id: "d-08", deposit: 160_000_000, moveInDate: "2020-08-24", confirmedDate: "2020-08-25",  hasOccupancy: true  }, // 김혜연 — 확정일자 2020.08.25
    { id: "d-09", deposit: 100_000_000, moveInDate: "2021-01-13", confirmedDate: "2021-01-14",  hasOccupancy: true  }, // 나혜민 — 소액임차인 3,400만 + 확정일자 6,600만

    // ── 후순위 균분 임차인 8명 (야경석 제외, 나머지 8명) ────────────────────
    { id: "d-10", deposit:  50_000_000, moveInDate: "2021-06-04", confirmedDate: "2021-06-05",  hasOccupancy: true  }, // 김다운
    { id: "d-11", deposit:  50_000_000, moveInDate: "2021-06-04", confirmedDate: "2021-06-05",  hasOccupancy: true  }, // 양성경
    { id: "d-12", deposit:  50_000_000, moveInDate: "2021-06-04", confirmedDate: "2021-06-05",  hasOccupancy: true  }, // 이예원
    { id: "d-13", deposit:  50_000_000, moveInDate: "2021-06-04", confirmedDate: "2021-06-05",  hasOccupancy: true  }, // 박선진
    { id: "d-14", deposit:  50_000_000, moveInDate: "2021-06-04", confirmedDate: "2021-06-05",  hasOccupancy: true  }, // 박효미
    { id: "d-15", deposit:  50_000_000, moveInDate: "2021-06-04", confirmedDate: "2021-06-05",  hasOccupancy: true  }, // 우대영
    { id: "d-16", deposit:  50_000_000, moveInDate: "2021-06-04", confirmedDate: "2021-06-05",  hasOccupancy: true  }, // 유기학
    { id: "d-17", deposit:  50_000_000, moveInDate: "2021-06-04", confirmedDate: "2021-06-05",  hasOccupancy: true  }, // 조희수
  ],
} satisfies ISimulationInput;

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatKRW = (n: number) =>
  n >= 100_000_000
    ? `${(n / 100_000_000).toFixed(1)}억`
    : n >= 10_000
    ? `${Math.round(n / 10_000).toLocaleString("ko-KR")}만원`
    : `${n.toLocaleString("ko-KR")}원`;

const parseDateSafe = (s: string) => {
  try {
    return s ? parseISO(s) : null;
  } catch {
    return null;
  }
};

const computeDateLabels = (moveIn: string, confirmed: string) => {
  const moveInDate = parseDateSafe(moveIn);
  if (!moveInDate) return null;

  const opposabilityDate = addDays(moveInDate, 1);
  const opposabilityLabel = format(opposabilityDate, "yyyy년 M월 d일 00:00");

  const confirmedDate = parseDateSafe(confirmed);
  let priorityLabel = "";
  if (confirmedDate) {
    const oTs = opposabilityDate.getTime();
    const cTs = new Date(
      confirmedDate.getFullYear(),
      confirmedDate.getMonth(),
      confirmedDate.getDate(),
      9
    ).getTime();
    const priorityDate = new Date(Math.max(oTs, cTs));
    priorityLabel = format(priorityDate, "yyyy년 M월 d일 09:00");
  }

  return { opposabilityLabel, priorityLabel };
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
}: {
  htmlFor: string;
  children: React.ReactNode;
}) => (
  <label
    htmlFor={htmlFor}
    className="block text-sm font-medium text-foreground mb-1.5"
  >
    {children}
  </label>
);

const InputField = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={`w-full px-3 py-2.5 rounded-xl border border-card-border bg-background text-foreground text-sm
      placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent
      transition-colors duration-150 ${props.className ?? ""}`}
  />
);

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

const Card = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`bg-card-bg border border-card-border rounded-2xl p-5 ${className}`}
  >
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
          width="16"
          height="16"
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
        <InputField
          id={`ot-deposit-${tenant.id}`}
          type="number"
          min={0}
          step={1_000_000}
          value={tenant.deposit || ""}
          onChange={(e) =>
            onChange({ ...tenant, deposit: Number(e.target.value) })
          }
          placeholder="0"
        />
      </div>
      <div>
        <FieldLabel htmlFor={`ot-movein-${tenant.id}`}>전입일</FieldLabel>
        <DateInput
          id={`ot-movein-${tenant.id}`}
          value={tenant.moveInDate}
          onChange={(e) => onChange({ ...tenant, moveInDate: e.target.value })}
        />
      </div>
      <div>
        <FieldLabel htmlFor={`ot-confirmed-${tenant.id}`}>확정일자</FieldLabel>
        <DateInput
          id={`ot-confirmed-${tenant.id}`}
          value={tenant.confirmedDate}
          onChange={(e) =>
            onChange({ ...tenant, confirmedDate: e.target.value })
          }
        />
      </div>
      <div className="flex items-end pb-1">
        <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={tenant.hasOccupancy}
            onChange={(e) =>
              onChange({ ...tenant, hasOccupancy: e.target.checked })
            }
            className="w-4 h-4 accent-accent"
          />
          점유 중
        </label>
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

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SimulatePage() {
  const router = useRouter();
  const { input, setInput, setResult } = useSimulationStore();

  const [salePriceInput, setSalePriceInput] = useState(
    String(input.salePrice)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadDemo = () => {
    setInput(DEMO_2023TA5053);
    setSalePriceInput(String(DEMO_2023TA5053.salePrice));
    setErrors({});
  };

  // Sync salePriceInput → store
  useEffect(() => {
    const n = Number(salePriceInput.replace(/,/g, ""));
    if (!isNaN(n) && n > 0) setInput({ salePrice: n });
  }, [salePriceInput, setInput]);

  const dateLabels = computeDateLabels(
    input.myMoveInDate,
    input.myConfirmedDate
  );

  const addOtherTenant = () => {
    setInput({
      otherTenants: [
        ...input.otherTenants,
        {
          id: crypto.randomUUID(),
          deposit: 0,
          moveInDate: "",
          confirmedDate: "",
          hasOccupancy: true,
        },
      ],
    });
  };

  const updateOtherTenant = (id: string, t: IOtherTenant) => {
    setInput({
      otherTenants: input.otherTenants.map((ot) => (ot.id === id ? t : ot)),
    });
  };

  const removeOtherTenant = (id: string) => {
    setInput({ otherTenants: input.otherTenants.filter((ot) => ot.id !== id) });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!input.salePrice || input.salePrice <= 0)
      errs.salePrice = "매각대금을 입력해주세요";
    if (!input.myDeposit || input.myDeposit <= 0)
      errs.myDeposit = "보증금을 입력해주세요";
    if (!input.myMoveInDate) errs.myMoveInDate = "전입일을 입력해주세요";
    if (!input.myConfirmedDate) errs.myConfirmedDate = "확정일자를 입력해주세요";
    if (!input.mortgageRegDate) errs.mortgageRegDate = "근저당 설정일을 입력해주세요";
    if (!input.mortgageMaxClaim || input.mortgageMaxClaim <= 0)
      errs.mortgageMaxClaim = "채권최고액을 입력해주세요";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    // Engine call removed — logic will be rebuilt separately.
    // Store null result and navigate; result page reads input directly.
    setResult(null);
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
              서울중앙지방법원 2023타경5053 · 다가구 · 17억 · 임차인 19명
            </p>
          </div>
          <svg
            width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2"
            className="text-accent flex-shrink-0 group-hover:translate-x-0.5 transition-transform"
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-5">
          {/* ── SECTION 1: 매각대금 ── */}
          <Card>
            <SectionTitle
              step="Section 1"
              title="예상 매각대금"
              sub="등기부등본의 감정평가액 또는 경매 최저가를 참고하세요."
            />

            {/* Slider */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-sub-text">매각대금</span>
                <span className="text-base font-semibold text-accent">
                  {formatKRW(input.salePrice)}
                </span>
              </div>
              <input
                id="salePrice-slider"
                type="range"
                min={10_000_000}
                max={2_000_000_000}
                step={10_000_000}
                value={input.salePrice}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setInput({ salePrice: v });
                  setSalePriceInput(String(v));
                }}
                className="w-full h-2 rounded-full appearance-none bg-card-border cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5
                  [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:shadow-md"
                aria-label="매각대금 슬라이더"
              />
              <div className="flex justify-between text-xs text-muted mt-1">
                <span>1천만원</span>
                <span>20억원</span>
              </div>
            </div>

            {/* Direct Input */}
            <div>
              <FieldLabel htmlFor="salePrice-input">직접 입력 (원)</FieldLabel>
              <InputField
                id="salePrice-input"
                type="number"
                min={0}
                step={1_000_000}
                value={input.salePrice}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setInput({ salePrice: v });
                  setSalePriceInput(e.target.value);
                }}
                placeholder="200000000"
              />
              {errors.salePrice && (
                <p className="text-xs text-error mt-1" role="alert">
                  {errors.salePrice}
                </p>
              )}
            </div>

            {/* Execution Cost Accordion */}
            <div className="mt-4">
              <AccordionSection title="집행비용 설정 (기본값: 1,000만원)">
                <div className="mt-3">
                  <FieldLabel htmlFor="executionCost">집행비용 (원)</FieldLabel>
                  <InputField
                    id="executionCost"
                    type="number"
                    min={0}
                    step={100_000}
                    value={input.executionCost}
                    onChange={(e) =>
                      setInput({ executionCost: Number(e.target.value) })
                    }
                    placeholder="10000000"
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
            <SectionTitle
              step="Section 2"
              title="나의 임차 정보"
              sub="등기부등본 전입세대 열람과 임대차계약서를 기준으로 입력하세요."
            />

            <div className="flex flex-col gap-4">
              {/* Deposit */}
              <div>
                <FieldLabel htmlFor="myDeposit">보증금 (원)</FieldLabel>
                <InputField
                  id="myDeposit"
                  type="number"
                  min={0}
                  step={1_000_000}
                  value={input.myDeposit || ""}
                  onChange={(e) =>
                    setInput({ myDeposit: Number(e.target.value) })
                  }
                  placeholder="50000000"
                />
                {input.myDeposit > 0 && (
                  <p className="text-xs text-sub-text mt-1">
                    {formatKRW(input.myDeposit)}
                  </p>
                )}
                {errors.myDeposit && (
                  <p className="text-xs text-error mt-1" role="alert">
                    {errors.myDeposit}
                  </p>
                )}
              </div>

              {/* Move-in Date */}
              <div>
                <FieldLabel htmlFor="myMoveInDate">
                  전입일 (주민등록 전입신고일)
                </FieldLabel>
                <DateInput
                  id="myMoveInDate"
                  value={input.myMoveInDate}
                  onChange={(e) => setInput({ myMoveInDate: e.target.value })}
                />
                {errors.myMoveInDate && (
                  <p className="text-xs text-error mt-1" role="alert">
                    {errors.myMoveInDate}
                  </p>
                )}
              </div>

              {/* Confirmed Date */}
              <div>
                <FieldLabel htmlFor="myConfirmedDate">
                  확정일자 (임대차계약서 도장 날짜)
                </FieldLabel>
                <DateInput
                  id="myConfirmedDate"
                  value={input.myConfirmedDate}
                  onChange={(e) =>
                    setInput({ myConfirmedDate: e.target.value })
                  }
                />
                {errors.myConfirmedDate && (
                  <p className="text-xs text-error mt-1" role="alert">
                    {errors.myConfirmedDate}
                  </p>
                )}
              </div>

              {/* Real-time date labels */}
              {dateLabels && (
                <InfoChip>
                  <div className="flex flex-col gap-0.5">
                    <span>
                      <strong>대항력 발생일:</strong>{" "}
                      {dateLabels.opposabilityLabel}
                    </span>
                    {dateLabels.priorityLabel && (
                      <span>
                        <strong>우선변제권 기준일:</strong>{" "}
                        {dateLabels.priorityLabel}
                      </span>
                    )}
                  </div>
                </InfoChip>
              )}

              {/* Occupancy checkbox */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  id="myHasOccupancy"
                  checked={input.myHasOccupancy}
                  onChange={(e) =>
                    setInput({ myHasOccupancy: e.target.checked })
                  }
                  className="w-4 h-4 accent-accent"
                />
                <span className="text-sm text-foreground">
                  현재 해당 주소에 실거주 중 (점유 유지)
                </span>
              </label>
            </div>
          </Card>

          {/* ── SECTION 3: 선순위 근저당 ── */}
          <Card>
            <SectionTitle
              step="Section 3"
              title="선순위 근저당"
              sub="등기부등본 을구(乙區)에서 가장 오래된 근저당권을 확인하세요."
            />

            <div className="flex flex-col gap-4">
              <div>
                <FieldLabel htmlFor="mortgageRegDate">
                  근저당 설정일 (등기부등본 기준)
                </FieldLabel>
                <DateInput
                  id="mortgageRegDate"
                  value={input.mortgageRegDate}
                  onChange={(e) =>
                    setInput({ mortgageRegDate: e.target.value })
                  }
                />
                {errors.mortgageRegDate && (
                  <p className="text-xs text-error mt-1" role="alert">
                    {errors.mortgageRegDate}
                  </p>
                )}
              </div>

              <div>
                <FieldLabel htmlFor="mortgageMaxClaim">
                  채권최고액 (원)
                </FieldLabel>
                <InputField
                  id="mortgageMaxClaim"
                  type="number"
                  min={0}
                  step={1_000_000}
                  value={input.mortgageMaxClaim || ""}
                  onChange={(e) =>
                    setInput({ mortgageMaxClaim: Number(e.target.value) })
                  }
                  placeholder="120000000"
                />
                {input.mortgageMaxClaim > 0 && (
                  <p className="text-xs text-sub-text mt-1">
                    {formatKRW(input.mortgageMaxClaim)}
                  </p>
                )}
                {errors.mortgageMaxClaim && (
                  <p className="text-xs text-error mt-1" role="alert">
                    {errors.mortgageMaxClaim}
                  </p>
                )}
              </div>

              {/* Region + PropertyType */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel htmlFor="region">지역</FieldLabel>
                  <select
                    id="region"
                    value={input.region}
                    onChange={(e) =>
                      setInput({
                        region: e.target.value as Region,
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-card-border bg-background text-foreground text-sm
                      focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent
                      transition-colors duration-150"
                  >
                    <option value="seoul">서울</option>
                    <option value="metropolitan_overcrowded">
                      과밀억제권역
                    </option>
                    <option value="metropolitan">수도권</option>
                    <option value="others">그 외 지역</option>
                  </select>
                </div>
                <div>
                  <FieldLabel htmlFor="propertyType">주택 유형</FieldLabel>
                  <select
                    id="propertyType"
                    value={input.propertyType}
                    onChange={(e) =>
                      setInput({
                        propertyType: e.target
                          .value as PropertyType,
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-card-border bg-background text-foreground text-sm
                      focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent
                      transition-colors duration-150"
                  >
                    <option value="multi_family">다가구</option>
                    <option value="multi_unit">다세대</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* ── SECTION 4: 선택 사항 (Accordion) ── */}
          <div>
            <p className="text-xs font-medium text-sub-text uppercase tracking-widest mb-3">
              Section 4
            </p>
            <div className="flex flex-col gap-3">
              {/* Other Tenants */}
              <AccordionSection title="다른 세입자 정보 (선택)">
                <p className="text-sm text-sub-text mb-4 mt-2 leading-relaxed">
                  같은 건물의 다른 세입자 정보를 추가하면 소액임차인 경합 시
                  더 정확한 결과를 얻을 수 있어요.
                </p>
                {input.otherTenants.map((ot, i) => (
                  <OtherTenantRow
                    key={ot.id}
                    tenant={ot}
                    index={i}
                    onChange={(t) => updateOtherTenant(ot.id, t)}
                    onRemove={() => removeOtherTenant(ot.id)}
                  />
                ))}
                <button
                  type="button"
                  onClick={addOtherTenant}
                  className="w-full py-2.5 rounded-xl border border-dashed border-card-border text-sm text-sub-text
                    hover:border-accent hover:text-accent transition-colors duration-150 cursor-pointer"
                >
                  + 세입자 추가
                </button>
              </AccordionSection>

              {/* Property Tax */}
              <AccordionSection title="재산세 / 당해세 (선택)">
                <p className="text-sm text-sub-text mb-4 mt-2 leading-relaxed">
                  재산세(당해세)가 있을 경우 배당 순위에 영향을 줄 수 있어요.
                </p>

                <fieldset>
                  <legend className="text-sm font-medium text-foreground mb-3">
                    재산세 존재 여부
                  </legend>
                  <div className="flex flex-col gap-2">
                    {(
                      [
                        ["yes", "있음"],
                        ["no", "없음"],
                        ["unknown", "모름"],
                      ] as [PropertyTaxOption, string][]
                    ).map(([val, label]) => (
                      <label
                        key={val}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="propertyTaxOption"
                          value={val}
                          checked={input.propertyTaxOption === val}
                          onChange={() =>
                            setInput({ propertyTaxOption: val })
                          }
                          className="w-4 h-4 accent-accent"
                        />
                        <span className="text-sm text-foreground">{label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                {input.propertyTaxOption === "yes" && (
                  <div className="mt-4 flex flex-col gap-3">
                    <div>
                      <FieldLabel htmlFor="propertyTaxAmount">
                        재산세 금액 (원)
                      </FieldLabel>
                      <InputField
                        id="propertyTaxAmount"
                        type="number"
                        min={0}
                        step={100_000}
                        value={input.propertyTaxAmount || ""}
                        onChange={(e) =>
                          setInput({
                            propertyTaxAmount: Number(e.target.value),
                          })
                        }
                        placeholder="5000000"
                      />
                    </div>
                    <div>
                      <FieldLabel htmlFor="propertyTaxLegalDate">
                        법정기일
                      </FieldLabel>
                      <DateInput
                        id="propertyTaxLegalDate"
                        value={input.propertyTaxLegalDate}
                        onChange={(e) =>
                          setInput({ propertyTaxLegalDate: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}
              </AccordionSection>
            </div>
          </div>

          {/* ── Submit ── */}
          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-accent text-white font-semibold text-base
              hover:opacity-90 active:scale-[0.98] transition-all duration-150
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40
              cursor-pointer shadow-sm"
          >
            배당액 계산하기
          </button>
        </div>
      </form>
    </div>
  );
}

