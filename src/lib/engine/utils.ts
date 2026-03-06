// ===== Utility Functions =====

export const distributeProRata = (
  items: ReadonlyArray<{ readonly creditorId: string; readonly claimAmount: number }>,
  availableFund: number
): ReadonlyArray<{ readonly creditorId: string; readonly amount: number }> => {
  const totalClaim = items.reduce((sum, item) => sum + item.claimAmount, 0);

  if (totalClaim === 0) {
    return items.map((i) => ({ creditorId: i.creditorId, amount: 0 }));
  }

  const results = items.map((item) => ({
    creditorId: item.creditorId,
    amount: Math.floor((availableFund * item.claimAmount) / totalClaim),
  }));

  const distributed = results.reduce((sum, r) => sum + r.amount, 0);
  const remainder = availableFund - distributed;

  if (remainder <= 0 || results.length === 0) return results;

  return results.map((r, i) =>
    i < remainder ? { ...r, amount: r.amount + 1 } : r
  );
};

export const getNextDay = (date: string): string => {
  const d = new Date(date + "T00:00:00");
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
};

export const maxDate = (date1: string, date2: string): string =>
  date1 >= date2 ? date1 : date2;
