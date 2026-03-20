import { calculateDistribution } from "../index";
import type { IAuctionCase, ICreditor } from "../types";

// Helper: convert moveInDate + confirmedDate to opposabilityDate
// opposabilityDate = max(moveInDate + 1 day, confirmedDate)
const toOpposabilityDate = (moveInDate: string, confirmedDate: string): string => {
  const d = new Date(moveInDate + "T00:00:00");
  d.setDate(d.getDate() + 1);
  const nextDay = d.toISOString().split("T")[0];
  return nextDay >= confirmedDate ? nextDay : confirmedDate;
};

describe("Test 1: Basic — senior tenant full distribution", () => {
  const auctionCase: IAuctionCase = {
    salePrice: 500_000_000,
    saleInterest: 0, delayInterest: 0, priorDeposit: 0, appealDeposit: 0,
    executionCost: 8_000_000,
    region: "seoul",
    baseRightDate: "2020-06-01",
  };

  const creditors: ReadonlyArray<ICreditor> = [
    {
      id: "tenant_A", name: "임차인A", type: "tenant",
      claimAmount: 150_000_000,
      opposabilityDate: toOpposabilityDate("2020-03-14", "2020-03-14"),
      deposit: 150_000_000,
    },
    {
      id: "bank", name: "○○은행", type: "mortgage",
      claimAmount: 300_000_000,
      registrationDate: "2020-06-01",
      maxClaimAmount: 300_000_000,
    },
  ];

  it("should distribute correctly", () => {
    const result = calculateDistribution(auctionCase, creditors);

    expect(result.distributableFund).toBe(492_000_000);
    expect(result.rows).toHaveLength(2);

    expect(result.rows[0].creditorName).toBe("임차인A");
    expect(result.rows[0].step).toBe("STEP3");
    expect(result.rows[0].distributionAmount).toBe(150_000_000);
    expect(result.rows[0].distributionRate).toBeCloseTo(1.0);

    expect(result.rows[1].creditorName).toBe("○○은행");
    expect(result.rows[1].step).toBe("STEP3");
    expect(result.rows[1].distributionAmount).toBe(300_000_000);
    expect(result.rows[1].distributionRate).toBeCloseTo(1.0);

    expect(result.remainder).toBe(42_000_000);
  });
});

describe("Test 2: Junior tenant — partial distribution", () => {
  const auctionCase: IAuctionCase = {
    salePrice: 400_000_000,
    saleInterest: 0, delayInterest: 0, priorDeposit: 0, appealDeposit: 0,
    executionCost: 9_000_000,
    region: "seoul",
    baseRightDate: "2019-05-10",
  };

  const creditors: ReadonlyArray<ICreditor> = [
    {
      id: "bank", name: "○○은행", type: "mortgage",
      claimAmount: 300_000_000,
      registrationDate: "2019-05-10",
      maxClaimAmount: 300_000_000,
    },
    {
      id: "tenant_B", name: "임차인B", type: "tenant",
      claimAmount: 150_000_000,
      opposabilityDate: toOpposabilityDate("2021-08-19", "2021-08-20"),
      deposit: 150_000_000,
    },
  ];

  it("should distribute correctly", () => {
    const result = calculateDistribution(auctionCase, creditors);

    expect(result.distributableFund).toBe(391_000_000);

    // 임차인B's opposabilityDate 2021-08-20 → period 2021.05.11~2023.02.20
    // seoul: depositMax=150M → 150M <= 150M → relative small tenant (priorityAmount=50M)
    // So: bank(300M) → relative small(50M) → confirmed date remainder(100M)

    expect(result.rows[0].creditorName).toBe("○○은행");
    expect(result.rows[0].step).toBe("STEP3");
    expect(result.rows[0].distributionAmount).toBe(300_000_000);

    // Relative small: min(50M, 91M) = 50M
    expect(result.rows[1].creditorName).toBe("임차인B");
    expect(result.rows[1].step).toBe("STEP3");
    expect(result.rows[1].distributionAmount).toBe(50_000_000);

    // Confirmed date remainder: min(100M, 41M) = 41M
    expect(result.rows[2].creditorName).toBe("임차인B");
    expect(result.rows[2].step).toBe("STEP3");
    expect(result.rows[2].distributionAmount).toBe(41_000_000);

    // Total tenant B: 50M + 41M = 91M ✓
    const tenantBTotal = result.rows
      .filter((r) => r.creditorId === "tenant_B")
      .reduce((sum, r) => sum + r.distributionAmount, 0);
    expect(tenantBTotal).toBe(91_000_000);

    expect(result.remainder).toBe(0);
  });
});

