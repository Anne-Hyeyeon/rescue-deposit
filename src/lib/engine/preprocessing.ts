import type { ICreditor, ITenantWithDates } from "./types";

// ===== Preprocessing =====

export const preprocessSubrogation = (
  creditors: ReadonlyArray<ICreditor>
): ReadonlyArray<ICreditor> =>
  creditors.map((c) => {
    if (!c.isSubrogation || !c.originalTenantId) return c;

    const original = creditors.find((x) => x.id === c.originalTenantId);
    if (!original) return c;

    return {
      ...c,
      type: original.type,
      opposabilityDate: c.opposabilityDate ?? original.opposabilityDate,
      deposit: c.deposit ?? original.deposit,
    };
  });

export const computeTenantDates = (
  creditors: ReadonlyArray<ICreditor>
): ReadonlyArray<ITenantWithDates> =>
  creditors
    .filter((c) => c.type === "tenant")
    .map((c) => {
      const opposabilityDate = c.opposabilityDate ?? "";
      const priorityDate = opposabilityDate || null;

      return { creditor: c, opposabilityDate, priorityDate };
    });
