import type {
  IAbsoluteSmallTenant,
  ICreditor,
  IStepResult,
} from "../types";
import { distributeProRata } from "../utils";

// ===== STEP 1: Absolute Priority =====

const computeAbsoluteSmallDistribution = (
  absoluteSmalls: ReadonlyArray<IAbsoluteSmallTenant>,
  remaining: number,
  halfOfPropertyValue: number
): IStepResult => {
  if (absoluteSmalls.length === 0) return { rows: [], remaining };

  const claims = absoluteSmalls.map((s) => ({
    id: s.tenant.creditor.id,
    name: s.tenant.creditor.name,
    amount: s.priorityAmount,
  }));

  const totalClaim = claims.reduce((sum, c) => sum + c.amount, 0);

  if (totalClaim <= halfOfPropertyValue) {
    return claims.reduce<IStepResult>(
      (acc, claim) => {
        const amount = Math.min(claim.amount, acc.remaining);
        return {
          rows: [
            ...acc.rows,
            {
              order: 0,
              creditorId: claim.id,
              creditorName: claim.name,
              claimAmount: claim.amount,
              step: "STEP1",
              rank: 1,
              reason: "최선순위소액임차인",
              distributionAmount: amount,
              remainingAfter: acc.remaining - amount,
              distributionRate: amount / claim.amount,
            },
          ],
          remaining: acc.remaining - amount,
        };
      },
      { rows: [], remaining }
    );
  }

  // Half limit exceeded: pro rata
  const fund = Math.min(halfOfPropertyValue, remaining);
  const proRataResults = distributeProRata(
    claims.map((c) => ({ creditorId: c.id, claimAmount: c.amount })),
    fund
  );

  return proRataResults.reduce<IStepResult>(
    (acc, result) => {
      const claim = claims.find((c) => c.id === result.creditorId)!;
      return {
        rows: [
          ...acc.rows,
          {
            order: 0,
            creditorId: result.creditorId,
            creditorName: claim.name,
            claimAmount: claim.amount,
            step: "STEP1",
            rank: 1,
            reason: "최선순위소액임차인 (1/2 한도 안분)",
            distributionAmount: result.amount,
            remainingAfter: acc.remaining - result.amount,
            distributionRate: result.amount / claim.amount,
          },
        ],
        remaining: acc.remaining - result.amount,
      };
    },
    { rows: [], remaining }
  );
};

export const step1AbsolutePriority = (
  absoluteSmalls: ReadonlyArray<IAbsoluteSmallTenant>,
  creditors: ReadonlyArray<ICreditor>,
  remaining: number,
  halfOfPropertyValue: number
): IStepResult => {
  const smallTenantResult = computeAbsoluteSmallDistribution(
    absoluteSmalls,
    remaining,
    halfOfPropertyValue
  );

  const priorityWages = creditors.filter((c) => c.type === "wage_priority");

  return priorityWages.reduce<IStepResult>(
    (acc, wage) => {
      const amount = Math.min(wage.claimAmount, acc.remaining);
      return {
        rows: [
          ...acc.rows,
          {
            order: 0,
            creditorId: wage.id,
            creditorName: wage.name,
            claimAmount: wage.claimAmount,
            step: "STEP1",
            rank: 1,
            reason: "최우선임금채권",
            distributionAmount: amount,
            remainingAfter: acc.remaining - amount,
            distributionRate: amount / wage.claimAmount,
          },
        ],
        remaining: acc.remaining - amount,
      };
    },
    smallTenantResult
  );
};
