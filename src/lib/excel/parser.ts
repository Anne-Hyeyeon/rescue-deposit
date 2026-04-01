import * as XLSX from "xlsx";
import type {
  ISimulationInput,
  IOtherTenant,
  PropertyType,
  Region,
  PropertyTaxOption,
} from "@/types/simulation";
import { defaultSimulationInput } from "@/types/simulation";

// ── 라벨 → 값 매핑 ──

const REGION_MAP: Record<string, Region> = {
  "서울": "seoul",
  "서울특별시": "seoul",
  "수도권 과밀억제권역": "metropolitan_overcrowded",
  "광역시": "metropolitan",
  "기타": "others",
  "1": "seoul",
  "2": "metropolitan_overcrowded",
  "3": "metropolitan",
  "4": "others",
};

const PROPERTY_TYPE_MAP: Record<string, PropertyType> = {
  "다가구": "multi_family",
  "다세대·연립": "multi_unit",
  "다세대/연립": "multi_unit",
  "1": "multi_family",
  "2": "multi_unit",
};

const TAX_OPTION_MAP: Record<string, PropertyTaxOption> = {
  "있음": "yes",
  "없음": "no",
  "모름": "unknown",
  "1": "yes",
  "2": "no",
  "3": "unknown",
};

const OCCUPANCY_MAP: Record<string, boolean> = {
  "예": true,
  "Y": true,
  "y": true,
  "true": true,
  "1": true,
  "아니오": false,
  "아니요": false,
  "N": false,
  "n": false,
  "false": false,
  "2": false,
};

// ── 결과 타입 ──

interface IParseResult {
  success: true;
  data: ISimulationInput;
  title: string;
}

interface IParseError {
  success: false;
  error: string;
}

type ParseResult = IParseResult | IParseError;

// ── 유틸 ──

const toNumber = (val: unknown): number => {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const cleaned = val.replace(/[,\s원억만]/g, "");
    const num = Number(cleaned);
    return Number.isNaN(num) ? 0 : num;
  }
  return 0;
};

const toString = (val: unknown): string => {
  if (val === null || val === undefined) return "";
  return String(val).trim();
};

const toBool = (val: unknown): boolean => {
  const s = toString(val);
  return OCCUPANCY_MAP[s] ?? false;
};

/**
 * Excel 날짜를 YYYY-MM-DD 문자열로 변환.
 * Excel은 날짜를 시리얼 넘버(예: 44805)로 저장할 수 있음.
 */
const toDateString = (val: unknown): string => {
  if (val === null || val === undefined) return "";

  // 이미 YYYY-MM-DD 형식 문자열
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    // YYYY/MM/DD or YYYY.MM.DD
    const normalized = trimmed.replace(/[/.]/g, "-");
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return normalized;
    return trimmed;
  }

  // Excel 시리얼 넘버 (number)
  if (typeof val === "number" && val > 10000 && val < 100000) {
    const date = XLSX.SSF.parse_date_code(val);
    if (date) {
      const y = String(date.y);
      const m = String(date.m).padStart(2, "0");
      const d = String(date.d).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
  }

  return toString(val);
};

// ── 데이터 행 탐지 ──

/**
 * 헤더/설명/힌트 행을 건너뛰고 실제 데이터가 있는 첫 행을 찾음.
 * Row 0 = 헤더, Row 1 = 설명, Row 2 = 힌트(신양식) 또는 데이터(구양식), Row 3 = 데이터(신양식)
 */
const KNOWN_HEADERS = ["매각가격", "집행비용", "감정가", "이름", "보증금", "채권최고액", "순서"];

/**
 * 헤더 행을 찾음. 안내 문구 행이 있을 수 있으므로 Row 0~2에서 탐색.
 */
const findHeaderRowIndex = (rows: unknown[][]): number => {
  for (let i = 0; i < Math.min(rows.length, 3); i++) {
    const row = rows[i];
    if (!row) continue;
    const hasKnownHeader = row.some((cell) => {
      const s = toString(cell).replace(/\s*\*\s*$/, "");
      return KNOWN_HEADERS.includes(s);
    });
    if (hasKnownHeader) return i;
  }
  return 0;
};

const isNonDataRow = (row: unknown[]): boolean =>
  row.some((cell) => {
    const s = toString(cell);
    return s.startsWith("필수") || s.startsWith("선택") || s.startsWith("숫자만")
      || s === "설명" || s.startsWith("YYYY") || s.includes("세입자 등록");
  });

