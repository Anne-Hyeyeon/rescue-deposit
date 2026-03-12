import type {
  ICreditor,
  ITenantWithDates,
  IQueueItem,
  IDistributionRow,
  IStepResult,
  QueueSegment,
  IRelativeSmallResult,
  Region,
  CreditorType,
} from "./types";
import { getSmallTenantThreshold } from "./constants";
import { distributeProRata } from "./utils";

// ===== Queue Building =====

export const isMortgageType = (type: string): boolean =>
  type === "mortgage" || type === "pledge_on_mortgage" || type === "jeonse_right";

export const insertRelativeSmallTenants = (
  queue: ReadonlyArray<IQueueItem>,
  relativeResult: IRelativeSmallResult
): ReadonlyArray<IQueueItem> => {
  if (relativeResult.relativeSmalls.length === 0) return queue;

  // 시행령 개정 구간(periodStart)별로 그룹핑
  const groupsByPeriod = relativeResult.relativeSmalls.reduce<
    ReadonlyMap<string, ReadonlyArray<{ creditorId: string; creditorName: string; priorityAmount: number; periodStart: string }>>
  >((acc, rs) => {
    const existing = acc.get(rs.periodStart) ?? [];
    return new Map([...acc, [rs.periodStart, [...existing, rs]]]);
  }, new Map());

  const sortedPeriods = [...groupsByPeriod.keys()].sort();

  // 각 구간별로, 해당 구간에 해당하는 첫 번째 비담보·비소액 채권자 앞에 삽입
  return sortedPeriods.reduce<ReadonlyArray<IQueueItem>>(
    (currentQueue, periodStart) => {
      const group = groupsByPeriod.get(periodStart)!;
      const rsItems: ReadonlyArray<IQueueItem> = group.map((rs) => ({
        creditorId: rs.creditorId,
        creditorName: rs.creditorName,
        type: "relative_small" as const,
        claimAmount: rs.priorityAmount,
        sortDate: periodStart,
        sortSubOrder: 0.5,
        reason: "상대적소액임차인",
      }));

      // 해당 구간 시작일 이후의 첫 비담보·비소액 항목 앞에 삽입
      const insertIdx = currentQueue.findIndex(
        (item) =>
          !isMortgageType(item.type) &&
          item.type !== "relative_small" &&
          item.sortDate >= periodStart
      );

      if (insertIdx === -1) return [...currentQueue, ...rsItems];

      return [
        ...currentQueue.slice(0, insertIdx),
        ...rsItems,
        ...currentQueue.slice(insertIdx),
      ];
    },
    queue
  );
};

export const buildDistributionQueue = (
  creditors: ReadonlyArray<ICreditor>,
  tenants: ReadonlyArray<ITenantWithDates>,
  absoluteSmallIds: ReadonlySet<string>,
  relativeResult: IRelativeSmallResult,
  region: Region,
  baseRightDate: string
): ReadonlyArray<IQueueItem> => {
  const threshold = getSmallTenantThreshold(region, baseRightDate);
  const tenantsWithPriorityDate = tenants.filter(
    (
      tenant
    ): tenant is ITenantWithDates & { readonly priorityDate: string } =>
      tenant.priorityDate !== null
  );

  // (1) Mortgage, jeonse, pledge_on_mortgage
  const mortgageItems: ReadonlyArray<IQueueItem> = creditors
    .filter(
      (c) =>
        c.type === "mortgage" ||
        c.type === "pledge_on_mortgage" ||
        c.type === "jeonse_right"
    )
    .map((c) => ({
      creditorId: c.id,
      creditorName: c.name,
      type: c.type as CreditorType,
      claimAmount: c.claimAmount,
      sortDate: c.registrationDate!,
      sortSubOrder: 0,
      reason: `${
        c.type === "mortgage"
          ? "근저당권자"
          : c.type === "pledge_on_mortgage"
            ? "근저당권부질권자"
            : "전세권자"
      } (${c.registrationDate})`,
    }));

  // (2) Confirmed date tenants (deduct small tenant portions)
  const tenantItems: ReadonlyArray<IQueueItem> = tenantsWithPriorityDate
    .flatMap((t) => {
      const baseAmount = t.creditor.claimAmount;

      // (a) Absolute small tenant deduction
      const absoluteDeduction = absoluteSmallIds.has(t.creditor.id)
        ? Math.min(
            t.creditor.deposit!,
            threshold.priorityMax
          )
        : 0;

      // (b) Relative small tenant deduction
      const relativeDeduction = relativeResult.relativeSmallIds.has(
        t.creditor.id
      )
        ? relativeResult.relativeSmallAmounts.get(t.creditor.id)!
        : 0;

      const remainingClaim = baseAmount - absoluteDeduction - relativeDeduction;

      if (remainingClaim <= 0) {
        return [];
      }

      return [
        {
          creditorId: t.creditor.id,
          creditorName: t.creditor.name,
          type: "tenant" as const,
          claimAmount: remainingClaim,
          sortDate: t.priorityDate,
          sortSubOrder: 1,
          reason: `확정일자임차인 (${t.priorityDate})`,
        },
      ];
    });

  // (3) Deferred property tax (has tenants with opposabilityDate before legalDate)
  const deferredTaxItems: ReadonlyArray<IQueueItem> = creditors
    .filter((c) => c.type === "property_tax")
    .filter((c) =>
      tenants.some((t) => t.opposabilityDate && t.opposabilityDate < c.legalDate!)
    )
    .map((c) => ({
      creditorId: c.id,
      creditorName: c.name,
      type: c.type as CreditorType,
      claimAmount: c.claimAmount,
      sortDate: c.legalDate!,
      sortSubOrder: 2,
      reason: `당해세 (${c.legalDate})`,
    }));

  // (4) General tax
  const generalTaxItems: ReadonlyArray<IQueueItem> = creditors
    .filter((c) => c.type === "general_tax")
    .map((c) => ({
      creditorId: c.id,
      creditorName: c.name,
      type: c.type as CreditorType,
      claimAmount: c.claimAmount,
      sortDate: c.legalDate!,
      sortSubOrder: 2,
      reason: `조세채권 (${c.legalDate})`,
    }));

  // Sort by date, then sub-order
  const sorted = [
    ...mortgageItems,
    ...tenantItems,
    ...deferredTaxItems,
    ...generalTaxItems,
  ].sort((a, b) => {
    if (a.sortDate !== b.sortDate) return a.sortDate < b.sortDate ? -1 : 1;
    return a.sortSubOrder - b.sortSubOrder;
  });

  // (5) Insert relative small tenants after last mortgage
  return insertRelativeSmallTenants(sorted, relativeResult);
};

