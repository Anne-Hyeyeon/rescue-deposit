// All monetary amounts in KRW, dates in "YYYY-MM-DD" format

// ===== Input Types =====

export type Region = "seoul" | "overcrowded" | "metropolitan" | "others";

export interface IAuctionCase {
  readonly salePrice: number;
  readonly saleInterest: number;
  readonly delayInterest: number;
  readonly priorDeposit: number;
  readonly appealDeposit: number;
  readonly executionCost: number;
  readonly address?: string;
  readonly region?: Region;
  readonly baseRightDate: string;
}

export type CreditorType =
  | "tenant"
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
  readonly id: string;
  readonly name: string;
  readonly type: CreditorType;
  readonly claimAmount: number;
  readonly registrationDate?: string;
  readonly opposabilityDate?: string;
  readonly legalDate?: string;
  readonly seizureDate?: string;
  readonly deposit?: number;
  readonly isSubrogation?: boolean;
  readonly originalTenantId?: string;
  readonly maxClaimAmount?: number;
}

// ===== Internal Types =====

export interface IStepResult {
  readonly rows: ReadonlyArray<IDistributionRow>;
  readonly remaining: number;
}

export interface ITenantWithDates {
  readonly creditor: ICreditor;
  readonly opposabilityDate: string;
  readonly priorityDate: string | null;
}

export interface IAbsoluteSmallTenant {
  readonly tenant: ITenantWithDates;
  readonly priorityAmount: number;
}

export interface IRelativeSmallTenantInfo {
  readonly creditorId: string;
  readonly creditorName: string;
  readonly deposit: number;
  readonly priorityAmount: number;
  readonly periodStart: string;
}

export interface IRelativeSmallResult {
  readonly relativeSmalls: ReadonlyArray<IRelativeSmallTenantInfo>;
  readonly relativeSmallIds: ReadonlySet<string>;
  readonly relativeSmallAmounts: ReadonlyMap<string, number>;
}

export interface IQueueItem {
  readonly creditorId: string;
  readonly creditorName: string;
  readonly type: CreditorType | "relative_small";
  readonly claimAmount: number;
  readonly sortDate: string;
  readonly sortSubOrder: number;
  readonly reason: string;
}

export type QueueSegment =
  | { readonly kind: "relative_small_group"; readonly items: ReadonlyArray<IQueueItem> }
  | { readonly kind: "single"; readonly item: IQueueItem };

// ===== Output Types =====

export interface IDistributionRow {
  readonly order: number;
  readonly creditorId: string;
  readonly creditorName: string;
  readonly claimAmount: number;
  readonly step: string;
  readonly rank: number;
  readonly reason: string;
  readonly distributionAmount: number;
  readonly remainingAfter: number;
  readonly distributionRate: number;
}

export interface IDistributionResult {
  readonly totalFund: number;
  readonly executionCost: number;
  readonly distributableFund: number;
  readonly halfOfPropertyValue: number;
  readonly rows: ReadonlyArray<IDistributionRow>;
  readonly remainder: number;
}

export interface ISmallTenantThreshold {
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly decree: string;
  readonly seoul: { readonly depositMax: number; readonly priorityMax: number };
  readonly overcrowded: { readonly depositMax: number; readonly priorityMax: number };
  readonly metropolitan: { readonly depositMax: number; readonly priorityMax: number };
  readonly others: { readonly depositMax: number; readonly priorityMax: number };
}