describe("Test 3: Small tenant — absolute priority", () => {
  const auctionCase: IAuctionCase = {
    salePrice: 300_000_000,
    saleInterest: 0, delayInterest: 0, priorDeposit: 0, appealDeposit: 0,
    executionCost: 7_000_000,
    region: "seoul",
    baseRightDate: "2022-01-15",
  };

  const creditors: ReadonlyArray<ICreditor> = [
    {
      id: "bank", name: "○○은행", type: "mortgage",
      claimAmount: 250_000_000,
      registrationDate: "2022-01-15",
      maxClaimAmount: 250_000_000,
    },
    {
      id: "tenant_C", name: "임차인C", type: "tenant",
      claimAmount: 140_000_000,
      opposabilityDate: toOpposabilityDate("2022-06-01", "2022-06-01"),
      deposit: 140_000_000,
    },
  ];

  it("should distribute correctly", () => {
    const result = calculateDistribution(auctionCase, creditors);

    expect(result.distributableFund).toBe(293_000_000);
    expect(result.halfOfPropertyValue).toBe(146_500_000);

    // STEP1: small tenant priority
    expect(result.rows[0].creditorName).toBe("임차인C");
    expect(result.rows[0].step).toBe("STEP1");
    expect(result.rows[0].distributionAmount).toBe(50_000_000);

    // STEP3: bank
    expect(result.rows[1].creditorName).toBe("○○은행");
    expect(result.rows[1].step).toBe("STEP3");
    expect(result.rows[1].distributionAmount).toBe(243_000_000);

    // STEP3: tenant C remainder (140M - 50M = 90M, but remaining = 0)
    expect(result.rows[2].creditorName).toBe("임차인C");
    expect(result.rows[2].step).toBe("STEP3");
    expect(result.rows[2].distributionAmount).toBe(0);

    expect(result.remainder).toBe(0);
  });
});

describe("Test 4: Multiple small tenants — 1/2 limit exceeded", () => {
  const auctionCase: IAuctionCase = {
    salePrice: 200_000_000,
    saleInterest: 0, delayInterest: 0, priorDeposit: 0, appealDeposit: 0,
    executionCost: 6_000_000,
    region: "seoul",
    baseRightDate: "2023-06-01",
  };

  const creditors: ReadonlyArray<ICreditor> = [
    {
      id: "bank", name: "○○은행", type: "mortgage",
      claimAmount: 150_000_000,
      registrationDate: "2023-06-01",
      maxClaimAmount: 150_000_000,
    },
    {
      id: "tenant_D", name: "임차인D", type: "tenant",
      claimAmount: 150_000_000,
      opposabilityDate: toOpposabilityDate("2023-07-01", "2023-07-01"),
      deposit: 150_000_000,
    },
    {
      id: "tenant_E", name: "임차인E", type: "tenant",
      claimAmount: 120_000_000,
      opposabilityDate: toOpposabilityDate("2023-08-01", "2023-08-01"),
      deposit: 120_000_000,
    },
    {
      id: "tenant_F", name: "임차인F", type: "tenant",
      claimAmount: 100_000_000,
      opposabilityDate: toOpposabilityDate("2023-09-01", "2023-09-01"),
      deposit: 100_000_000,
    },
  ];

  it("should apply 1/2 limit and pro rata", () => {
    const result = calculateDistribution(auctionCase, creditors);

    expect(result.distributableFund).toBe(194_000_000);
    expect(result.halfOfPropertyValue).toBe(97_000_000);

    // STEP1: 3 small tenants, each 55M priority, total 165M > 97M (half limit)
    // Pro rata: 97M * (55/165) = 32,333,333 each, last gets +1
    const step1Rows = result.rows.filter((r) => r.step === "STEP1");
    expect(step1Rows).toHaveLength(3);

    const step1Total = step1Rows.reduce((sum, r) => sum + r.distributionAmount, 0);
    expect(step1Total).toBe(97_000_000);

    expect(step1Rows[0].distributionAmount).toBe(32_333_334);
    expect(step1Rows[1].distributionAmount).toBe(32_333_333);
    expect(step1Rows[2].distributionAmount).toBe(32_333_333);
  });
});

