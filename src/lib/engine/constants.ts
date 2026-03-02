import type { ISmallTenantLimit } from "./types";

// 소액임차인 보증금 / 최우선변제 한도 (지역별)
// Source: 주택임대차보호법 시행령
export const SMALL_TENANT_LIMITS: Record<string, ISmallTenantLimit[]> = {
  seoul: [
    {
      startDate: "2010-07-26",
      endDate: "2013-12-31",
      maxDeposit: 75_000_000,
      priorityAmount: 25_000_000,
    },
    {
      startDate: "2014-01-01",
      endDate: "2016-03-30",
      maxDeposit: 95_000_000,
      priorityAmount: 32_000_000,
    },
    {
      startDate: "2016-03-31",
      endDate: "2018-09-17",
      maxDeposit: 100_000_000,
      priorityAmount: 34_000_000,
    },
    {
      startDate: "2018-09-18",
      endDate: "2021-05-10",
      maxDeposit: 110_000_000,
      priorityAmount: 37_000_000,
    },
    {
      startDate: "2021-05-11",
      endDate: "2023-02-20",
      maxDeposit: 150_000_000,
      priorityAmount: 50_000_000,
    },
    {
      startDate: "2023-02-21",
      endDate: null,
      maxDeposit: 165_000_000,
      priorityAmount: 55_000_000,
    },
  ],
  metropolitan_overcrowded: [
    {
      startDate: "2010-07-26",
      endDate: "2013-12-31",
      maxDeposit: 65_000_000,
      priorityAmount: 22_000_000,
    },
    {
      startDate: "2014-01-01",
      endDate: "2016-03-30",
      maxDeposit: 85_000_000,
      priorityAmount: 27_000_000,
    },
    {
      startDate: "2016-03-31",
      endDate: "2018-09-17",
      maxDeposit: 80_000_000,
      priorityAmount: 27_000_000,
    },
    {
      startDate: "2018-09-18",
      endDate: "2021-05-10",
      maxDeposit: 100_000_000,
      priorityAmount: 33_000_000,
    },
    {
      startDate: "2021-05-11",
      endDate: "2023-02-20",
      maxDeposit: 130_000_000,
      priorityAmount: 43_000_000,
    },
    {
      startDate: "2023-02-21",
      endDate: null,
      maxDeposit: 145_000_000,
      priorityAmount: 48_000_000,
    },
  ],
  metropolitan: [
    {
      startDate: "2010-07-26",
      endDate: "2013-12-31",
      maxDeposit: 55_000_000,
      priorityAmount: 19_000_000,
    },
    {
      startDate: "2014-01-01",
      endDate: "2016-03-30",
      maxDeposit: 70_000_000,
      priorityAmount: 23_000_000,
    },
    {
      startDate: "2016-03-31",
      endDate: "2018-09-17",
      maxDeposit: 70_000_000,
      priorityAmount: 23_000_000,
    },
    {
      startDate: "2018-09-18",
      endDate: "2021-05-10",
      maxDeposit: 85_000_000,
      priorityAmount: 28_000_000,
    },
    {
      startDate: "2021-05-11",
      endDate: "2023-02-20",
      maxDeposit: 100_000_000,
      priorityAmount: 33_000_000,
    },
    {
      startDate: "2023-02-21",
      endDate: null,
      maxDeposit: 85_000_000,
      priorityAmount: 28_000_000,
    },
  ],
  others: [
    {
      startDate: "2010-07-26",
      endDate: "2013-12-31",
      maxDeposit: 40_000_000,
      priorityAmount: 13_000_000,
    },
    {
      startDate: "2014-01-01",
      endDate: "2016-03-30",
      maxDeposit: 60_000_000,
      priorityAmount: 20_000_000,
    },
    {
      startDate: "2016-03-31",
      endDate: "2018-09-17",
      maxDeposit: 60_000_000,
      priorityAmount: 20_000_000,
    },
    {
      startDate: "2018-09-18",
      endDate: "2021-05-10",
      maxDeposit: 70_000_000,
      priorityAmount: 23_000_000,
    },
    {
      startDate: "2021-05-11",
      endDate: "2023-02-20",
      maxDeposit: 80_000_000,
      priorityAmount: 26_000_000,
    },
    {
      startDate: "2023-02-21",
      endDate: null,
      maxDeposit: 85_000_000,
      priorityAmount: 28_000_000,
    },
  ],
};

// 2023-04-01: 당해세 역전 규정 시행일
export const PROPERTY_TAX_REVERSAL_DATE = "2023-04-01";
