import type {
  IAuctionCase,
  ICreditor,
  IDistributionResult,
  IDistributionRow as IEngineDistributionRow,
  Region,
} from "@/lib/engine/types";
import type {
  IDistributionRow as IStoreRow,
  ISimulationInput,
  Region as StoreRegion,
} from "@/types/simulation";

const STORE_TO_ENGINE_REGION: Record<StoreRegion, Region> = {
  seoul: "seoul",
  metropolitan_overcrowded: "overcrowded",
  metropolitan: "metropolitan",
  others: "others",
};

const STEP_LABELS: Record<string, string> = {
  STEP1: "STEP 1",
  STEP2: "STEP 2",
  STEP3: "STEP 3",
  STEP4: "STEP 4",
  STEP5: "STEP 5",
  STEP6: "STEP 6",
  STEP7: "STEP 7",
};

export const mapRegion = (storeRegion: StoreRegion): Region =>
  STORE_TO_ENGINE_REGION[storeRegion];

export const stepToCategory = (step: string, reason: string): string => {
  if (reason.includes("상대적소액")) return "상대적 소액임차인";
  if (reason.includes("소액임차인")) return "최선순위 소액임차인";
  if (reason.includes("임금")) return "임금채권";
  if (reason.includes("당해세")) return "당해세";
  if (
    reason.includes("근저당") ||
    reason.includes("전세권") ||
    reason.includes("질권")
  ) {
    return "담보물권";
  }
  if (reason.includes("확정일자")) return "확정일자 임차인";
  if (reason.includes("조세")) return "조세채권";
  if (reason.includes("공과금")) return "공과금";
  if (reason.includes("일반채권")) return "일반채권";
  if (reason.includes("잔여액 부족")) return "배당 불가";
  return step;
};

export const formatStepLabel = (step: string): string => STEP_LABELS[step] ?? step;

export const buildAuctionCase = (input: ISimulationInput): IAuctionCase => ({
  salePrice: input.salePrice,
  saleInterest: 0,
  delayInterest: 0,
  priorDeposit: 0,
  appealDeposit: 0,
  executionCost: input.executionCost,
  region: mapRegion(input.region),
  baseRightDate: input.mortgageRegDate,
});

const buildMortgageCreditors = (input: ISimulationInput): ICreditor[] =>
  input.mortgageMaxClaim > 0
    ? [
        {
          id: "mortgage_1",
          name: input.mortgageName || "선순위 근저당",
          type: "mortgage",
          claimAmount: input.mortgageMaxClaim,
          registrationDate: input.mortgageRegDate,
          maxClaimAmount: input.mortgageMaxClaim,
        },
      ]
    : [];

const buildMyTenantCreditors = (input: ISimulationInput): ICreditor[] =>
  input.myDeposit > 0 && input.myOpposabilityDate
    ? [
        {
          id: "my_tenant",
          name:
            input.myName && input.myName !== "모름"
              ? input.myName
              : "나의 임차권",
          type: "tenant",
          claimAmount: input.myDeposit,
          opposabilityDate: input.myOpposabilityDate,
          deposit: input.myDeposit,
        },
      ]
    : [];

const buildOtherTenantCreditors = (input: ISimulationInput): ICreditor[] =>
  input.otherTenants
    .filter((otherTenant) => otherTenant.deposit > 0 && otherTenant.opposabilityDate)
    .map((otherTenant, index) => ({
      id: otherTenant.id,
      name:
        otherTenant.name && otherTenant.name !== "모름"
          ? otherTenant.name
          : `다른 세입자 ${index + 1}`,
      type: "tenant" as const,
      claimAmount: otherTenant.deposit,
      opposabilityDate: otherTenant.opposabilityDate,
      deposit: otherTenant.deposit,
    }));

const buildPropertyTaxCreditors = (input: ISimulationInput): ICreditor[] =>
  input.propertyTaxOption === "yes" && input.propertyTaxAmount > 0
    ? [
        {
          id: "property_tax",
          name: "재산세",
          type: "property_tax",
          claimAmount: input.propertyTaxAmount,
          legalDate: input.propertyTaxLegalDate || input.mortgageRegDate,
        },
      ]
    : [];

export const buildCreditors = (input: ISimulationInput): ICreditor[] => [
  ...buildMortgageCreditors(input),
  ...buildMyTenantCreditors(input),
  ...buildOtherTenantCreditors(input),
  ...buildPropertyTaxCreditors(input),
];

export const buildDateLookup = (
  creditors: ReadonlyArray<ICreditor>,
): ReadonlyMap<string, string> =>
  new Map(
    creditors.flatMap((creditor) => {
      const date =
        creditor.opposabilityDate ?? creditor.registrationDate ?? creditor.legalDate;

      return date ? [[creditor.id, date]] : [];
    }),
  );

export const createExecutionRow = (
  input: ISimulationInput,
  distributableFund: number,
): IStoreRow => ({
  step: "집행비용",
  category: "집행비용",
  creditorId: "execution_cost",
  creditorName: "집행기관",
  claimAmount: input.executionCost,
  distributedAmount: input.executionCost,
  remainingPool: distributableFund,
  isMyTenant: false,
});

const mapEngineRowToStoreRow = (
  row: IEngineDistributionRow,
  dateLookup: ReadonlyMap<string, string>,
): IStoreRow => ({
  step: formatStepLabel(row.step),
  category: stepToCategory(row.step, row.reason),
  creditorId: row.creditorId,
  creditorName: row.creditorName,
  claimAmount: row.claimAmount,
  distributedAmount: row.distributionAmount,
  remainingPool: row.remainingAfter,
  isMyTenant: row.creditorId === "my_tenant",
  note: row.reason,
  keyDate: dateLookup.get(row.creditorId),
});

export const buildStoreRows = (
  input: ISimulationInput,
  engineResult: IDistributionResult,
  dateLookup: ReadonlyMap<string, string>,
): IStoreRow[] => [
  createExecutionRow(input, engineResult.distributableFund),
  ...engineResult.rows.map((row) => mapEngineRowToStoreRow(row, dateLookup)),
];

export const calculateMyDistributedAmount = (
  rows: ReadonlyArray<IEngineDistributionRow>,
): number =>
  rows
    .filter((row) => row.creditorId === "my_tenant")
    .reduce((sum, row) => sum + row.distributionAmount, 0);