describe("Test 5: Region-specific — Yongin metropolitan period", () => {
  const auctionCase: IAuctionCase = {
    salePrice: 300_000_000,
    saleInterest: 0, delayInterest: 0, priorDeposit: 0, appealDeposit: 0,
    executionCost: 7_000_000,
    address: "경기도 용인시 수지구 죽전동",
    baseRightDate: "2020-03-01",
  };

  const creditors: ReadonlyArray<ICreditor> = [
    {
      id: "bank", name: "○○은행", type: "mortgage",
      claimAmount: 200_000_000,
      registrationDate: "2020-03-01",
      maxClaimAmount: 200_000_000,
    },
    {
      id: "tenant_G", name: "임차인G", type: "tenant",
      claimAmount: 55_000_000,
      opposabilityDate: toOpposabilityDate("2020-06-01", "2020-06-01"),
      deposit: 55_000_000,
    },
  ];

  it("should resolve region as metropolitan and distribute correctly", () => {
    const result = calculateDistribution(auctionCase, creditors);

    // Yongin in 2020 = metropolitan
    // metropolitan 2018.09.18~2021.05.10: depositMax=60M, priorityMax=20M
    // 55M <= 60M => small tenant, priority 20M

    expect(result.rows[0].creditorName).toBe("임차인G");
    expect(result.rows[0].step).toBe("STEP1");
    expect(result.rows[0].distributionAmount).toBe(20_000_000);

    expect(result.rows[1].creditorName).toBe("○○은행");
    expect(result.rows[1].step).toBe("STEP3");
    expect(result.rows[1].distributionAmount).toBe(200_000_000);

    expect(result.rows[2].creditorName).toBe("임차인G");
    expect(result.rows[2].step).toBe("STEP3");
    expect(result.rows[2].distributionAmount).toBe(35_000_000);

    expect(result.remainder).toBe(38_000_000);
  });
});

describe("Test 6: Yongin region change — same city, different period", () => {
  const auctionCase: IAuctionCase = {
    salePrice: 300_000_000,
    saleInterest: 0, delayInterest: 0, priorDeposit: 0, appealDeposit: 0,
    executionCost: 7_000_000,
    address: "경기도 용인시 수지구 죽전동",
    baseRightDate: "2022-03-01",
  };

  const creditors: ReadonlyArray<ICreditor> = [
    {
      id: "bank", name: "○○은행", type: "mortgage",
      claimAmount: 200_000_000,
      registrationDate: "2022-03-01",
      maxClaimAmount: 200_000_000,
    },
    {
      id: "tenant_G", name: "임차인G", type: "tenant",
      claimAmount: 55_000_000,
      opposabilityDate: toOpposabilityDate("2022-06-01", "2022-06-01"),
      deposit: 55_000_000,
    },
  ];

  it("should resolve region as overcrowded and distribute correctly", () => {
    const result = calculateDistribution(auctionCase, creditors);

    // Yongin in 2022 = overcrowded
    // overcrowded 2021.05.11~2023.02.20: depositMax=130M, priorityMax=43M
    // 55M <= 130M => small tenant, priority 43M

    expect(result.rows[0].creditorName).toBe("임차인G");
    expect(result.rows[0].step).toBe("STEP1");
    expect(result.rows[0].distributionAmount).toBe(43_000_000);
  });
});

