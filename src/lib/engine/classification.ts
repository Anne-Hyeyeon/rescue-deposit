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
  // 모든 임차인을 대항력 발생일 순으로 정렬 → 구간 변경 트리거로 사용
  const sortedTenants = [...tenants]
    .filter((t) => t.opposabilityDate)
    .sort((a, b) => a.opposabilityDate.localeCompare(b.opposabilityDate));

  // 분류 대상: 절대적 소액이 아닌, 근저당 후순위, 보증금 있는 임차인
  const candidates = tenants
    .filter((t) => !absoluteSmallIds.has(t.creditor.id))
    .filter((t) => t.creditor.deposit !== undefined)
    .filter((t) => t.opposabilityDate > baseRightDate);

  const basePeriodStart = findPeriodStart(baseRightDate);
  let currentPeriodStart = basePeriodStart;

  const relativeSmalls: IRelativeSmallTenantInfo[] = [];
  const ids = new Set<string>();
  const amounts = new Map<string, number>();

  // 대항력 발생일 순으로 세입자를 순회하며 구간 변경 감지
  for (const tenant of sortedTenants) {
    const tenantPeriodStart = findPeriodStart(tenant.opposabilityDate);

    // 같은 구간이면 패스
    if (tenantPeriodStart <= currentPeriodStart) continue;

    // 새 구간 진입 → 해당 구간 기준으로 미분류 임차인 중 소액 분류
    currentPeriodStart = tenantPeriodStart;
    const threshold = getSmallTenantThreshold(region, tenantPeriodStart);

    for (const candidate of candidates) {
      if (ids.has(candidate.creditor.id)) continue;
      if (candidate.creditor.deposit! > threshold.depositMax) continue;
      // 이미 배당 순서가 지난 세입자는 상대적 소액임차인으로 분류하지 않음
      // (확정일자가 해당 구간 시작일보다 앞이면 이미 배당받으므로 제외)
      if (candidate.priorityDate && candidate.priorityDate < tenantPeriodStart) continue;

      const priorityAmount = Math.min(candidate.creditor.deposit!, threshold.priorityMax);
      relativeSmalls.push({
        creditorId: candidate.creditor.id,
        creditorName: candidate.creditor.name,
        deposit: candidate.creditor.deposit!,
        priorityAmount,
        periodStart: tenantPeriodStart,
      });
      ids.add(candidate.creditor.id);
      amounts.set(candidate.creditor.id, priorityAmount);
    }
  }

  return {
    relativeSmalls,
    relativeSmallIds: ids,
    relativeSmallAmounts: amounts,
  };
};
