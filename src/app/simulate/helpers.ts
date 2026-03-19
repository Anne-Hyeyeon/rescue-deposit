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
  myName: "A씨",
  myDeposit: 160_000_000,
  myOpposabilityDate: "2020-08-24",
  myHasOccupancy: true,
  mortgageName: "○○저축은행",
  mortgagePrincipal: 784_560_000,
  mortgageMaxClaim: 784_560_000,
  mortgageRegDate: "2017-12-04",
  propertyType: "multi_family",
  region: "seoul",
  propertyTaxOption: "no",
  propertyTaxAmount: 0,
  propertyTaxLegalDate: "",
  otherTenants: [
    { id: "t-01", name: "임차인1", deposit: 150_000_000, opposabilityDate: "2019-12-02", hasOccupancy: true },
    { id: "t-02", name: "임차인2", deposit: 300_000_000, opposabilityDate: "2019-12-27", hasOccupancy: true },
    { id: "t-03", name: "LH임차인1", deposit: 110_000_000, opposabilityDate: "2020-01-07", hasOccupancy: true },
    { id: "t-04", name: "임차인3", deposit: 100_000_000, opposabilityDate: "2021-01-13", hasOccupancy: true },
    { id: "t-05", name: "임차인4", deposit: 150_000_000, opposabilityDate: "2021-06-04", hasOccupancy: true },
    { id: "t-06", name: "LH임차인2", deposit: 120_000_000, opposabilityDate: "2021-08-13", hasOccupancy: true },
    { id: "t-07", name: "LH임차인3", deposit: 120_000_000, opposabilityDate: "2021-08-23", hasOccupancy: true },
    { id: "t-08", name: "임차인5", deposit: 120_000_000, opposabilityDate: "2021-12-29", hasOccupancy: true },
    { id: "t-09", name: "임차인6", deposit: 120_000_000, opposabilityDate: "2021-12-31", hasOccupancy: true },
    { id: "t-10", name: "LH임차인4", deposit: 100_000_000, opposabilityDate: "2022-02-08", hasOccupancy: true },
    { id: "t-11", name: "LH임차인5", deposit: 130_000_000, opposabilityDate: "2022-02-16", hasOccupancy: true },
    { id: "t-12", name: "LH임차인6", deposit: 120_000_000, opposabilityDate: "2022-04-21", hasOccupancy: true },
    { id: "t-13", name: "LH임차인7", deposit: 110_000_000, opposabilityDate: "2022-05-25", hasOccupancy: true },
    { id: "t-14", name: "LH임차인8", deposit: 120_000_000, opposabilityDate: "2022-07-01", hasOccupancy: true },
    { id: "t-15", name: "임차인7", deposit: 95_000_000, opposabilityDate: "2022-09-08", hasOccupancy: true },
    { id: "t-16", name: "임차인8", deposit: 130_000_000, opposabilityDate: "2022-09-26", hasOccupancy: true },
  ],
} satisfies ISimulationInput;

export const DEMO_SIMULATION_ADDRESS = "서울시 동작구";

// Second demo case - Real auction case (2021 mortgage, 26 tenants)
export const DEMO_SIMULATION_INPUT_2 = {
  salePrice: 1_601_000_999,
  executionCost: 8_805_505,  // Estimated ~0.55% of sale price
  appraisalValue: 2_383_575_800,
  myName: "B씨",
  myDeposit: 190_000_000,
  myOpposabilityDate: "2022-05-30",
  myHasOccupancy: true,
  mortgageName: "○○은행",
  mortgagePrincipal: 1_296_000_000,
  mortgageMaxClaim: 1_296_000_000,
  mortgageRegDate: "2021-04-09",
  propertyType: "multi_family",
  region: "seoul",
  propertyTaxOption: "no",
  propertyTaxAmount: 0,
  propertyTaxLegalDate: "",
  otherTenants: [
    { id: "t2-01", name: "C씨", deposit: 0, opposabilityDate: "2022-03-15", hasOccupancy: true },
    { id: "t2-02", name: "D씨", deposit: 0, opposabilityDate: "2022-03-15", hasOccupancy: true },
    { id: "t2-03", name: "E씨", deposit: 0, opposabilityDate: "2022-03-15", hasOccupancy: true },
    { id: "t2-04", name: "F씨", deposit: 30_000_000, opposabilityDate: "2022-12-12", hasOccupancy: true },
    { id: "t2-05", name: "G씨", deposit: 0, opposabilityDate: "2022-03-15", hasOccupancy: true },
    { id: "t2-06", name: "H씨", deposit: 150_000_000, opposabilityDate: "2022-04-04", hasOccupancy: true },
    { id: "t2-07", name: "I씨", deposit: 30_000_000, opposabilityDate: "2022-10-14", hasOccupancy: true },
    { id: "t2-08", name: "J씨", deposit: 150_000_000, opposabilityDate: "2022-03-15", hasOccupancy: true },
    { id: "t2-09", name: "K씨", deposit: 210_000_000, opposabilityDate: "2022-03-21", hasOccupancy: true },
    { id: "t2-10", name: "L씨", deposit: 200_000_000, opposabilityDate: "2022-04-01", hasOccupancy: true },
    { id: "t2-11", name: "M씨", deposit: 30_000_000, opposabilityDate: "2024-02-01", hasOccupancy: true },
    { id: "t2-12", name: "N씨", deposit: 140_000_000, opposabilityDate: "2022-03-23", hasOccupancy: true },
    { id: "t2-13", name: "O씨", deposit: 50_000_000, opposabilityDate: "2022-04-28", hasOccupancy: true },
    { id: "t2-14", name: "P씨", deposit: 70_000_000, opposabilityDate: "2022-08-16", hasOccupancy: true },
    { id: "t2-15", name: "Q씨", deposit: 210_000_000, opposabilityDate: "2022-03-21", hasOccupancy: true },
    { id: "t2-16", name: "R씨", deposit: 100_000_000, opposabilityDate: "2022-03-21", hasOccupancy: true },
    { id: "t2-17", name: "S씨", deposit: 120_000_000, opposabilityDate: "2022-05-02", hasOccupancy: true },
    { id: "t2-18", name: "T씨", deposit: 130_000_000, opposabilityDate: "2022-04-21", hasOccupancy: true },
    { id: "t2-19", name: "U씨", deposit: 205_000_000, opposabilityDate: "2022-03-25", hasOccupancy: true },
    // B씨 is the main tenant
    { id: "t2-21", name: "V씨", deposit: 140_000_000, opposabilityDate: "2022-04-19", hasOccupancy: true },
    { id: "t2-22", name: "W씨", deposit: 80_000_000, opposabilityDate: "2023-03-13", hasOccupancy: true },
    { id: "t2-23", name: "X씨", deposit: 130_000_000, opposabilityDate: "2022-03-25", hasOccupancy: true },
    { id: "t2-24", name: "Y씨", deposit: 50_000_000, opposabilityDate: "2022-07-22", hasOccupancy: true },
    { id: "t2-25", name: "Z씨", deposit: 200_000_000, opposabilityDate: "2022-04-01", hasOccupancy: true },
    { id: "t2-26", name: "AA씨", deposit: 50_000_000, opposabilityDate: "2022-08-16", hasOccupancy: true },
  ],
} satisfies ISimulationInput;

export const DEMO_SIMULATION_ADDRESS_2 = "서울시 강남구";

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