describe("Test 7: Property tax — 2023.04.01 reform", () => {
  const auctionCase: IAuctionCase = {
    salePrice: 600_000_000,
    saleInterest: 0, delayInterest: 0, priorDeposit: 0, appealDeposit: 0,
    executionCost: 10_000_000,
    region: "seoul",
    baseRightDate: "2020-03-01",
  };

  const creditors: ReadonlyArray<ICreditor> = [
    {
      id: "bank", name: "○○은행", type: "mortgage",
      claimAmount: 300_000_000,
      registrationDate: "2020-03-01",
      maxClaimAmount: 300_000_000,
    },
    {
      id: "tenant_M", name: "임차인M", type: "tenant",
      claimAmount: 200_000_000,
      opposabilityDate: toOpposabilityDate("2021-06-14", "2021-06-15"),
      deposit: 200_000_000,
    },
    {
      id: "tax_inheritance", name: "세무서(상속세)", type: "property_tax",
      claimAmount: 150_000_000,
      legalDate: "2022-04-01",
    },
  ];

  it("should defer property tax to STEP3 when tenant has earlier opposabilityDate", () => {
    const result = calculateDistribution(auctionCase, creditors);

    expect(result.distributableFund).toBe(590_000_000);

    // No STEP2 rows (tax deferred)
    const step2Rows = result.rows.filter((r) => r.step === "STEP2");
    expect(step2Rows).toHaveLength(0);

    // STEP3: bank -> tenant M -> tax
    expect(result.rows[0].creditorName).toBe("○○은행");
    expect(result.rows[0].step).toBe("STEP3");
    expect(result.rows[0].distributionAmount).toBe(300_000_000);

    expect(result.rows[1].creditorName).toBe("임차인M");
    expect(result.rows[1].step).toBe("STEP3");
    expect(result.rows[1].distributionAmount).toBe(200_000_000);

    expect(result.rows[2].creditorName).toBe("세무서(상속세)");
    expect(result.rows[2].step).toBe("STEP3");
    expect(result.rows[2].distributionAmount).toBe(90_000_000);

    expect(result.remainder).toBe(0);
  });
});

describe("Test 8: Subrogation — insurance company", () => {
  const auctionCase: IAuctionCase = {
    salePrice: 500_000_000,
    saleInterest: 0, delayInterest: 0, priorDeposit: 0, appealDeposit: 0,
    executionCost: 9_000_000,
    region: "seoul",
    baseRightDate: "2019-08-01",
  };

  const creditors: ReadonlyArray<ICreditor> = [
    {
      id: "bank", name: "○○은행", type: "mortgage",
      claimAmount: 250_000_000,
      registrationDate: "2019-08-01",
      maxClaimAmount: 250_000_000,
    },
    {
      id: "insurance", name: "서울보증보험(임차인N 대위)", type: "tenant",
      claimAmount: 110_000_000,
      opposabilityDate: toOpposabilityDate("2019-03-14", "2019-03-15"),
      deposit: 150_000_000,
      isSubrogation: true,
      originalTenantId: "tenant_N",
    },
    {
      id: "tenant_N", name: "임차인N", type: "tenant",
      claimAmount: 40_000_000,
      opposabilityDate: toOpposabilityDate("2019-03-14", "2019-03-15"),
      deposit: 150_000_000,
    },
  ];

  it("should distribute correctly with subrogation", () => {
    const result = calculateDistribution(auctionCase, creditors);

    expect(result.distributableFund).toBe(491_000_000);

    // Both insurance and tenant_N have priority date 03.15, before mortgage 08.01
    expect(result.rows[0].creditorName).toBe("서울보증보험(임차인N 대위)");
    expect(result.rows[0].step).toBe("STEP3");
    expect(result.rows[0].distributionAmount).toBe(110_000_000);

    expect(result.rows[1].creditorName).toBe("임차인N");
    expect(result.rows[1].step).toBe("STEP3");
    expect(result.rows[1].distributionAmount).toBe(40_000_000);

    expect(result.rows[2].creditorName).toBe("○○은행");
    expect(result.rows[2].step).toBe("STEP3");
    expect(result.rows[2].distributionAmount).toBe(250_000_000);

    expect(result.remainder).toBe(91_000_000);
  });
});

