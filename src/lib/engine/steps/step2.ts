import type { ICreditor, ITenantWithDates, IStepResult } from "../types";

// ===== STEP 2: Property Tax =====

export const step2PropertyTax = (
  creditors: ReadonlyArray<ICreditor>,
  tenants: ReadonlyArray<ITenantWithDates>,
  remaining: number
): IStepResult => {
  const propertyTaxes = creditors.filter((c) => c.type === "property_tax");

  if (propertyTaxes.length === 0) return { rows: [], remaining };

  // 2023.04.01 reform: if any tenant has opposabilityDate before the tax's legalDate,
  // defer that tax to STEP 3
  const step2Taxes = propertyTaxes.filter(
    (tax) =>
      !tenants.some(
        (t) => t.opposabilityDate && t.opposabilityDate < tax.legalDate!
      )
  );

  return step2Taxes.reduce<IStepResult>(
    (acc, tax) => {
      const amount = Math.min(tax.claimAmount, acc.remaining);
      return {
        rows: [
          ...acc.rows,
          {
            order: 0,
            creditorId: tax.id,
            creditorName: tax.name,
            claimAmount: tax.claimAmount,
            step: "STEP2",
            rank: 2,
            reason: "당해세",
            distributionAmount: amount,
            remainingAfter: acc.remaining - amount,
            distributionRate: amount / tax.claimAmount,
          },
        ],
        remaining: acc.remaining - amount,
      };
    },
    { rows: [], remaining }
  );
};
