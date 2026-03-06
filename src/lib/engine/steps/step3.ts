import type {
  ICreditor,
  ITenantWithDates,
  IAbsoluteSmallTenant,
  IStepResult,
  Region,
} from "../types";
import { identifyRelativeSmallTenants } from "../classification";
import { buildDistributionQueue, executeDistribution } from "../queue";

// ===== STEP 3: Date Competition =====

export const step3DateCompetition = (
  creditors: ReadonlyArray<ICreditor>,
  tenants: ReadonlyArray<ITenantWithDates>,
  absoluteSmalls: ReadonlyArray<IAbsoluteSmallTenant>,
  remaining: number,
  region: Region,
  baseRightDate: string
): IStepResult => {
  const absoluteSmallIds = new Set(
    absoluteSmalls.map((s) => s.tenant.creditor.id)
  );

  // A. Identify relative small tenants
  const relativeResult = identifyRelativeSmallTenants(
    tenants,
    absoluteSmallIds,
    region,
    baseRightDate
  );

  // B. Build distribution queue
  const queue = buildDistributionQueue(
    creditors,
    tenants,
    absoluteSmallIds,
    relativeResult,
    region,
    baseRightDate
  );

  // C. Execute distribution
  return executeDistribution(queue, remaining);
};