describe("Test 9: Different moveIn and confirmedDate", () => {
  const auctionCase: IAuctionCase = {
    salePrice: 400_000_000,
    saleInterest: 0, delayInterest: 0, priorDeposit: 0, appealDeposit: 0,
    executionCost: 8_000_000,
    region: "seoul",
    baseRightDate: "2020-06-01",
  };

  // 임차인O: moveIn 05.01 -> 대항력 05.02, confirmedDate 07.15
  //   opposabilityDate = max(05.02, 07.15) = 07.15
  // 임차인P: moveIn 06.15 -> 대항력 06.16, confirmedDate 06.15
  //   opposabilityDate = max(06.16, 06.15) = 06.16

  const creditors: ReadonlyArray<ICreditor> = [
    {
      id: "tenant_O", name: "임차인O", type: "tenant",
      claimAmount: 150_000_000,
      opposabilityDate: toOpposabilityDate("2020-05-01", "2020-07-15"),
      deposit: 150_000_000,
    },
    {
      id: "bank", name: "○○은행", type: "mortgage",
      claimAmount: 250_000_000,
      registrationDate: "2020-06-01",
      maxClaimAmount: 250_000_000,
    },
    {
      id: "tenant_P", name: "임차인P", type: "tenant",
      claimAmount: 100_000_000,
      opposabilityDate: toOpposabilityDate("2020-06-15", "2020-06-15"),
      deposit: 100_000_000,
    },
  ];

  it("should handle different move-in and confirmed dates", () => {
    const result = calculateDistribution(auctionCase, creditors);

    expect(result.distributableFund).toBe(392_000_000);

    // 임차인P: deposit 100M, baseRightDate 2020.06.01 -> 2018.09.18~2021.05.10
    // seoul: depositMax=110M -> 100M <= 110M -> absolute small tenant, priorityMax=37M
    expect(result.rows[0].creditorName).toBe("임차인P");
    expect(result.rows[0].step).toBe("STEP1");
    expect(result.rows[0].distributionAmount).toBe(37_000_000);

    // STEP3: bank (06.01) -> tenant P remainder (06.16) -> tenant O (07.15)
    expect(result.rows[1].creditorName).toBe("○○은행");
    expect(result.rows[1].step).toBe("STEP3");
    expect(result.rows[1].distributionAmount).toBe(250_000_000);

    // 임차인P remainder: 100M - 37M = 63M
    expect(result.rows[2].creditorName).toBe("임차인P");
    expect(result.rows[2].step).toBe("STEP3");
    expect(result.rows[2].distributionAmount).toBe(63_000_000);

    // 임차인O: remaining = 392M - 37M - 250M - 63M = 42M < 150M
    expect(result.rows[3].creditorName).toBe("임차인O");
    expect(result.rows[3].step).toBe("STEP3");
    expect(result.rows[3].distributionAmount).toBe(42_000_000);

    expect(result.remainder).toBe(0);
  });
});

