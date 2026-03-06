import { calculateDistribution } from "./index";
import type { IAuctionCase, ICreditor, Region } from "./types";
import type {
  ISimulationInput,
  ISimulationResult,
  IDistributionRow as IStoreRow,
  Region as StoreRegion,
} from "@/store/simulationStore";

// Map store region to engine region
const mapRegion = (storeRegion: StoreRegion): Region => {
  if (storeRegion === "metropolitan_overcrowded") return "overcrowded";
  return storeRegion;
};

// Map engine step to display category
const stepToCategory = (step: string, reason: string): string => {
  if (reason.includes("상대적소액")) return "상대적 소액임차인";
  if (reason.includes("소액임차인")) return "최선순위 소액임차인";
  if (reason.includes("임금")) return "임금채권";
  if (reason.includes("당해세")) return "당해세";
  if (reason.includes("근저당") || reason.includes("전세권") || reason.includes("질권")) return "담보물권";
  if (reason.includes("확정일자")) return "확정일자 임차인";
  if (reason.includes("조세")) return "조세채권";
  if (reason.includes("공과금")) return "공과금";
  if (reason.includes("일반채권")) return "일반채권";
  if (reason.includes("잔여액 부족")) return "배당 불가";
  return step;
};

export const runSimulation = (input: ISimulationInput): ISimulationResult => {
  const region = mapRegion(input.region);

  // Build IAuctionCase
  const auctionCase: IAuctionCase = {
    salePrice: input.salePrice,
    saleInterest: 0,
    delayInterest: 0,
    priorDeposit: 0,
    appealDeposit: 0,
    executionCost: input.executionCost,
    region,
    baseRightDate: input.mortgageRegDate,
  };

  // Build ICreditor[]
  const creditors: ICreditor[] = [];

  // Mortgage
  if (input.mortgageMaxClaim > 0) {
    creditors.push({
      id: "mortgage_1",
      name: "선순위 근저당",
      type: "mortgage",
      claimAmount: input.mortgageMaxClaim,
      registrationDate: input.mortgageRegDate,
      maxClaimAmount: input.mortgageMaxClaim,
    });
  }

  // My tenant
  if (input.myDeposit > 0 && input.myOpposabilityDate) {
    creditors.push({
      id: "my_tenant",
      name: "나의 임차권",
      type: "tenant",
      claimAmount: input.myDeposit,
      opposabilityDate: input.myOpposabilityDate,
      deposit: input.myDeposit,
    });
  }

  // Other tenants
  input.otherTenants
    .filter((ot) => ot.deposit > 0 && ot.opposabilityDate)
    .forEach((ot, i) => {
      creditors.push({
        id: ot.id,
        name: `다른 세입자 ${i + 1}`,
        type: "tenant",
        claimAmount: ot.deposit,
        opposabilityDate: ot.opposabilityDate,
        deposit: ot.deposit,
      });
    });

  // Property tax
  if (input.propertyTaxOption === "yes" && input.propertyTaxAmount > 0) {
    creditors.push({
      id: "property_tax",
      name: "재산세",
      type: "property_tax",
      claimAmount: input.propertyTaxAmount,
      legalDate: input.propertyTaxLegalDate || input.mortgageRegDate,
    });
  }

  // Run engine
  const engineResult = calculateDistribution(auctionCase, creditors);

  // Build date lookup: creditorId → key date
  const dateLookup = new Map<string, string>();
  creditors.forEach((c) => {
    const date = c.opposabilityDate ?? c.registrationDate ?? c.legalDate;
    if (date) dateLookup.set(c.id, date);
  });

  // Convert engine rows to store rows
  const executionRow: IStoreRow = {
    step: "집행비용",
    category: "집행비용",
    creditorId: "execution_cost",
    creditorName: "집행기관",
    claimAmount: input.executionCost,
    distributedAmount: input.executionCost,
    remainingPool: engineResult.distributableFund,
    isMyTenant: false,
  };

  const storeRows: IStoreRow[] = [
    executionRow,
    ...engineResult.rows.map((r) => ({
      step: r.step === "STEP1" ? "STEP 1"
        : r.step === "STEP2" ? "STEP 2"
        : r.step === "STEP3" ? "STEP 3"
        : r.step === "STEP4" ? "STEP 4"
        : r.step === "STEP5" ? "STEP 5"
        : r.step === "STEP6" ? "STEP 6"
        : r.step === "STEP7" ? "STEP 7"
        : r.step,
      category: stepToCategory(r.step, r.reason),
      creditorId: r.creditorId,
      creditorName: r.creditorName,
      claimAmount: r.claimAmount,
      distributedAmount: r.distributionAmount,
      remainingPool: r.remainingAfter,
      isMyTenant: r.creditorId === "my_tenant",
      note: r.reason,
      keyDate: dateLookup.get(r.creditorId),
    })),
  ];

  // Calculate my total distribution
  const myDistributedAmount = engineResult.rows
    .filter((r) => r.creditorId === "my_tenant")
    .reduce((sum, r) => sum + r.distributionAmount, 0);

  return {
    salePrice: input.salePrice,
    executionCost: input.executionCost,
    rows: storeRows,
    myDistributedAmount,
    remainingBalance: engineResult.remainder,
  };
};
