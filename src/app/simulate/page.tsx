"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import {
  useSimulationStore,
} from "@/store/simulationStore";
import { AssumptionsBanner } from "@/app/simulate/components/form-primitives";
import {
  MyTenantSection,
  OptionalSection,
  PropertySection,
  SalePriceSection,
} from "@/app/simulate/components/sections";
import {
  calcSalePriceFromRate,
  createEmptyOtherTenant,
  DEMO_SIMULATION_ADDRESS,
  DEMO_SIMULATION_INPUT,
  parsePropertyType,
  parseRegion,
  removeOtherTenantById,
  type BidRateOption,
  type SimulationFormErrors,
  upsertOtherTenant,
  validateSimulationInput,
} from "@/app/simulate/helpers";
import { runSimulation } from "@/lib/engine/bridge";
import type {
  IOtherTenant,
} from "@/types/simulation";

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SimulatePage() {
  const router = useRouter();
  const { input, setInput, setResult } = useSimulationStore();

  const [address, setAddress] = useState("");
  const [errors, setErrors] = useState<SimulationFormErrors>({});

  // Section 1 state
  const [appraisalMode, setAppraisalMode] = useState<"known" | "unknown">("known");
  const [appraisalValue, setAppraisalValue] = useState(0);
  const [isSold, setIsSold] = useState(false);
  const [bidRateOption, setBidRateOption] = useState<BidRateOption>("none");
  const [customBidRate, setCustomBidRate] = useState(85);

  const loadDemo = () => {
    setInput(DEMO_SIMULATION_INPUT);
    setAddress(DEMO_SIMULATION_ADDRESS);
    setAppraisalMode("known");
    setAppraisalValue(2_230_942_880);
    setIsSold(true);
    setBidRateOption("none");
    setErrors({});
  };

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
        createEmptyOtherTenant(),
      ],
    });
  };

  const updateOtherTenant = (id: string, t: IOtherTenant) => {
    setInput({ otherTenants: upsertOtherTenant(input.otherTenants, id, t) });
  };

  const removeOtherTenant = (id: string) => {
    setInput({ otherTenants: removeOtherTenantById(input.otherTenants, id) });
  };

  const validate = () => {
    const errs = validateSimulationInput(input);
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
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
            onAddressChange={setAddress}
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
            onInputChange={setInput}
            onAddOtherTenant={addOtherTenant}
            onUpdateOtherTenant={updateOtherTenant}
            onRemoveOtherTenant={removeOtherTenant}
          />

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