/**
 * 헤더 행 이후에서 실제 데이터가 있는 첫 행을 찾음.
 */
const findDataRow = (rows: unknown[][], headerRowIdx: number): unknown[] | null => {
  for (let i = headerRowIdx + 1; i < Math.min(rows.length, headerRowIdx + 4); i++) {
    const row = rows[i];
    if (!row) continue;
    if (isNonDataRow(row)) continue;
    if (row.every((cell) => cell === null || cell === undefined || cell === "")) continue;
    return row;
  }
  return null;
};

/**
 * 세입자 데이터 행의 시작 인덱스를 찾음.
 */
const findTenantDataStartRow = (rows: unknown[][], headerRowIdx: number): number => {
  for (let i = headerRowIdx + 1; i < Math.min(rows.length, headerRowIdx + 4); i++) {
    const row = rows[i];
    if (!row) continue;
    if (isNonDataRow(row)) continue;
    return i;
  }
  return headerRowIdx + 2;
};

// ── 헤더 → 열 인덱스 매핑 ──

const buildColumnMap = (headerRow: unknown[]): Map<string, number> => {
  const map = new Map<string, number>();
  headerRow.forEach((cell, i) => {
    // "매각가격 *" → "매각가격" (필수 표시 제거)
    const key = toString(cell).replace(/\s*\*\s*$/, "").trim();
    if (key) map.set(key, i);
  });
  return map;
};

// ── 메인 파서 ──

/**
 * 새 양식 구조 파싱:
 * - Sheet "매각·근저당": Row0=헤더, Row1=설명, Row2=데이터
 *   기본정보 8열 + 근저당 4열 = 12열
 * - Sheet "세입자 목록": Row0=헤더, Row1=설명, Row2~=세입자 데이터
 */
