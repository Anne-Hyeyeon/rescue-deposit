import type { ISmallTenantThreshold, Region } from "./types";

// ===== Small Tenant Threshold Table (4 regions x 7 periods) =====

export const SMALL_TENANT_TABLE: ReadonlyArray<ISmallTenantThreshold> = [
  {
    periodStart: "2008-08-21",
    periodEnd: "2010-07-25",
    decree: "제20971호",
    seoul: { depositMax: 40_000_000, priorityMax: 20_000_000 },
    overcrowded: { depositMax: 40_000_000, priorityMax: 20_000_000 },
    metropolitan: { depositMax: 35_000_000, priorityMax: 17_000_000 },
    others: { depositMax: 30_000_000, priorityMax: 14_000_000 },
  },
  {
    periodStart: "2010-07-26",
    periodEnd: "2013-12-31",
    decree: "제22284호",
    seoul: { depositMax: 75_000_000, priorityMax: 25_000_000 },
    overcrowded: { depositMax: 60_000_000, priorityMax: 22_000_000 },
    metropolitan: { depositMax: 45_000_000, priorityMax: 19_000_000 },
    others: { depositMax: 35_000_000, priorityMax: 14_000_000 },
  },
  {
    periodStart: "2014-01-01",
    periodEnd: "2016-03-30",
    decree: "제25035호",
    seoul: { depositMax: 95_000_000, priorityMax: 32_000_000 },
    overcrowded: { depositMax: 80_000_000, priorityMax: 27_000_000 },
    metropolitan: { depositMax: 55_000_000, priorityMax: 19_000_000 },
    others: { depositMax: 40_000_000, priorityMax: 14_000_000 },
  },
  {
    periodStart: "2016-03-31",
    periodEnd: "2018-09-17",
    decree: "제27078호",
    seoul: { depositMax: 100_000_000, priorityMax: 34_000_000 },
    overcrowded: { depositMax: 80_000_000, priorityMax: 27_000_000 },
    metropolitan: { depositMax: 60_000_000, priorityMax: 20_000_000 },
    others: { depositMax: 45_000_000, priorityMax: 15_000_000 },
  },
  {
    periodStart: "2018-09-18",
    periodEnd: "2021-05-10",
    decree: "제29162호",
    seoul: { depositMax: 110_000_000, priorityMax: 37_000_000 },
    overcrowded: { depositMax: 100_000_000, priorityMax: 34_000_000 },
    metropolitan: { depositMax: 60_000_000, priorityMax: 20_000_000 },
    others: { depositMax: 50_000_000, priorityMax: 17_000_000 },
  },
  {
    periodStart: "2021-05-11",
    periodEnd: "2023-02-20",
    decree: "제31673호",
    seoul: { depositMax: 150_000_000, priorityMax: 50_000_000 },
    overcrowded: { depositMax: 130_000_000, priorityMax: 43_000_000 },
    metropolitan: { depositMax: 70_000_000, priorityMax: 23_000_000 },
    others: { depositMax: 60_000_000, priorityMax: 20_000_000 },
  },
  {
    periodStart: "2023-02-21",
    periodEnd: "9999-12-31",
    decree: "제33254호",
    seoul: { depositMax: 165_000_000, priorityMax: 55_000_000 },
    overcrowded: { depositMax: 145_000_000, priorityMax: 48_000_000 },
    metropolitan: { depositMax: 85_000_000, priorityMax: 28_000_000 },
    others: { depositMax: 75_000_000, priorityMax: 25_000_000 },
  },
] as const;

// ===== Region Mapping Data =====

export const OVERCROWDED_CITIES = [
  "인천광역시",
  "의정부시",
  "구리시",
  "남양주시",
  "하남시",
  "고양시",
  "수원시",
  "성남시",
  "안양시",
  "부천시",
  "광명시",
  "과천시",
  "의왕시",
  "군포시",
  "시흥시",
] as const;

export const OVERCROWDED_ADDITIONAL: Record<string, ReadonlyArray<string>> = {
  "2010-07-26": [],
  "2014-01-01": [],
  "2016-03-31": [],
  "2018-09-18": [],
  "2021-05-11": ["세종특별자치시", "용인시", "화성시", "김포시"],
  "2023-02-21": ["세종특별자치시", "용인시", "화성시", "김포시"],
} as const;

export const METROPOLITAN_ADDITIONAL: Record<string, ReadonlyArray<string>> = {
  "2010-07-26": ["안산시", "용인시", "김포시", "광주시"],
  "2014-01-01": ["안산시", "용인시", "김포시", "광주시"],
  "2016-03-31": ["안산시", "용인시", "김포시", "광주시"],
  "2018-09-18": ["안산시", "용인시", "김포시", "광주시"],
  "2021-05-11": ["안산시", "광주시", "파주시", "이천시", "평택시"],
  "2023-02-21": ["안산시", "광주시", "파주시", "이천시", "평택시"],
} as const;

export const METROPOLITAN_BASE_CITIES = [
  "부산광역시",
  "대구광역시",
  "대전광역시",
  "광주광역시",
  "울산광역시",
] as const;

// ===== Property Tax =====

export const PROPERTY_TAX_TYPES = {
  national: ["상속세", "증여세", "종합부동산세"],
  local: ["재산세", "도시계획세"],
} as const;

export const PROPERTY_TAX_REFORM_DATE = "2023-04-01" as const;

// ===== Period lookup helper =====

const PERIOD_STARTS = [
  "2023-02-21",
  "2021-05-11",
  "2018-09-18",
  "2016-03-31",
  "2014-01-01",
  "2010-07-26",
  "2008-08-21",
] as const;

export const findPeriodStart = (referenceDate: string): string => {
  const found = PERIOD_STARTS.find((start) => referenceDate >= start);
  if (!found) {
    throw new Error(`기준표에 해당하는 시기가 없습니다: ${referenceDate}`);
  }
  return found;
};

export const getSmallTenantThreshold = (
  region: Region,
  referenceDate: string
): { readonly depositMax: number; readonly priorityMax: number } => {
  const entry = SMALL_TENANT_TABLE.find(
    (t) => referenceDate >= t.periodStart && referenceDate <= t.periodEnd
  );

  if (!entry) {
    throw new Error(`기준표에 해당하는 시기가 없습니다: ${referenceDate}`);
  }

  return entry[region];
};
