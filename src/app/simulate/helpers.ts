import type {
  IOtherTenant,
  ISimulationInput,
  PropertyType,
  Region,
} from "@/types/simulation";

export type BidRateOption = "none" | "100" | "90" | "86" | "80" | "custom";

type SimulationFormErrorField =
  | "salePrice"
  | "myDeposit"
  | "myOpposabilityDate"
  | "mortgageRegDate"
  | "mortgageMaxClaim";

export type SimulationFormErrors = Partial<
  Record<SimulationFormErrorField, string>
>;

const REGION_VALUES = [
  "seoul",
  "metropolitan_overcrowded",
  "metropolitan",
  "others",
] as const;

const PROPERTY_TYPE_VALUES = ["multi_family", "multi_unit"] as const;

export const DEMO_SIMULATION_INPUT = {
  salePrice: 1_784_756_000,
  executionCost: 9_811_568,
  appraisalValue: 2_230_942_880,
  myName: "김○○",
  myDeposit: 160_000_000,
  myOpposabilityDate: "2020-08-24",
  myHasOccupancy: true,
  mortgageName: "웰컴저축은행",
  mortgagePrincipal: 784_560_000,
  mortgageMaxClaim: 784_560_000,
  mortgageRegDate: "2017-12-04",
  propertyType: "multi_family",
  region: "seoul",
  propertyTaxOption: "no",
  propertyTaxAmount: 0,
  propertyTaxLegalDate: "",
  otherTenants: [
    { id: "t-01", name: "서○○", deposit: 150_000_000, opposabilityDate: "2019-12-02", hasOccupancy: true },
    { id: "t-02", name: "노○○", deposit: 300_000_000, opposabilityDate: "2019-12-27", hasOccupancy: true },
    { id: "t-03", name: "LH(서진아)", deposit: 110_000_000, opposabilityDate: "2020-01-07", hasOccupancy: true },
    { id: "t-04", name: "나○○", deposit: 100_000_000, opposabilityDate: "2021-01-13", hasOccupancy: true },
    { id: "t-05", name: "김○○", deposit: 150_000_000, opposabilityDate: "2021-06-04", hasOccupancy: true },
    { id: "t-06", name: "LH(양성경)", deposit: 120_000_000, opposabilityDate: "2021-08-13", hasOccupancy: true },
    { id: "t-07", name: "LH(이예원)", deposit: 120_000_000, opposabilityDate: "2021-08-23", hasOccupancy: true },
    { id: "t-08", name: "박○○", deposit: 120_000_000, opposabilityDate: "2021-12-29", hasOccupancy: true },
    { id: "t-09", name: "박○○", deposit: 120_000_000, opposabilityDate: "2021-12-31", hasOccupancy: true },
    { id: "t-10", name: "LH(임성준)", deposit: 100_000_000, opposabilityDate: "2022-02-08", hasOccupancy: true },
    { id: "t-11", name: "LH(우대영)", deposit: 130_000_000, opposabilityDate: "2022-02-16", hasOccupancy: true },
    { id: "t-12", name: "LH(유기학)", deposit: 120_000_000, opposabilityDate: "2022-04-21", hasOccupancy: true },
    { id: "t-13", name: "LH(양현진)", deposit: 110_000_000, opposabilityDate: "2022-05-25", hasOccupancy: true },
    { id: "t-14", name: "LH(조희수)", deposit: 120_000_000, opposabilityDate: "2022-07-01", hasOccupancy: true },
    { id: "t-15", name: "이○○", deposit: 95_000_000, opposabilityDate: "2022-09-08", hasOccupancy: true },
    { id: "t-16", name: "야○○", deposit: 130_000_000, opposabilityDate: "2022-09-26", hasOccupancy: true },
  ],
} satisfies ISimulationInput;

export const DEMO_SIMULATION_ADDRESS = "서울시 동작구 대방동 393-57";

export const formatKRW = (amount: number) =>
  amount >= 100_000_000
    ? `${(amount / 100_000_000).toFixed(1)}억`
    : amount >= 10_000
    ? `${Math.round(amount / 10_000).toLocaleString("ko-KR")}만원`
    : `${amount.toLocaleString("ko-KR")}원`;

export const REGION_LABELS: Record<Region, string> = {
  seoul: "서울특별시",
  metropolitan_overcrowded: "수도권 과밀억제권역",
  metropolitan: "광역시 등",
  others: "그 밖의 지역",
};

export const calcSalePriceFromRate = (baseAmount: number, rate: number) =>
  baseAmount > 0 && rate > 0 ? Math.round(baseAmount * (rate / 100)) : 0;

export const createEmptyOtherTenant = (): IOtherTenant => ({
  id: crypto.randomUUID(),
  name: "",
  deposit: 0,
  opposabilityDate: "",
  hasOccupancy: true,
});

export const upsertOtherTenant = (
  otherTenants: IOtherTenant[],
  tenantId: string,
  nextTenant: IOtherTenant
) => otherTenants.map((tenant) => (tenant.id === tenantId ? nextTenant : tenant));

export const removeOtherTenantById = (
  otherTenants: IOtherTenant[],
  tenantId: string
) => otherTenants.filter((tenant) => tenant.id !== tenantId);

export const validateSimulationInput = (
  input: ISimulationInput
): SimulationFormErrors => {
  const errors: SimulationFormErrors = {};

  if (!input.salePrice || input.salePrice <= 0) {
    errors.salePrice = "매각대금을 입력해주세요";
  }

  if (!input.myDeposit || input.myDeposit <= 0) {
    errors.myDeposit = "보증금을 입력해주세요";
  }

  if (!input.myOpposabilityDate) {
    errors.myOpposabilityDate = "대항력 발생일을 입력해주세요";
  }

  if (!input.mortgageRegDate) {
    errors.mortgageRegDate = "근저당 설정일을 입력해주세요";
  }

  if (!input.mortgageMaxClaim || input.mortgageMaxClaim <= 0) {
    errors.mortgageMaxClaim = "채권최고액을 입력해주세요";
  }

  return errors;
};

export const parseRegion = (value: string): Region | null =>
  REGION_VALUES.find((region) => region === value) ?? null;

export const parsePropertyType = (value: string): PropertyType | null =>
  PROPERTY_TYPE_VALUES.find((propertyType) => propertyType === value) ?? null;
