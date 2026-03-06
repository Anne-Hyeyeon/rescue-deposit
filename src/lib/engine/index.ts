// ===== Types =====
export type {
  Region,
  CreditorType,
  IAuctionCase,
  ICreditor,
  IStepResult,
  ITenantWithDates,
  IAbsoluteSmallTenant,
  IRelativeSmallTenantInfo,
  IRelativeSmallResult,
  IQueueItem,
  QueueSegment,
  IDistributionRow,
  IDistributionResult,
  ISmallTenantThreshold,
} from "./types";

// ===== Constants =====
export {
  SMALL_TENANT_TABLE,
  OVERCROWDED_CITIES,
  OVERCROWDED_ADDITIONAL,
  METROPOLITAN_ADDITIONAL,
  METROPOLITAN_BASE_CITIES,
  findPeriodStart,
  getSmallTenantThreshold,
} from "./constants";

// ===== Utilities =====
export { distributeProRata, getNextDay, maxDate } from "./utils";

// ===== Region =====
export { resolveRegion } from "./region";

// ===== Preprocessing =====
export { preprocessSubrogation, computeTenantDates } from "./preprocessing";

// ===== Classification =====
export {
  classifyAbsoluteSmallTenants,
  identifyRelativeSmallTenants,
} from "./classification";

// ===== Queue =====
export {
  isMortgageType,
  insertRelativeSmallTenants,
  buildDistributionQueue,
  segmentQueue,
  processRelativeSmallGroup,
  executeDistribution,
} from "./queue";

// ===== Steps =====
export { step1AbsolutePriority } from "./steps/step1";
export { step2PropertyTax } from "./steps/step2";
export { step3DateCompetition } from "./steps/step3";
export { step4To7LowerPriority } from "./steps/step4to7";

// ===== Main =====
export { calculateDistribution } from "./calculator";