// ===== Queue Execution =====

export const segmentQueue = (
  queue: ReadonlyArray<IQueueItem>
): ReadonlyArray<QueueSegment> =>
  queue.reduce<ReadonlyArray<QueueSegment>>((segments, item) => {
    if (item.type !== "relative_small") {
      return [...segments, { kind: "single", item }];
    }

    const last = segments[segments.length - 1];
    if (last && last.kind === "relative_small_group") {
      return [
        ...segments.slice(0, -1),
        { kind: "relative_small_group", items: [...last.items, item] },
      ];
    }

    return [...segments, { kind: "relative_small_group", items: [item] }];
  }, []);

const makeZeroRow = (item: IQueueItem): IDistributionRow => ({
  order: 0,
  creditorId: item.creditorId,
  creditorName: item.creditorName,
  claimAmount: item.claimAmount,
  step: "STEP3",
  rank: 2,
  reason: "잔여액 부족",
  distributionAmount: 0,
  remainingAfter: 0,
  distributionRate: 0,
});

export const processRelativeSmallGroup = (
  group: ReadonlyArray<IQueueItem>,
  state: IStepResult
): IStepResult => {
  const totalGroupClaim = group.reduce((sum, g) => sum + g.claimAmount, 0);

  if (state.remaining >= totalGroupClaim) {
    return group.reduce<IStepResult>(
      (acc, g) => ({
        rows: [
          ...acc.rows,
          {
            order: 0,
            creditorId: g.creditorId,
            creditorName: g.creditorName,
            claimAmount: g.claimAmount,
            step: "STEP3",
            rank: 2,
            reason: g.reason,
            distributionAmount: g.claimAmount,
            remainingAfter: acc.remaining - g.claimAmount,
            distributionRate: 1.0,
          },
        ],
        remaining: acc.remaining - g.claimAmount,
      }),
      state
    );
  }

  // Insufficient: pro rata
  const proRata = distributeProRata(
    group.map((g) => ({ creditorId: g.creditorId, claimAmount: g.claimAmount })),
    state.remaining
  );

  return proRata.reduce<IStepResult>(
    (acc, r) => {
      const g = group.find((x) => x.creditorId === r.creditorId)!;
      return {
        rows: [
          ...acc.rows,
          {
            order: 0,
            creditorId: r.creditorId,
            creditorName: g.creditorName,
            claimAmount: g.claimAmount,
            step: "STEP3",
            rank: 2,
            reason: `${g.reason} (균분)`,
            distributionAmount: r.amount,
            remainingAfter: acc.remaining - r.amount,
            distributionRate: r.amount / g.claimAmount,
          },
        ],
        remaining: acc.remaining - r.amount,
      };
    },
    state
  );
};

export const executeDistribution = (
  queue: ReadonlyArray<IQueueItem>,
  remaining: number
): IStepResult => {
  const segments = segmentQueue(queue);

  return segments.reduce<IStepResult>(
    (acc, segment) => {
      if (acc.remaining <= 0) {
        const zeroRows =
          segment.kind === "relative_small_group"
            ? segment.items.map(makeZeroRow)
            : [makeZeroRow(segment.item)];
        return { rows: [...acc.rows, ...zeroRows], remaining: 0 };
      }

      if (segment.kind === "relative_small_group") {
        return processRelativeSmallGroup(segment.items, acc);
      }

      const amount = Math.min(segment.item.claimAmount, acc.remaining);
      return {
        rows: [
          ...acc.rows,
          {
            order: 0,
            creditorId: segment.item.creditorId,
            creditorName: segment.item.creditorName,
            claimAmount: segment.item.claimAmount,
            step: "STEP3",
            rank: 2,
            reason: segment.item.reason,
            distributionAmount: amount,
            remainingAfter: acc.remaining - amount,
            distributionRate: amount / segment.item.claimAmount,
          },
        ],
        remaining: acc.remaining - amount,
      };
    },
    { rows: [], remaining }
  );
};