describe("Test 10: Real case — 2023타경5053", () => {
  const auctionCase: IAuctionCase = {
    salePrice: 1_784_756_000,
    saleInterest: 709_450,
    delayInterest: 0,
    priorDeposit: 0,
    appealDeposit: 0,
    executionCost: 9_811_568,
    region: "seoul",
    baseRightDate: "2017-12-04",
  };

  const creditors: ReadonlyArray<ICreditor> = [
    // Mortgage
    {
      id: "mortgage", name: "웰컴저축은행", type: "pledge_on_mortgage",
      claimAmount: 784_560_000,
      registrationDate: "2017-12-04",
    },
    // 17 tenants (opposabilityDate directly provided)
    { id: "t01", name: "서○○", type: "tenant", claimAmount: 150_000_000, opposabilityDate: "2019-12-02", deposit: 150_000_000 },
    { id: "t02", name: "노○○", type: "tenant", claimAmount: 300_000_000, opposabilityDate: "2019-12-27", deposit: 300_000_000 },
    { id: "t03", name: "LH(서○○)", type: "tenant", claimAmount: 110_000_000, opposabilityDate: "2020-01-07", deposit: 110_000_000 },
    { id: "t04", name: "김○○", type: "tenant", claimAmount: 160_000_000, opposabilityDate: "2020-08-24", deposit: 160_000_000 },
    { id: "t05", name: "나○○", type: "tenant", claimAmount: 100_000_000, opposabilityDate: "2021-01-13", deposit: 100_000_000 },
    { id: "t06", name: "김○○", type: "tenant", claimAmount: 150_000_000, opposabilityDate: "2021-06-04", deposit: 150_000_000 },
    { id: "t07", name: "LH(양○○)", type: "tenant", claimAmount: 120_000_000, opposabilityDate: "2021-08-13", deposit: 120_000_000 },
    { id: "t08", name: "LH(이○○)", type: "tenant", claimAmount: 120_000_000, opposabilityDate: "2021-08-23", deposit: 120_000_000 },
    { id: "t09", name: "박○○", type: "tenant", claimAmount: 120_000_000, opposabilityDate: "2021-12-29", deposit: 120_000_000 },
    { id: "t10", name: "박○○", type: "tenant", claimAmount: 120_000_000, opposabilityDate: "2021-12-31", deposit: 120_000_000 },
    { id: "t11", name: "LH(임○○)", type: "tenant", claimAmount: 100_000_000, opposabilityDate: "2022-02-08", deposit: 100_000_000 },
    { id: "t12", name: "LH(우○○)", type: "tenant", claimAmount: 130_000_000, opposabilityDate: "2022-02-16", deposit: 130_000_000 },
    { id: "t13", name: "LH(유○○)", type: "tenant", claimAmount: 120_000_000, opposabilityDate: "2022-04-21", deposit: 120_000_000 },
    { id: "t14", name: "LH(양○○)", type: "tenant", claimAmount: 110_000_000, opposabilityDate: "2022-05-25", deposit: 110_000_000 },
    { id: "t15", name: "LH(조○○)", type: "tenant", claimAmount: 120_000_000, opposabilityDate: "2022-07-01", deposit: 120_000_000 },
    { id: "t16", name: "이○○", type: "tenant", claimAmount: 95_000_000, opposabilityDate: "2022-09-08", deposit: 95_000_000 },
    { id: "t17", name: "야○○", type: "tenant", claimAmount: 130_000_000, opposabilityDate: "2022-09-26", deposit: 130_000_000 },
  ];

  it("should calculate basic values correctly", () => {
    const result = calculateDistribution(auctionCase, creditors);

    expect(result.distributableFund).toBe(1_775_653_882);
    expect(result.halfOfPropertyValue).toBe(887_826_941);
  });

  it("should classify 3 absolute small tenants correctly", () => {
    const result = calculateDistribution(auctionCase, creditors);

    // baseRightDate 2017-12-04 -> 2016.03.31~2018.09.17 -> seoul: depositMax=100M, priorityMax=34M
    const step1Rows = result.rows.filter((r) => r.step === "STEP1");
    expect(step1Rows).toHaveLength(3);

    const step1Ids = step1Rows.map((r) => r.creditorId).sort();
    expect(step1Ids).toEqual(["t05", "t11", "t16"]);

    step1Rows.forEach((r) => {
      expect(r.distributionAmount).toBe(34_000_000);
    });

    const step1Total = step1Rows.reduce((sum, r) => sum + r.distributionAmount, 0);
    expect(step1Total).toBe(102_000_000);
  });

  it("should identify 11 relative small tenants (2 from 2018 period, 9 from 2021 period)", () => {
    const result = calculateDistribution(auctionCase, creditors);

    // Period 2018 (depositMax=110M): t03(LH서○○,110M), t14(LH양○○,110M) → priority 37M
    // Period 2021 (depositMax=150M): t06,t07,t08,t09,t10,t12,t13,t15,t17 → priority 50M
    // t01(서○○) 대항력 2019-12-02는 구간⑥(2021-05-11)보다 앞이므로 이미 배당 순서가 지남 → 상대적 소액 아님
    const relativeSmallIds = ["t03", "t06", "t07", "t08", "t09", "t10", "t12", "t13", "t14", "t15", "t17"];

    const rsRows = result.rows.filter((r) => r.reason.includes("상대적소액임차인"));
    expect(rsRows).toHaveLength(11);

    const rsIds = rsRows.map((r) => r.creditorId).sort();
    expect(rsIds).toEqual(relativeSmallIds.sort());

    // Period 2018 relative smalls: priority 37M
    const period2018Rs = rsRows.filter((r) => r.creditorId === "t03" || r.creditorId === "t14");
    period2018Rs.forEach((r) => {
      expect(r.claimAmount).toBe(37_000_000);
    });

    // Period 2021 relative smalls: priority 50M
    const period2021Rs = rsRows.filter((r) =>
      r.creditorId !== "t03" && r.creditorId !== "t14"
    );
    period2021Rs.forEach((r) => {
      expect(r.claimAmount).toBe(50_000_000);
    });
  });

  it("should identify 3 non-small tenants", () => {
    const result = calculateDistribution(auctionCase, creditors);

    // t01(서○○,150M) → 배당 순서가 구간⑥보다 앞이므로 상대적 소액 아님 → 비소액
    // t02(노○○,300M), t04(김○○,160M) → 어느 구간에서도 depositMax 초과 → 비소액
    const nonSmallIds = ["t01", "t02", "t04"];

    // Non-small tenants should appear in STEP3 only (확정일자 or 잔여액 부족)
    nonSmallIds.forEach((id) => {
      const rows = result.rows.filter((r) => r.creditorId === id);
      expect(rows.length).toBeGreaterThanOrEqual(1);
      rows.forEach((r) => {
        expect(r.step).toBe("STEP3");
        expect(
          r.reason.includes("확정일자임차인") || r.reason.includes("잔여액 부족")
        ).toBe(true);
      });
    });
  });

  it("should place relative small tenants after the mortgage", () => {
    const result = calculateDistribution(auctionCase, creditors);

    const step3Rows = result.rows.filter((r) => r.step === "STEP3");
    const mortgageIdx = step3Rows.findIndex((r) => r.creditorId === "mortgage");
    const firstRsIdx = step3Rows.findIndex((r) => r.reason.includes("상대적소액임차인"));

    expect(mortgageIdx).toBeGreaterThanOrEqual(0);
    expect(firstRsIdx).toBeGreaterThan(mortgageIdx);
  });

  it("should split same tenant into multiple rows summing to original deposit", () => {
    const result = calculateDistribution(auctionCase, creditors);

    // Absolute small tenants with remaining claim in STEP3
    const absoluteSmallIds = ["t05", "t11", "t16"];
    absoluteSmallIds.forEach((id) => {
      const rows = result.rows.filter((r) => r.creditorId === id);
      expect(rows.length).toBeGreaterThanOrEqual(2);
      const totalClaim = rows.reduce((sum, r) => sum + r.claimAmount, 0);
      const tenant = creditors.find((c) => c.id === id)!;
      expect(totalClaim).toBe(tenant.claimAmount);
    });

    // Relative small tenants with remaining claim in STEP3
    const relativeSmallIds = ["t03", "t06", "t07", "t08", "t09", "t10", "t12", "t13", "t14", "t15", "t17"];
    relativeSmallIds.forEach((id) => {
      const rows = result.rows.filter((r) => r.creditorId === id);
      expect(rows.length).toBeGreaterThanOrEqual(2);
      const totalClaim = rows.reduce((sum, r) => sum + r.claimAmount, 0);
      const tenant = creditors.find((c) => c.id === id)!;
      expect(totalClaim).toBe(tenant.claimAmount);
    });
  });

  it("should have total distribution equal to distributableFund - remainder", () => {
    const result = calculateDistribution(auctionCase, creditors);

    const totalDistributed = result.rows.reduce(
      (sum, r) => sum + r.distributionAmount, 0
    );
    expect(totalDistributed).toBe(result.distributableFund - result.remainder);
  });

  it("should have consistent remainingAfter chain", () => {
    const result = calculateDistribution(auctionCase, creditors);

    // Check within each step group that remainingAfter is consistent
    // The first row's remainingAfter should be distributableFund - step1 amounts - distribution
    // In general, each row's remainingAfter should decrease correctly
    result.rows.forEach((row, i) => {
      if (i > 0 && result.rows[i - 1].step === row.step) {
        // Within same step, remainingAfter should chain
        expect(row.remainingAfter).toBe(
          result.rows[i - 1].remainingAfter - row.distributionAmount
        );
      }
    });
  });
});

