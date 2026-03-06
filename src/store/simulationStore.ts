import { create } from "zustand";

// ── Result types (table-oriented) ─────────────────────────────────────────────

export interface IDistributionRow {
  step: string;        // "집행비용" | "STEP 1" | "STEP 2" | "STEP 3" | ...
  category: string;    // human-readable: "집행비용", "소액임차인 최우선변제", "당해세", "근저당", "확정일자" …
  creditorId: string;
  creditorName: string;
  claimAmount: number;       // 채권액
  distributedAmount: number; // 배당액
  remainingPool: number;     // 배당 후 잔액
  isMyTenant: boolean;
  note?: string;             // 비고 (예: "균분", "비율안분", "소액임차인")
  keyDate?: string;          // 대항력 발생일 / 등기일 / 법정기일
}

export interface ISimulationResult {
  salePrice: number;
  executionCost: number;
  rows: IDistributionRow[];
  myDistributedAmount: number;
  remainingBalance: number;
}

// ── Input types ───────────────────────────────────────────────────────────────

export interface IOtherTenant {
  id: string;
  deposit: number;
  opposabilityDate: string; // 대항력 발생일
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
  // Section 1: Sale
  salePrice: number;
  executionCost: number;
  appraisalValue: number;
  // Section 2: My Tenant Info
  myDeposit: number;
  myOpposabilityDate: string; // 대항력 발생일
  myHasOccupancy: boolean;
  // Section 3: Base Right (선순위 근저당)
  mortgagePrincipal: number;
  mortgageMaxClaim: number;
  mortgageRegDate: string;
  propertyType: PropertyType;
  region: Region;
  // Section 4: Optional
  propertyTaxOption: PropertyTaxOption;
  propertyTaxAmount: number;
  propertyTaxLegalDate: string;
  otherTenants: IOtherTenant[];
}

// ── Store ─────────────────────────────────────────────────────────────────────

interface ISimulationStore {
  input: ISimulationInput;
  result: ISimulationResult | null;
  setInput: (partial: Partial<ISimulationInput>) => void;
  setResult: (result: ISimulationResult | null) => void;
  reset: () => void;
}

const defaultInput: ISimulationInput = {
  salePrice: 200_000_000,
  executionCost: 10_000_000,
  appraisalValue: 0,
  myDeposit: 0,
  myOpposabilityDate: "",
  myHasOccupancy: true,
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

export const useSimulationStore = create<ISimulationStore>((set) => ({
  input: defaultInput,
  result: null,
  setInput: (partial) =>
    set((state) => ({ input: { ...state.input, ...partial } })),
  setResult: (result) => set({ result }),
  reset: () => set({ input: defaultInput, result: null }),
}));
