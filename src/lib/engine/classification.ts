import type {
  ITenantWithDates,
  IAbsoluteSmallTenant,
  IRelativeSmallTenantInfo,
  IRelativeSmallResult,
  Region,
} from "./types";
import {
  getSmallTenantThreshold,
  findPeriodStart,
  SMALL_TENANT_TABLE,
} from "./constants";

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
