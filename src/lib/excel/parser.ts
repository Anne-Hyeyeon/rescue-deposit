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
  "수도권 과밀억제권역": "metropolitan_overcrowded",
  "광역시": "metropolitan",
  "기타": "others",
};

const PROPERTY_TYPE_MAP: Record<string, PropertyType> = {
  "다가구": "multi_family",
  "다세대·연립": "multi_unit",
  "다세대/연립": "multi_unit",
};

const TAX_OPTION_MAP: Record<string, PropertyTaxOption> = {
  "있음": "yes",
  "없음": "no",
  "모름": "unknown",
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
    const cleaned = val.replace(/[,\s원]/g, "");
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
  return s === "예" || s === "Y" || s === "y" || s === "true";
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
    const wb = XLSX.read(buffer, { type: "array" });

    // 매각·근저당 시트
    const basicSheet = wb.Sheets["매각·근저당"] ?? wb.Sheets["기본정보"];
    if (!basicSheet) {
      return { success: false, error: "'매각·근저당' 시트를 찾을 수 없습니다." };
    }

    const basicRows: unknown[][] = XLSX.utils.sheet_to_json(basicSheet, { header: 1 });
    if (basicRows.length < 3) {
      return { success: false, error: "매각·근저당 시트에 데이터가 없습니다." };
    }

    const headerRow = basicRows[0]; // Row 0: 헤더
    // Row 1: 설명 (스킵)
    const dataRow = basicRows[2]; // Row 2: 데이터

    const col = buildColumnMap(headerRow);

    const getVal = (key: string) => {
      const idx = col.get(key);
      return idx !== undefined ? dataRow[idx] : undefined;
    };

    const salePrice = toNumber(getVal("매각가격"));
    if (salePrice <= 0) {
      return { success: false, error: "매각가격을 입력해주세요." };
    }

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
      mortgageMaxClaim: toNumber(getVal("채권최고액")),
      mortgageRegDate: toString(getVal("설정일")),
      propertyType: PROPERTY_TYPE_MAP[toString(getVal("건물 유형"))] ?? "multi_family",
      region: REGION_MAP[toString(getVal("지역"))] ?? "seoul",
      propertyTaxOption: TAX_OPTION_MAP[toString(getVal("재산세 납부"))] ?? "unknown",
      propertyTaxAmount: toNumber(getVal("재산세 금액")),
      propertyTaxLegalDate: toString(getVal("재산세 법정기일")),
      otherTenants: [],
    };

    // 세입자 목록 시트
    const tenantSheet = wb.Sheets["세입자 목록"] ?? wb.Sheets["임차인목록"];
    if (tenantSheet) {
      const tenantRows: unknown[][] = XLSX.utils.sheet_to_json(tenantSheet, { header: 1 });
      if (tenantRows.length >= 3) {
        const tCol = buildColumnMap(tenantRows[0]);
        const tenants = parseTenantRows(tenantRows, tCol);

        // 첫 번째 세입자 = 내 정보
        if (tenants.length > 0) {
          const my = tenants[0];
          data.myName = my.name;
          data.myDeposit = my.deposit;
          data.myOpposabilityDate = my.opposabilityDate;
          data.myHasOccupancy = my.hasOccupancy;
          data.otherTenants = tenants.slice(1);
        }
      }
    }

    // 필수 항목 검증
    const missing: string[] = [];
    if (data.salePrice <= 0) missing.push("매각가격");
    if (data.myDeposit <= 0) missing.push("내 보증금 (세입자 목록 1행)");
    if (!data.myOpposabilityDate) missing.push("내 대항력 발생일 (세입자 목록 1행)");
    if (!data.mortgageRegDate) missing.push("근저당 설정일");
    if (data.mortgageMaxClaim <= 0) missing.push("채권최고액");

    if (missing.length > 0) {
      return {
        success: false,
        error: `필수 항목이 누락되었습니다: ${missing.join(", ")}`,
      };
    }

    const title = file.name.replace(/\.xlsx?$/i, "");
    return { success: true, data, title };
  } catch {
    return { success: false, error: "파일을 읽을 수 없습니다. xlsx 형식인지 확인해주세요." };
  }
};

const parseTenantRows = (
  rows: unknown[][],
  colMap: Map<string, number>
): IOtherTenant[] => {
  const nameIdx = colMap.get("이름") ?? 0;
  const depositIdx = colMap.get("보증금") ?? 1;
  const dateIdx = colMap.get("대항력 발생일") ?? 2;
  const occupancyIdx = colMap.get("점유 여부") ?? 3;

  const tenants: IOtherTenant[] = [];

  // Row 0=헤더, Row 1=설명, Row 2~=데이터
  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;

    const name = toString(row[nameIdx]);
    const deposit = toNumber(row[depositIdx]);

    // 이름과 보증금 둘 다 비어있으면 스킵
    if (!name && deposit === 0) continue;

    tenants.push({
      id: `t-${String(tenants.length + 1).padStart(2, "0")}`,
      name,
      deposit,
      opposabilityDate: toString(row[dateIdx]),
      hasOccupancy: toBool(row[occupancyIdx]),
    });
  }

  return tenants;
};
