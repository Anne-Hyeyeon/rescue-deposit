import type {
  IDistributionRow,
  IOtherTenant,
  ISimulationInput,
} from "@/types/simulation";

export const formatResultAmount = (amount: number) => amount.toLocaleString("ko-KR");

const trimTrailingZeros = (s: string) => s.replace(/\.?0+$/, "");

export const formatResultAmountShort = (amount: number) => {
  if (amount >= 100_000_000) {
    return `${trimTrailingZeros((amount / 100_000_000).toFixed(1))}억원`;
  }

  if (amount >= 10_000) {
    return `${Math.round(amount / 10_000).toLocaleString("ko-KR")}만원`;
  }

  return `${amount.toLocaleString("ko-KR")}원`;
};

export const formatResultAmountDetail = (amount: number) => {
  if (amount >= 100_000_000) {
    return `${trimTrailingZeros((amount / 100_000_000).toFixed(2))}억원`;
  }

  if (amount >= 10_000) {
    return `${Math.round(amount / 10_000).toLocaleString("ko-KR")}만원`;
  }

  return `${amount.toLocaleString("ko-KR")}원`;
};

export const formatPercentage = (part: number, total: number) =>
  total === 0 ? "0" : ((part / total) * 100).toFixed(1);

export const buildPlaceholderRows = (
  input: ISimulationInput
): IDistributionRow[] => {
  const otherStep1Rows = input.otherTenants
    .filter((otherTenant: IOtherTenant) => otherTenant.deposit > 0)
    .map((otherTenant: IOtherTenant, index: number) => ({
      step: "STEP 1",
      category: "최선순위 소액임차인",
      creditorId: `other_tenant_${index}`,
      creditorName: `다른 세입자 ${index + 1}`,
      claimAmount: otherTenant.deposit,
      distributedAmount: 0,
      remainingPool: 0,
      isMyTenant: false,
      keyDate: otherTenant.opposabilityDate || undefined,
      note: "소액임차인 해당 여부는 엔진 계산 필요",
    }));

  const propertyTaxRows =
    input.propertyTaxOption === "yes" && input.propertyTaxAmount > 0
      ? [
          {
            step: "STEP 2",
            category: "당해세",
            creditorId: "property_tax",
            creditorName: "재산세",
            claimAmount: input.propertyTaxAmount,
            distributedAmount: 0,
            remainingPool: 0,
            isMyTenant: false,
            keyDate: input.propertyTaxLegalDate || undefined,
          },
        ]
      : [];

  const mortgageRows =
    input.mortgageMaxClaim > 0
      ? [
          {
            step: "STEP 3",
            category: "근저당권",
            creditorId: "mortgage_1",
            creditorName: "선순위 근저당",
            claimAmount: input.mortgageMaxClaim,
            distributedAmount: 0,
            remainingPool: 0,
            isMyTenant: false,
            keyDate: input.mortgageRegDate || undefined,
          },
        ]
      : [];

  const otherStep3Rows = input.otherTenants
    .filter(
      (otherTenant: IOtherTenant) =>
        otherTenant.deposit > 0 && otherTenant.opposabilityDate
    )
    .map((otherTenant: IOtherTenant, index: number) => ({
      step: "STEP 3",
      category: "확정일자 임차인",
      creditorId: `other_tenant_step3_${index}`,
      creditorName: `다른 세입자 ${index + 1}`,
      claimAmount: otherTenant.deposit,
      distributedAmount: 0,
      remainingPool: 0,
      isMyTenant: false,
      keyDate: otherTenant.opposabilityDate || undefined,
    }));

  return [
    {
      step: "집행비용",
      category: "집행비용",
      creditorId: "execution_cost",
      creditorName: "집행기관",
      claimAmount: input.executionCost,
      distributedAmount: 0,
      remainingPool: 0,
      isMyTenant: false,
    },
    {
      step: "STEP 1",
      category: "최선순위 소액임차인",
      creditorId: "my_tenant",
      creditorName: "나의 임차권",
      claimAmount: input.myDeposit,
      distributedAmount: 0,
      remainingPool: 0,
      isMyTenant: true,
      keyDate: input.myOpposabilityDate || undefined,
      note: "소액임차인 해당 여부는 엔진 계산 필요",
    },
    ...otherStep1Rows,
    ...propertyTaxRows,
    ...mortgageRows,
    {
      step: "STEP 3",
      category: "확정일자 임차인",
      creditorId: "my_tenant_step3",
      creditorName: "나의 임차권",
      claimAmount: input.myDeposit,
      distributedAmount: 0,
      remainingPool: 0,
      isMyTenant: true,
      keyDate: input.myOpposabilityDate || undefined,
    },
    ...otherStep3Rows,
  ];
};

export const categoryColors: Record<string, string> = {
  "집행비용": "bg-[#f7f7f5] text-[#787774] dark:bg-[#373737] dark:text-[#9b9b9b]",
  "최선순위 소액임차인":
    "bg-[#edf4f8] text-[#2474a0] dark:bg-[#28456c] dark:text-[#9ec5e0]",
  "상대적 소액임차인":
    "bg-[#f3eef7] text-[#6940a5] dark:bg-[#432b6b] dark:text-[#c5aee0]",
  "당해세": "bg-[#fdf5e3] text-[#9a6700] dark:bg-[#564328] dark:text-[#e8c469]",
  "담보물권": "bg-[#fff0ee] text-[#c4554d] dark:bg-[#6e3b36] dark:text-[#e8a39a]",
  "확정일자 임차인":
    "bg-[#eef6ee] text-[#2b7d2f] dark:bg-[#2b593f] dark:text-[#a5cba5]",
  "임금채권": "bg-[#faf0f4] text-[#a84073] dark:bg-[#5a2d48] dark:text-[#dba1be]",
  "조세채권": "bg-[#fdf1e4] text-[#b65c1e] dark:bg-[#5c3a1e] dark:text-[#dba67a]",
  "공과금": "bg-[#eef4f8] text-[#2878a0] dark:bg-[#243d53] dark:text-[#8fbdd4]",
  "일반채권": "bg-[#f3f3f1] text-[#6b6b69] dark:bg-[#3a3a3a] dark:text-[#9b9b9b]",
  "배당 불가": "bg-[#f3f3f1] text-[#6b6b69] dark:bg-[#3a3a3a] dark:text-[#9b9b9b]",
  "근저당권": "bg-[#fff0ee] text-[#c4554d] dark:bg-[#6e3b36] dark:text-[#e8a39a]",
};

export const categoryWrap: Record<string, readonly [string, string]> = {
  "최선순위 소액임차인": ["최선순위", "소액임차인"],
  "상대적 소액임차인": ["상대적", "소액임차인"],
  "확정일자 임차인": ["확정일자", "임차인"],
};
