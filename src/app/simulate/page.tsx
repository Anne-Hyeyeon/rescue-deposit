"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback, useEffect, useMemo, type FormEvent } from "react";

import {
  useSimulationStore,
} from "@/store/simulationStore";
import { useAuthStore } from "@/store/useAuthStore";
import { getSimulationDataList } from "@/lib/supabase/simulation-data";
import { downloadSimulationExcel } from "@/lib/excel/generator";
import { AssumptionsBanner } from "@/app/simulate/components/form-primitives";
import {
  MyTenantSection,
  OptionalSection,
  PropertySection,
  SalePriceSection,
} from "@/app/simulate/components/sections";
import {
  calcSalePriceFromRate,
  defaultVisibleOtherTenants,
  DEMO_SIMULATION_ADDRESS,
  DEMO_SIMULATION_ADDRESS_2,
  DEMO_SIMULATION_ADDRESS_3,
  DEMO_SIMULATION_ADDRESS_4,
  DEMO_SIMULATION_INPUT,
  DEMO_SIMULATION_INPUT_2,
  DEMO_SIMULATION_INPUT_3,
  DEMO_SIMULATION_INPUT_4,
  hasMyTenantInput,
  parsePropertyType,
  parseRegion,
  REGION_LABELS,
  removeOtherTenantById,
  type BidRateOption,
  type SimulationFormErrors,
  upsertOtherTenant,
  validateSimulationInput,
} from "@/app/simulate/helpers";
import { runSimulation } from "@/lib/engine/bridge";
import { resolveRegion } from "@/lib/engine/region";
import { getSmallTenantThreshold } from "@/lib/engine/constants";
import { mapEngineToStoreRegion, mapRegion } from "@/lib/engine/bridge-helpers";
import type {
  IOtherTenant,
} from "@/types/simulation";
import { defaultSimulationInput } from "@/types/simulation";

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SimulatePage() {
  const router = useRouter();
  const { input, setInput, setResult } = useSimulationStore();
  const user = useAuthStore((s) => s.user);
  const isAuthLoading = useAuthStore((s) => s.isLoading);
  const [loadingMyData, setLoadingMyData] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [activeSource, setActiveSource] = useState<"my" | 1 | 2 | 3 | 4 | null>(null);

  const [address, setAddress] = useState("");
  const [detectedRegionLabel, setDetectedRegionLabel] = useState<string | null>(null);
  const [errors, setErrors] = useState<SimulationFormErrors>({});

  const handleAddressSearch = useCallback(
    (data: { address: string; sido: string; sigungu: string }) => {
      setAddress(data.address);
      const refDate = input.mortgageRegDate || new Date().toISOString().slice(0, 10);
      const engineRegion = resolveRegion(data.address, refDate);
      const storeRegion = mapEngineToStoreRegion(engineRegion);
      setInput({ region: storeRegion });
      setDetectedRegionLabel(REGION_LABELS[storeRegion]);
    },
    [input.mortgageRegDate, setInput],
  );

  const { thresholdDepositMax, thresholdPriorityMax } = useMemo(() => {
    const refDate = input.mortgageRegDate || null;
    if (!refDate) return { thresholdDepositMax: null, thresholdPriorityMax: null };
    try {
      const engineRegion = mapRegion(input.region);
      const threshold = getSmallTenantThreshold(engineRegion, refDate);
      return {
        thresholdDepositMax: threshold.depositMax,
        thresholdPriorityMax: threshold.priorityMax,
      };
    } catch {
      return { thresholdDepositMax: null, thresholdPriorityMax: null };
    }
  }, [input.region, input.mortgageRegDate]);

  // Section 1 state
  const [appraisalMode, setAppraisalMode] = useState<"known" | "unknown">("known");
  const [appraisalValue, setAppraisalValue] = useState(0);
  const [isSold, setIsSold] = useState(false);
  const [bidRateOption, setBidRateOption] = useState<BidRateOption>("none");
  const [customBidRate, setCustomBidRate] = useState(85);
  const hasMyTenant = hasMyTenantInput(input);

  const loadDemo = (demoCase: 1 | 2 | 3 | 4 = 1) => {
    if (demoCase === 1) {
      setInput({
        ...DEMO_SIMULATION_INPUT,
        otherTenants: defaultVisibleOtherTenants(DEMO_SIMULATION_INPUT.otherTenants),
      });
      setAddress(DEMO_SIMULATION_ADDRESS);
      setAppraisalValue(2_230_942_880);
    } else if (demoCase === 2) {
      setInput({
        ...DEMO_SIMULATION_INPUT_2,
        otherTenants: defaultVisibleOtherTenants(DEMO_SIMULATION_INPUT_2.otherTenants),
      });
      setAddress(DEMO_SIMULATION_ADDRESS_2);
      setAppraisalValue(2_383_575_800);
    } else if (demoCase === 3) {
      setInput({
        ...DEMO_SIMULATION_INPUT_3,
        otherTenants: defaultVisibleOtherTenants(DEMO_SIMULATION_INPUT_3.otherTenants),
      });
      setAddress(DEMO_SIMULATION_ADDRESS_3);
      setAppraisalValue(0);
    } else {
      setInput({
        ...DEMO_SIMULATION_INPUT_4,
        otherTenants: defaultVisibleOtherTenants(DEMO_SIMULATION_INPUT_4.otherTenants),
      });
      setAddress(DEMO_SIMULATION_ADDRESS_4);
      setAppraisalValue(0);
    }
    setAppraisalMode("known");
    setIsSold(true);
    setBidRateOption("none");
    setErrors({});
    setActiveSource(demoCase);
  };

  const loadMyData = useCallback(async () => {
    if (!user) {
      router.push("/login?redirect=/simulate");
      return;
    }
    setLoadingMyData(true);
    try {
      const list = await getSimulationDataList(user.id);
      if (list.length === 0) {
        router.push("/mypage");
        return;
      }
      const latest = list[0];
      setInput({
        ...latest.data,
        otherTenants: defaultVisibleOtherTenants(latest.data.otherTenants),
      });
      setAppraisalMode("known");
      setAppraisalValue(latest.data.appraisalValue);
      setIsSold(true);
      setBidRateOption("none");
      setErrors({});
      setActiveSource("my");
    } finally {
      setLoadingMyData(false);
    }
  }, [user, router, setInput]);

  const handleBidRateSelect = (option: BidRateOption, base: number) => {
    setBidRateOption(option);
    if (option === "none") return;
    const rate = option === "custom" ? customBidRate : Number(option);
    const v = calcSalePriceFromRate(base, rate);
    if (v > 0) setInput({ salePrice: v });
  };

  const handleCustomRateInput = (rate: number, base: number) => {
    setCustomBidRate(rate);
    const v = calcSalePriceFromRate(base, rate);
    if (v > 0) setInput({ salePrice: v });
  };

  const addOtherTenant = () => {
    setInput({
      otherTenants: [
        ...input.otherTenants,
        ...defaultVisibleOtherTenants([]),
      ],
    });
  };

  const updateOtherTenant = (id: string, t: IOtherTenant) => {
    setInput({ otherTenants: upsertOtherTenant(input.otherTenants, id, t) });
  };

  const removeOtherTenant = (id: string) => {
    setInput({
      otherTenants: defaultVisibleOtherTenants(removeOtherTenantById(input.otherTenants, id)),
    });
  };

  const validate = () => {
    const errs = validateSimulationInput(input);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      // 첫 번째 에러 필드로 스크롤
      const firstErrorField = Object.keys(errs)[0];
      const fieldIdMap: Record<string, string> = {
        salePrice: isSold ? "salePrice-sold" : appraisalMode === "known" ? "salePrice-sold" : "salePrice-unknown",
        myDeposit: "myDeposit",
        myOpposabilityDate: "myOpposabilityDate",
        mortgageRegDate: "mortgageRegDate",
        mortgageMaxClaim: "mortgageMaxClaim",
        otherTenants: "other-tenants-section",
      };
      const targetId = fieldIdMap[firstErrorField];
      if (targetId) {
        const el = document.getElementById(targetId);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        el?.focus();
      }
      return false;
    }
    return true;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const updatedInput = {
      ...input,
      appraisalValue,
      otherTenants: defaultVisibleOtherTenants(input.otherTenants),
    };
    setInput(updatedInput);
    const result = runSimulation(updatedInput);
    setResult(result);
    router.push("/simulate/result");
  };

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace("/login?redirect=/simulate");
    }
  }, [isAuthLoading, user, router]);

  useEffect(() => {
    if (input.otherTenants.length === 0) {
      setInput({ otherTenants: defaultVisibleOtherTenants([]) });
    }
  }, [input.otherTenants.length, setInput]);

  if (isAuthLoading || !user) return null;

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

        {/* 내 데이터 + 데모 배너 */}
        <div className="mt-4 space-y-2">
          {/* 내 데이터 입력하기 */}
          <button
            type="button"
            onClick={loadMyData}
            disabled={loadingMyData}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl
              transition-colors duration-150 cursor-pointer text-left group disabled:opacity-50
              ${activeSource === "my"
                ? "bg-card-bg border-2 border-foreground/40"
                : "bg-card-bg border border-card-border hover:border-foreground/30"
              }`}
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-badge-bg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                className="text-foreground" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {loadingMyData ? "불러오는 중..." : "내 데이터 입력하기"}
              </p>
              <p className="text-xs text-sub-text mt-0.5">
                마이페이지에 저장한 배당 데이터를 자동으로 입력합니다
              </p>
            </div>
            {activeSource === "my" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                className="text-accent flex-shrink-0" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className="text-sub-text flex-shrink-0 group-hover:translate-x-0.5 transition-transform" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            )}
          </button>

          <button
            type="button"
            onClick={() => loadDemo(1)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl
              transition-colors duration-150 cursor-pointer text-left group
              ${activeSource === 1
                ? "bg-accent-bg border-2 border-accent"
                : "bg-accent-bg border border-accent/20 hover:border-accent/50"
              }`}
          >
            <span className="text-lg" aria-hidden="true">⚖️</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-accent">
                실제 사례 1: 2017년 근저당
              </p>
              <p className="text-xs text-sub-text mt-0.5">
                다가구 · 낙찰가 17.8억 · 감정가 22.3억 · 임차인 17명
              </p>
            </div>
            {activeSource === 1 ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                className="text-accent flex-shrink-0" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className="text-accent flex-shrink-0 group-hover:translate-x-0.5 transition-transform" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            )}
          </button>

          <button
            type="button"
            onClick={() => loadDemo(2)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl
              transition-colors duration-150 cursor-pointer text-left group
              ${activeSource === 2
                ? "bg-accent-bg border-2 border-accent"
                : "bg-accent-bg border border-accent/20 hover:border-accent/50"
              }`}
          >
            <span className="text-lg" aria-hidden="true">🏢</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-accent">
                실제 사례 2: 2021년 근저당
              </p>
              <p className="text-xs text-sub-text mt-0.5">
                다가구 · 근저당 12.96억 · 낙찰가 16억 · 임차인 26명
              </p>
            </div>
            {activeSource === 2 ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                className="text-accent flex-shrink-0" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className="text-accent flex-shrink-0 group-hover:translate-x-0.5 transition-transform" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            )}
          </button>

          <button
            type="button"
            onClick={() => loadDemo(3)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl
              transition-colors duration-150 cursor-pointer text-left group
              ${activeSource === 3
                ? "bg-accent-bg border-2 border-accent"
                : "bg-accent-bg border border-accent/20 hover:border-accent/50"
              }`}
          >
            <span className="text-lg" aria-hidden="true">🏘️</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-accent">
                실제 사례 3: 2017년 근저당
              </p>
              <p className="text-xs text-sub-text mt-0.5">
                다가구 · 근저당 9억 · 낙찰가 17.3억 · 임차인 20명
              </p>
            </div>
            {activeSource === 3 ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                className="text-accent flex-shrink-0" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className="text-accent flex-shrink-0 group-hover:translate-x-0.5 transition-transform" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            )}
          </button>

          <button
            type="button"
            onClick={() => loadDemo(4)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl
              transition-colors duration-150 cursor-pointer text-left group
              ${activeSource === 4
                ? "bg-accent-bg border-2 border-accent"
                : "bg-accent-bg border border-accent/20 hover:border-accent/50"
              }`}
          >
            <span className="text-lg" aria-hidden="true">🏚️</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-accent">
                실제 사례 4: 2020년 근저당
              </p>
              <p className="text-xs text-sub-text mt-0.5">
                다가구 · 근저당 8.66억 · 낙찰가 20.1억 · 임차인 25명
              </p>
            </div>
            {activeSource === 4 ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                className="text-accent flex-shrink-0" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className="text-accent flex-shrink-0 group-hover:translate-x-0.5 transition-transform" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* 전제 조건 배너 */}
      <div className="mb-6">
        <AssumptionsBanner />
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-5">
          <SalePriceSection
            input={input}
            appraisalMode={appraisalMode}
            appraisalValue={appraisalValue}
            isSold={isSold}
            bidRateOption={bidRateOption}
            customBidRate={customBidRate}
            errors={errors}
            onAppraisalModeChange={(mode) => {
              setAppraisalMode(mode);
              setBidRateOption("none");
            }}
            onAppraisalValueChange={setAppraisalValue}
            onSoldStateChange={(value) => {
              setIsSold(value);
              setBidRateOption("none");
            }}
            onBidRateSelect={handleBidRateSelect}
            onCustomBidRateChange={handleCustomRateInput}
            onInputChange={(partial) => {
              if ("salePrice" in partial) {
                setBidRateOption("none");
              }
              setInput(partial);
            }}
          />

          <MyTenantSection
            input={input}
            errors={errors}
            onInputChange={setInput}
          />

          <PropertySection
            input={input}
            address={address}
            errors={errors}
            detectedRegionLabel={detectedRegionLabel}
            thresholdDepositMax={thresholdDepositMax}
            thresholdPriorityMax={thresholdPriorityMax}
            onAddressChange={setAddress}
            onAddressSearch={handleAddressSearch}
            onInputChange={setInput}
            onRegionChange={(value) => {
              const nextRegion = parseRegion(value);
              if (!nextRegion) return;
              setInput({ region: nextRegion });
            }}
            onPropertyTypeChange={(value) => {
              const nextPropertyType = parsePropertyType(value);
              if (!nextPropertyType) return;
              setInput({ propertyType: nextPropertyType });
            }}
          />

          <OptionalSection
            input={input}
            errors={errors}
            hasMyTenant={hasMyTenant}
            onInputChange={setInput}
            onAddOtherTenant={addOtherTenant}
            onUpdateOtherTenant={updateOtherTenant}
            onRemoveOtherTenant={removeOtherTenant}
          />

          {/* Submit + 전체 지우기 */}
          {confirmReset ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-error/30 bg-error-bg/50 py-5 px-4">
              <p className="text-sm font-medium text-foreground">입력한 정보를 모두 지울까요?</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAppraisalValue(0);
                    setAddress("");
                    setDetectedRegionLabel(null);
                    setIsSold(false);
                    setBidRateOption("none");
                    setErrors({});
                    setConfirmReset(false);
                    setActiveSource(null);
                    setInput({
                      ...defaultSimulationInput,
                      otherTenants: defaultVisibleOtherTenants([]),
                    });
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="px-5 py-2 rounded-xl bg-error text-white text-sm font-medium hover:bg-error/80 transition-colors cursor-pointer"
                >
                  전체 지우기
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="px-5 py-2 rounded-xl border border-card-border text-sm text-sub-text hover:text-foreground transition-colors cursor-pointer"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button type="submit"
                className="flex-1 py-4 rounded-2xl bg-accent text-white font-semibold text-base
                  hover:opacity-90 active:scale-[0.98] transition-all duration-150
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40
                  cursor-pointer shadow-sm">
                배당액 계산하기
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="px-4 py-4 rounded-2xl border border-card-border text-sub-text
                  hover:border-error/50 hover:text-error transition-colors duration-150
                  cursor-pointer"
                aria-label="전체 지우기"
                title="전체 지우기"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
              </button>
            </div>
          )}

          {/* 엑셀로 저장 */}
          <button
            type="button"
            onClick={() => downloadSimulationExcel({ ...input, appraisalValue })}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-card-border text-sm font-medium text-sub-text
              hover:border-foreground/40 hover:text-foreground transition-colors duration-150
              cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            입력 정보를 엑셀로 저장
          </button>
        </div>
      </form>
    </div>
  );
}
