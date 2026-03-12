// Shared types and defaults for the simulation flow.

export interface IDistributionRow {
  step: string;
  category: string;
  creditorId: string;
  creditorName: string;
  claimAmount: number;
  distributedAmount: number;
  remainingPool: number;
  isMyTenant: boolean;
  note?: string;
  keyDate?: string;
}

export interface ISimulationResult {
  salePrice: number;
  executionCost: number;
  rows: IDistributionRow[];
  myDistributedAmount: number;
  remainingBalance: number;
}

export interface IOtherTenant {
  id: string;
  name: string;
  deposit: number;
  opposabilityDate: string;
  hasOccupancy: boolean;
}

export type PropertyTaxOption = "yes" | "no" | "unknown";
export type PropertyType = "multi_family" | "multi_unit";
export type Region =
  | "seoul"
  | "metropolitan_overcrowded"
  | "metropolitan"
  | "others";

export interface ISimulationInput {
  salePrice: number;
  executionCost: number;
  appraisalValue: number;
  myName: string;
  myDeposit: number;
  myOpposabilityDate: string;
  myHasOccupancy: boolean;
  mortgageName: string;
  mortgagePrincipal: number;
  mortgageMaxClaim: number;
  mortgageRegDate: string;
  propertyType: PropertyType;
  region: Region;
  propertyTaxOption: PropertyTaxOption;
  propertyTaxAmount: number;
  propertyTaxLegalDate: string;
  otherTenants: IOtherTenant[];
}

export const defaultSimulationInput: ISimulationInput = {
  salePrice: 200_000_000,
  executionCost: 10_000_000,
  appraisalValue: 0,
  myName: "",
  myDeposit: 0,
  myOpposabilityDate: "",
  myHasOccupancy: true,
  mortgageName: "",
  mortgagePrincipal: 0,
  mortgageMaxClaim: 0,
  mortgageRegDate: "",
  propertyType: "multi_family",
  region: "seoul",
  propertyTaxOption: "unknown",
  propertyTaxAmount: 0,
  propertyTaxLegalDate: "",
  otherTenants: [],
};
