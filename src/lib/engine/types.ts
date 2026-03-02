export interface IAuctionCase {
  salePrice: number;
  executionCost: number; // default 10,000,000
  propertyType: "multi_family" | "multi_unit";
  region: "seoul" | "metropolitan_overcrowded" | "metropolitan" | "others";
  baseRightDate: string; // YYYY-MM-DD (말소기준권리 설정일)
}

export type CreditorType =
  | "confirmed_date_tenant"
  | "mortgage"
  | "pledge_on_mortgage"
  | "jeonse_right"
  | "property_tax"
  | "general_tax"
  | "wage_priority"
  | "wage_general"
  | "public_charge"
  | "provisional_seizure"
  | "general_creditor";

export interface ICreditor {
  id: string;
  name: string;
  type: CreditorType;
  principal: number;
  interest: number;
  cost: number;

  // Dates (YYYY-MM-DD)
  registrationDate?: string;
  moveInDate?: string;
  confirmedDate?: string;
  legalDate?: string; // 법정기일 (for taxes)

  // Tenant specific
  deposit: number;
  hasOccupancy: boolean;
  hasResidentReg: boolean;
  householdGroupId?: string; // For grouping family members (가정공동생활 합산)

  maxClaimAmount?: number; // 채권최고액
}

// Engine internal model — enriched at runtime
export interface IEffectiveCreditor extends ICreditor {
  claimAmount: number; // principal + interest + cost
  remainingAmount: number;
  totalDistributed: number;
  effectivePriorityDate: number; // timestamp for sorting (ms)
  opposabilityDatetime?: number; // 대항력 발생 타임스탬프 (전입일 익일 0시)
  /** 2023 당해세 역전: 이 채권자를 STEP 2가 아닌 STEP 3에서 처리 */
  _deferredToStep3?: boolean;
}

export type DistributionPolicy = "proRata" | "equalSplit";

export interface IDistributionLog {
  creditorId: string;
  amount: number;
  reason: string;
  policy: DistributionPolicy;
}

export interface IEngineResult {
  distributions: Record<string, number>; // creditorId -> total amount received
  remainingBalance: number;
  logs: IDistributionLog[];
}

export interface ISmallTenantLimit {
  startDate: string; // YYYY-MM-DD inclusive
  endDate: string | null; // YYYY-MM-DD inclusive, null = present
  maxDeposit: number; // 소액임차인 해당 보증금 상한
  priorityAmount: number; // 최우선변제 금액
}