describe("Test 11: Real case — 2025타경 케이스3 (19 tenants + mortgage)", () => {
  const auctionCase: IAuctionCase = {
    salePrice: 1_732_770_000,
    saleInterest: 0,
    delayInterest: 0,
    priorDeposit: 0,
    appealDeposit: 0,
    executionCost: 0,
    region: "seoul",
    baseRightDate: "2017-09-15",
  };

  const creditors: ReadonlyArray<ICreditor> = [
    // 근저당 (2017-09-15 설정)
    {
      id: "mortgage", name: "근저당권자", type: "mortgage",
      claimAmount: 900_000_000,
      registrationDate: "2017-09-15",
      maxClaimAmount: 900_000_000,
    },
    // 19 tenants sorted by 대항력 발생일
    { id: "t01", name: "정○○(202)", type: "tenant", claimAmount: 110_000_000, opposabilityDate: "2017-09-20", deposit: 110_000_000 },
    { id: "t02", name: "안○○(103)", type: "tenant", claimAmount: 85_000_000, opposabilityDate: "2019-08-27", deposit: 85_000_000 },
    { id: "t03", name: "이○○(403)", type: "tenant", claimAmount: 135_000_000, opposabilityDate: "2019-10-23", deposit: 135_000_000 },
    { id: "t04", name: "김○○(402)", type: "tenant", claimAmount: 140_000_000, opposabilityDate: "2019-11-25", deposit: 140_000_000 },
    { id: "t05", name: "양○○(502)", type: "tenant", claimAmount: 150_000_000, opposabilityDate: "2020-02-07", deposit: 150_000_000 },
    { id: "t06", name: "송○○(501)", type: "tenant", claimAmount: 140_000_000, opposabilityDate: "2020-06-02", deposit: 140_000_000 },
    { id: "t07", name: "정○○(404)", type: "tenant", claimAmount: 140_000_000, opposabilityDate: "2021-12-31", deposit: 140_000_000 },
    { id: "t08", name: "이○○(203)", type: "tenant", claimAmount: 100_000_000, opposabilityDate: "2022-03-24", deposit: 100_000_000 },
    { id: "t09", name: "박○○(602)", type: "tenant", claimAmount: 40_000_000, opposabilityDate: "2022-04-14", deposit: 40_000_000 },
    { id: "t10", name: "김○○(401)", type: "tenant", claimAmount: 150_000_000, opposabilityDate: "2022-05-02", deposit: 150_000_000 },
    { id: "t11", name: "안○○(101)", type: "tenant", claimAmount: 170_000_000, opposabilityDate: "2022-06-28", deposit: 170_000_000 },
    { id: "t12", name: "송○○(104)", type: "tenant", claimAmount: 50_000_000, opposabilityDate: "2022-07-04", deposit: 50_000_000 },
    { id: "t13", name: "김○○(601)", type: "tenant", claimAmount: 100_000_000, opposabilityDate: "2023-05-26", deposit: 100_000_000 },
    { id: "t14", name: "정○○(303)", type: "tenant", claimAmount: 130_000_000, opposabilityDate: "2023-09-25", deposit: 130_000_000 },
    { id: "t15", name: "서○○(304)", type: "tenant", claimAmount: 120_000_000, opposabilityDate: "2023-10-04", deposit: 120_000_000 },
    { id: "t16", name: "박○○(201)", type: "tenant", claimAmount: 50_000_000, opposabilityDate: "2023-10-10", deposit: 50_000_000 },
    { id: "t17", name: "조○○(302)", type: "tenant", claimAmount: 135_000_000, opposabilityDate: "2023-10-25", deposit: 135_000_000 },
    { id: "t18", name: "윤○○(301)", type: "tenant", claimAmount: 140_000_000, opposabilityDate: "2023-11-14", deposit: 140_000_000 },
    { id: "t19", name: "한○○(204)", type: "tenant", claimAmount: 100_000_000, opposabilityDate: "2024-11-13", deposit: 100_000_000 },
    // 송○○(102): 보증금 2,700,000, 대항력 발생일 없음
    { id: "t20", name: "송○○(102)", type: "tenant", claimAmount: 2_700_000, deposit: 2_700_000 },
  ];

  it("should calculate basic values correctly", () => {
    const result = calculateDistribution(auctionCase, creditors);

    // totalFund = salePrice = 1,732,770,000 (no interest/deposits)
    // distributableFund = totalFund - executionCost = 1,732,770,000
    expect(result.distributableFund).toBe(1_732_770_000);
  });

  it("should have total distribution equal to distributableFund - remainder", () => {
    const result = calculateDistribution(auctionCase, creditors);

    const totalDistributed = result.rows.reduce(
      (sum, r) => sum + r.distributionAmount, 0
    );
    expect(totalDistributed).toBe(result.distributableFund - result.remainder);
  });

  it("should have consistent remainingAfter chain within each step", () => {
    const result = calculateDistribution(auctionCase, creditors);

    result.rows.forEach((row, i) => {
      if (i > 0 && result.rows[i - 1].step === row.step) {
        expect(row.remainingAfter).toBe(
          result.rows[i - 1].remainingAfter - row.distributionAmount
        );
      }
    });
  });

  it("should not distribute more than claim amount per creditor", () => {
    const result = calculateDistribution(auctionCase, creditors);

    const byCreditor = new Map<string, number>();
    result.rows.forEach((r) => {
      byCreditor.set(r.creditorId, (byCreditor.get(r.creditorId) ?? 0) + r.distributionAmount);
    });

    byCreditor.forEach((total, id) => {
      const creditor = creditors.find((c) => c.id === id)!;
      expect(total).toBeLessThanOrEqual(creditor.claimAmount);
    });
  });
});