export const parseSimulationExcel = async (file: File): Promise<ParseResult> => {
  try {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: "array", cellDates: false });

    if (!wb.SheetNames || wb.SheetNames.length === 0) {
      return { success: false, error: "엑셀 파일에 시트가 없습니다." };
    }

    // 매각·근저당 시트
    const basicSheet = wb.Sheets["매각·근저당"] ?? wb.Sheets["기본정보"];
    if (!basicSheet) {
      return {
        success: false,
        error: `'매각·근저당' 시트를 찾을 수 없습니다. 현재 시트: ${wb.SheetNames.join(", ")}`,
      };
    }

    const basicRows: unknown[][] = XLSX.utils.sheet_to_json(basicSheet, { header: 1, raw: true });

    const headerRowIdx = findHeaderRowIndex(basicRows);
    const headerRow = basicRows[headerRowIdx];
    if (!headerRow || headerRow.length === 0) {
      return { success: false, error: "매각·근저당 시트에 헤더가 없습니다." };
    }

    const dataRow = findDataRow(basicRows, headerRowIdx);
    if (!dataRow) {
      return { success: false, error: "매각·근저당 시트에 데이터가 없습니다. 헤더 아래 행에 값을 입력해주세요." };
    }

    const col = buildColumnMap(headerRow);

    const getVal = (key: string) => {
      const idx = col.get(key);
      return idx !== undefined ? dataRow[idx] : undefined;
    };

    const salePrice = toNumber(getVal("매각가격"));
    if (salePrice <= 0) {
      return { success: false, error: "매각가격을 입력해주세요. (매각·근저당 시트 3행)" };
    }

    const mortgageMaxClaim = toNumber(getVal("채권최고액"));
    const mortgageRegDate = toDateString(getVal("설정일"));

    const data: ISimulationInput = {
      ...defaultSimulationInput,
      salePrice,
      executionCost: toNumber(getVal("집행비용")),
      appraisalValue: toNumber(getVal("감정가")),
      myName: "",
      myDeposit: 0,
      myOpposabilityDate: "",
      myHasOccupancy: true,
      mortgageName: toString(getVal("근저당권자")),
      mortgagePrincipal: toNumber(getVal("채권원금")),
      mortgageMaxClaim,
      mortgageRegDate,
      propertyType: PROPERTY_TYPE_MAP[toString(getVal("건물 유형"))] ?? "multi_family",
      region: REGION_MAP[toString(getVal("지역"))] ?? "seoul",
      propertyTaxOption: TAX_OPTION_MAP[toString(getVal("재산세 납부"))] ?? "unknown",
      propertyTaxAmount: toNumber(getVal("재산세 금액")),
      propertyTaxLegalDate: toDateString(getVal("재산세 법정기일")),
      otherTenants: [],
    };

    // 세입자 목록 시트
    const tenantSheet = wb.Sheets["세입자 목록"] ?? wb.Sheets["임차인목록"];
    if (tenantSheet) {
      const tenantRows: unknown[][] = XLSX.utils.sheet_to_json(tenantSheet, { header: 1, raw: true });
      const tenantHeaderIdx = findHeaderRowIndex(tenantRows);
      const tenantStartRow = findTenantDataStartRow(tenantRows, tenantHeaderIdx);
      if (tenantRows.length > tenantStartRow) {
        const tCol = buildColumnMap(tenantRows[tenantHeaderIdx]);
        const tenants = parseTenantRows(tenantRows, tCol, tenantStartRow);

        // 첫 번째 세입자 = 내 정보 (보증금이 0보다 큰 경우에만)
        if (tenants.length > 0 && tenants[0].deposit > 0) {
          const my = tenants[0];
          data.myName = my.name;
          data.myDeposit = my.deposit;
          data.myOpposabilityDate = my.opposabilityDate;
          data.myHasOccupancy = my.hasOccupancy;
          data.otherTenants = tenants.slice(1);
        } else if (tenants.length > 0 && tenants[0].deposit === 0) {
          // 첫 행이 "나"이지만 보증금 0인 경우, 전부 다른 세입자로 처리
          const firstIsPlaceholder =
            tenants[0].name === "" || tenants[0].name === "나";
          data.otherTenants = firstIsPlaceholder ? tenants.slice(1) : tenants;
        } else {
          data.otherTenants = tenants;
        }
      }
    }

    // 필수 항목 검증 (form validation과 동일한 로직)
    const missing: string[] = [];

    if (data.salePrice <= 0) {
      missing.push("매각가격");
    }

    if (!data.mortgageRegDate) {
      missing.push("근저당 설정일");
    }

    if (data.mortgageMaxClaim <= 0) {
      missing.push("채권최고액");
    }

    // 내 보증금이 있으면 대항력 발생일 필수
    if (data.myDeposit > 0 && !data.myOpposabilityDate) {
      missing.push("내 대항력 발생일 (세입자 목록 1행)");
    }

    // 내 보증금도 없고 다른 세입자도 없으면 에러
    const hasMyTenant = data.myDeposit > 0 && Boolean(data.myOpposabilityDate);
    const hasOtherTenant = data.otherTenants.some(
      (t) => t.deposit > 0 && Boolean(t.opposabilityDate)
    );

    if (!hasMyTenant && !hasOtherTenant) {
      missing.push("세입자 정보 (내 보증금 또는 다른 세입자 1명 이상)");
    }

    if (missing.length > 0) {
      return {
        success: false,
        error: `필수 항목이 누락되었습니다: ${missing.join(", ")}`,
      };
    }

    const title = file.name.replace(/\.xlsx?$/i, "");
    return { success: true, data, title };
  } catch (err) {
    if (err instanceof RangeError) {
      return { success: false, error: "파일이 손상되었거나 지원하지 않는 형식입니다." };
    }
    return { success: false, error: "파일을 읽을 수 없습니다. xlsx 형식인지 확인해주세요." };
  }
};

const parseTenantRows = (
  rows: unknown[][],
  colMap: Map<string, number>,
  startRow: number,
): IOtherTenant[] => {
  const nameIdx = colMap.get("이름") ?? 0;
  const depositIdx = colMap.get("보증금") ?? 1;
  const dateIdx = colMap.get("대항력 발생일") ?? 2;
  const occupancyIdx = colMap.get("점유 여부") ?? 3;

  const tenants: IOtherTenant[] = [];

  for (let i = startRow; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;

    const name = toString(row[nameIdx]);
    const deposit = toNumber(row[depositIdx]);
    const dateStr = toDateString(row[dateIdx]);

    // 이름과 보증금 둘 다 비어있으면 스킵
    if (!name && deposit === 0) continue;

    tenants.push({
      id: `t-${String(tenants.length + 1).padStart(2, "0")}`,
      name,
      deposit,
      opposabilityDate: dateStr,
      hasOccupancy: toBool(row[occupancyIdx]),
    });
  }

  return tenants;
};
