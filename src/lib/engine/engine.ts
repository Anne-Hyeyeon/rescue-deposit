import type {
  IAuctionCase,
  ICreditor,
  IStepResult,
  ITenantWithDates,
  IAbsoluteSmallTenant,
  IRelativeSmallTenantInfo,
  IRelativeSmallResult,
  IQueueItem,
  IDistributionRow,
  IDistributionResult,
  Region,
  QueueSegment,
} from "./types";
import {
  getSmallTenantThreshold,
  findPeriodStart,
  SMALL_TENANT_TABLE,
  OVERCROWDED_CITIES,
  OVERCROWDED_ADDITIONAL,
  METROPOLITAN_ADDITIONAL,
  METROPOLITAN_BASE_CITIES,
} from "./constants";

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
    i === results.length - 1 ? { ...r, amount: r.amount + remainder } : r
  );
};

export const getNextDay = (date: string): string => {
  const d = new Date(date + "T00:00:00");
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
};

export const maxDate = (date1: string, date2: string): string =>
  date1 >= date2 ? date1 : date2;

// ===== Region Resolution =====

const extractCity = (address: string): string => {
  if (address.includes("서울") || address.startsWith("서울")) return "서울특별시";
  if (address.includes("세종특별자치시") || address.startsWith("세종")) return "세종특별자치시";

  const metroMatch = address.match(
    /(부산|대구|인천|대전|광주|울산)(?:광역시)?/
  );
  if (metroMatch) {
    return `${metroMatch[1]}광역시`;
  }

  const cityMatch = address.match(/(?:경기도\s+)?(\S+?시)/);
  if (cityMatch) return cityMatch[1];

  return address;
};

const isGunArea = (address: string): boolean => {
  const gunMatch = address.match(/([가-힣]+군)/);
  if (!gunMatch) return false;
  const gunNames = ["기장군", "달성군", "울주군", "강화군", "옹진군"];
  return gunNames.some((g) => address.includes(g));
};

export const resolveRegion = (
  address: string,
  referenceDate: string
): Region => {
  const city = extractCity(address);

  // 1. Seoul
  if (city === "서울특별시" || city.startsWith("서울")) return "seoul";

  // 2. Overcrowded (base list)
  if (
    (OVERCROWDED_CITIES as ReadonlyArray<string>).includes(city)
  )
    return "overcrowded";

  // 3. Overcrowded (period-specific additions)
  const period = findPeriodStart(referenceDate);
  const overcrowdedAdditional = OVERCROWDED_ADDITIONAL[period];
  if (overcrowdedAdditional && overcrowdedAdditional.includes(city))
    return "overcrowded";

  // 4. Metropolitan base cities (exclude gun areas)
  const matchedMetro = METROPOLITAN_BASE_CITIES.find((m) =>
    city.startsWith(m.replace("광역시", ""))
  );
  if (matchedMetro) {
    return isGunArea(address) ? "others" : "metropolitan";
  }

  // 5. Metropolitan additional cities (period-specific)
  const metropolitanAdditional = METROPOLITAN_ADDITIONAL[period];
  if (metropolitanAdditional && metropolitanAdditional.includes(city))
    return "metropolitan";

  // 6. Others
  return "others";
};

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

// ===== Classification =====

export const classifyAbsoluteSmallTenants = (
  tenants: ReadonlyArray<ITenantWithDates>,
  region: Region,
  baseRightDate: string
): ReadonlyArray<IAbsoluteSmallTenant> => {
  const threshold = getSmallTenantThreshold(region, baseRightDate);

  return tenants
    .filter(
      (t) =>
        t.creditor.deposit !== undefined &&
        t.creditor.deposit <= threshold.depositMax &&
        t.opposabilityDate
    )
    .map((t) => ({
      tenant: t,
      priorityAmount: Math.min(t.creditor.deposit!, threshold.priorityMax),
    }));
};

export const identifyRelativeSmallTenants = (
  tenants: ReadonlyArray<ITenantWithDates>,
  absoluteSmallIds: ReadonlySet<string>,
  region: Region,
  baseRightDate: string
): IRelativeSmallResult => {
  // 절대적 소액임차인을 제외한, 근저당 이후(후순위) 보증금 있는 임차인
  // 선순위 임차인(대항력 발생일 < baseRightDate)은 이미 근저당보다 앞서므로 대상 아님
  const candidates = tenants
    .filter((t) => !absoluteSmallIds.has(t.creditor.id))
    .filter((t) => t.creditor.deposit !== undefined)
    .filter((t) => t.opposabilityDate > baseRightDate);

  // baseRightDate 구간 이후의 시행령 구간을 순회
  // 임차인의 대항력 발생일이 아니라, 시행령 개정 구간별로 보증금만 대조
  const basePeriodStart = findPeriodStart(baseRightDate);
  const subsequentPeriods = SMALL_TENANT_TABLE
    .map((t) => t.periodStart)
    .filter((ps) => ps > basePeriodStart)
    .sort();

  // 각 구간마다: 아직 미분류 임차인 중 deposit ≤ depositMax → 상대적 소액임차인
  const accumulated = subsequentPeriods.reduce<{
    readonly relativeSmalls: ReadonlyArray<IRelativeSmallTenantInfo>;
    readonly ids: ReadonlySet<string>;
    readonly amounts: ReadonlyMap<string, number>;
  }>(
    (acc, periodStart) => {
      const threshold = getSmallTenantThreshold(region, periodStart);

      const newSmalls = candidates
        .filter((t) => !acc.ids.has(t.creditor.id))
        .filter((t) => t.creditor.deposit! <= threshold.depositMax);

      if (newSmalls.length === 0) return acc;

      const newInfos: ReadonlyArray<IRelativeSmallTenantInfo> = newSmalls.map(
        (t) => ({
          creditorId: t.creditor.id,
          creditorName: t.creditor.name,
          deposit: t.creditor.deposit!,
          priorityAmount: Math.min(t.creditor.deposit!, threshold.priorityMax),
          periodStart,
        })
      );

      return {
        relativeSmalls: [...acc.relativeSmalls, ...newInfos],
        ids: new Set([...acc.ids, ...newSmalls.map((t) => t.creditor.id)]),
        amounts: new Map([
          ...acc.amounts,
          ...newSmalls.map(
            (t) =>
              [
                t.creditor.id,
                Math.min(t.creditor.deposit!, threshold.priorityMax),
              ] as [string, number]
          ),
        ]),
      };
    },
    { relativeSmalls: [], ids: new Set(), amounts: new Map() }
  );

  return {
    relativeSmalls: accumulated.relativeSmalls,
    relativeSmallIds: accumulated.ids,
    relativeSmallAmounts: accumulated.amounts,
  };
};

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

