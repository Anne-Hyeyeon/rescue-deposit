"use client";

import { useState, useCallback, useEffect, useMemo, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { useSimulationStore } from "@/store/simulationStore";
import { useAuthStore } from "@/store/useAuthStore";
import { getSimulationDataList } from "@/lib/supabase/simulation-data";
import {
  calcSalePriceFromRate,
  defaultVisibleOtherTenants,
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
import type { IOtherTenant } from "@/types/simulation";
import { defaultSimulationInput } from "@/types/simulation";

import { DEMO_CASES, PROD_DEMO, getProdDemoInput, type DemoSource } from "../constants/demo-cases";

export const useSimulationForm = () => {
  const router = useRouter();
  const { input, setInput, setResult, reset: resetStore } = useSimulationStore();
  const user = useAuthStore((s) => s.user);
  const isAuthLoading = useAuthStore((s) => s.isLoading);

  // 페이지 진입 시 store 초기화 (다른 페이지에서 돌아온 경우)
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    if (!initialized) {
      resetStore();
      setInitialized(true);
    }
  }, [initialized, resetStore]);

  const [loadingMyData, setLoadingMyData] = useState(false);
  const [myDataEmpty, setMyDataEmpty] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [activeSource, setActiveSource] = useState<DemoSource>(null);

  const [address, setAddress] = useState("");
  const [detectedRegionLabel, setDetectedRegionLabel] = useState<string | null>(null);
  const [errors, setErrors] = useState<SimulationFormErrors>({});

  // Section 1 state
  const [appraisalMode, setAppraisalMode] = useState<"known" | "unknown">("known");
  const [appraisalValue, setAppraisalValue] = useState(0);
  const [isSold, setIsSold] = useState(false);
  const [bidRateOption, setBidRateOption] = useState<BidRateOption>("none");
  const [customBidRate, setCustomBidRate] = useState(85);

  const hasMyTenant = hasMyTenantInput(input);

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

  const loadDemo = (demoCase: 1 | 2 | 3 | 4) => {
    const demo = DEMO_CASES[demoCase];
    setInput({
      ...demo.input,
      otherTenants: defaultVisibleOtherTenants(demo.input.otherTenants),
    });
    setAddress(demo.address);
    setAppraisalValue(demo.appraisalValue);
    setAppraisalMode("known");
    setIsSold(true);
    setBidRateOption("none");
    setErrors({});
    setActiveSource(demoCase);
  };

  const loadProdDemo = () => {
    const demoInput = getProdDemoInput();
    setInput({
      ...demoInput,
      otherTenants: defaultVisibleOtherTenants(demoInput.otherTenants),
    });
    setAddress(PROD_DEMO.address);
    setAppraisalValue(PROD_DEMO.appraisalValue);
    setAppraisalMode("known");
    setIsSold(true);
    setBidRateOption("none");
    setErrors({});
    setActiveSource("prod");
  };

  const loadMyData = useCallback(async () => {
    if (!user) {
      router.push("/login?redirect=/simulate");
      return;
    }
    setLoadingMyData(true);
    setMyDataEmpty(false);
    try {
      const list = await getSimulationDataList(user.id);
      if (list.length === 0) {
        setMyDataEmpty(true);
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
    if (Object.keys(errs).length === 0) return true;

    const firstErrorField = Object.keys(errs)[0];
    const fieldIdMap: Record<string, string> = {
      salePrice: isSold ? "salePrice-sold" : appraisalMode === "known" ? "salePrice-expected" : "salePrice-unknown",
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

  const resetForm = () => {
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
  };

  const hasUnsavedInput =
    input.myDeposit > 0 ||
    input.mortgageMaxClaim > 0 ||
    input.salePrice !== defaultSimulationInput.salePrice;

  // 브라우저 탭 닫기 / 새로고침 경고
  useEffect(() => {
    if (!hasUnsavedInput) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedInput]);

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

  return {
    // auth
    user,
    isAuthLoading,
    // form data
    input,
    address,
    errors,
    detectedRegionLabel,
    thresholdDepositMax,
    thresholdPriorityMax,
    // section 1 state
    appraisalMode,
    appraisalValue,
    isSold,
    bidRateOption,
    customBidRate,
    hasMyTenant,
    // data source
    activeSource,
    loadingMyData,
    myDataEmpty,
    hasUnsavedInput,
    confirmReset,
    // actions
    setInput,
    setAddress,
    setAppraisalMode,
    setAppraisalValue,
    setIsSold,
    setBidRateOption,
    setConfirmReset,
    handleAddressSearch,
    handleBidRateSelect,
    handleCustomRateInput,
    addOtherTenant,
    updateOtherTenant,
    removeOtherTenant,
    handleSubmit,
    loadDemo,
    loadProdDemo,
    loadMyData,
    resetForm,
  };
};
