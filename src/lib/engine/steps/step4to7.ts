import type { ICreditor, IStepResult } from "../types";
import { distributeProRata } from "../utils";

// ===== STEP 4-7: Lower Priority =====

export const step4To7LowerPriority = (
  creditors: ReadonlyArray<ICreditor>,
  remaining: number
): IStepResult => {
  if (remaining <= 0) return { rows: [], remaining };

  const distributeGroup = (
    filtered: ReadonlyArray<ICreditor>,
    step: string,
    rank: number,
    reason: string,
    state: IStepResult
  ): IStepResult =>
    filtered.reduce<IStepResult>(
      (acc, c) => {
        const amount = Math.min(c.claimAmount, acc.remaining);
        return {
          rows: [
            ...acc.rows,
            {
              order: 0,
              creditorId: c.id,
              creditorName: c.name,
              claimAmount: c.claimAmount,
              step,
              rank,
              reason,
              distributionAmount: amount,
              remainingAfter: acc.remaining - amount,
              distributionRate: amount / c.claimAmount,
            },
          ],
          remaining: acc.remaining - amount,
        };
      },
      state
    );

  // 4: General wages
  const afterWages = distributeGroup(
    creditors.filter((c) => c.type === "wage_general"),
    "STEP4",
    4,
    "일반임금채권",
    { rows: [], remaining }
  );

  // 6: Public charges
  const afterCharges = distributeGroup(
    creditors.filter((c) => c.type === "public_charge"),
    "STEP6",
    6,
    "공과금",
    afterWages
  );

  // 7: General creditors (equal treatment)
  const generals = creditors.filter(
    (c) => c.type === "provisional_seizure" || c.type === "general_creditor"
  );

  if (generals.length === 0 || afterCharges.remaining <= 0) return afterCharges;

  const total = generals.reduce((sum, c) => sum + c.claimAmount, 0);

  if (afterCharges.remaining >= total) {
    return distributeGroup(generals, "STEP7", 7, "일반채권", afterCharges);
  }

  // Pro rata
  const proRata = distributeProRata(
    generals.map((c) => ({ creditorId: c.id, claimAmount: c.claimAmount })),
    afterCharges.remaining
  );

  return proRata.reduce<IStepResult>(
    (acc, r) => {
      const c = generals.find((x) => x.id === r.creditorId)!;
      return {
        rows: [
          ...acc.rows,
          {
            order: 0,
            creditorId: r.creditorId,
            creditorName: c.name,
            claimAmount: c.claimAmount,
            step: "STEP7",
            rank: 7,
            reason: "일반채권 (안분)",
            distributionAmount: r.amount,
            remainingAfter: acc.remaining - r.amount,
            distributionRate: r.amount / c.claimAmount,
          },
        ],
        remaining: acc.remaining - r.amount,
      };
    },
    afterCharges
  );
};