// ===== STEP 3: Date Competition =====

export const isMortgageType = (type: string): boolean =>
  type === "mortgage" || type === "pledge_on_mortgage" || type === "jeonse_right";

export const insertRelativeSmallTenants = (
  queue: ReadonlyArray<IQueueItem>,
  relativeResult: IRelativeSmallResult
): ReadonlyArray<IQueueItem> => {
  if (relativeResult.relativeSmalls.length === 0) return queue;

  // 시행령 개정 구간(periodStart)별로 그룹핑
  const groupsByPeriod = relativeResult.relativeSmalls.reduce<
    ReadonlyMap<string, ReadonlyArray<IRelativeSmallTenantInfo>>
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
      type: c.type,
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
  const tenantItems: ReadonlyArray<IQueueItem> = tenants
    .filter((t) => t.priorityDate !== null)
    .map((t) => {
      const baseAmount = t.creditor.claimAmount;

      // (a) Absolute small tenant deduction
      const absoluteDeduction = absoluteSmallIds.has(t.creditor.id)
        ? Math.min(
            t.creditor.deposit!,
            getSmallTenantThreshold(region, baseRightDate).priorityMax
          )
        : 0;

      // (b) Relative small tenant deduction
      const relativeDeduction = relativeResult.relativeSmallIds.has(
        t.creditor.id
      )
        ? relativeResult.relativeSmallAmounts.get(t.creditor.id)!
        : 0;

      const remainingClaim = baseAmount - absoluteDeduction - relativeDeduction;

      if (remainingClaim <= 0) return null as unknown as IQueueItem;

      return {
        creditorId: t.creditor.id,
        creditorName: t.creditor.name,
        type: "tenant" as const,
        claimAmount: remainingClaim,
        sortDate: t.priorityDate!,
        sortSubOrder: 1,
        reason: `확정일자임차인 (${t.priorityDate})`,
      };
    })
    .filter((item) => item !== null);

  // (3) Deferred property tax (has tenants with opposabilityDate before legalDate)
  const deferredTaxItems: ReadonlyArray<IQueueItem> = creditors
    .filter((c) => c.type === "property_tax")
    .filter((c) =>
      tenants.some((t) => t.opposabilityDate && t.opposabilityDate < c.legalDate!)
    )
    .map((c) => ({
      creditorId: c.id,
      creditorName: c.name,
      type: c.type,
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
      type: c.type,
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

// ===== Main Function =====

export const calculateDistribution = (
  auctionCase: IAuctionCase,
  creditors: ReadonlyArray<ICreditor>
): IDistributionResult => {
  // Step 0: Basic calculations
  const totalFund =
    auctionCase.salePrice +
    auctionCase.saleInterest +
    auctionCase.delayInterest +
    auctionCase.priorDeposit +
    auctionCase.appealDeposit;

  const initialRemaining = totalFund - auctionCase.executionCost;
  const halfOfPropertyValue = Math.floor(initialRemaining / 2);

  // Resolve region
  const region = auctionCase.address
    ? resolveRegion(auctionCase.address, auctionCase.baseRightDate)
    : auctionCase.region!;

  // Preprocess subrogation
  const preprocessed = preprocessSubrogation(creditors);

  // Compute tenant dates (no classification yet)
  const tenants = computeTenantDates(preprocessed);

  // Classify absolute small tenants
  const absoluteSmalls = classifyAbsoluteSmallTenants(
    tenants,
    region,
    auctionCase.baseRightDate
  );

  // STEP 1-7: reduce pipeline
  const steps = [
    (state: IStepResult) =>
      step1AbsolutePriority(
        absoluteSmalls,
        preprocessed,
        state.remaining,
        halfOfPropertyValue
      ),
    (state: IStepResult) =>
      step2PropertyTax(preprocessed, tenants, state.remaining),
    (state: IStepResult) =>
      step3DateCompetition(
        preprocessed,
        tenants,
        absoluteSmalls,
        state.remaining,
        region,
        auctionCase.baseRightDate
      ),
    (state: IStepResult) =>
      step4To7LowerPriority(preprocessed, state.remaining),
  ] as const;

  const finalResult = steps.reduce<IStepResult>(
    (acc, stepFn) => {
      const result = stepFn(acc);
      return {
        rows: [...acc.rows, ...result.rows],
        remaining: result.remaining,
      };
    },
    { rows: [], remaining: initialRemaining }
  );

  // Re-number rows
  const rows = finalResult.rows.map((row, i) => ({ ...row, order: i + 1 }));

  return {
    totalFund,
    executionCost: auctionCase.executionCost,
    distributableFund: initialRemaining,
    halfOfPropertyValue,
    rows,
    remainder: finalResult.remaining,
  };
};
