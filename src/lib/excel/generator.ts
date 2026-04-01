import * as XLSX from "xlsx";
import type { ISimulationInput, ISimulationResult } from "@/types/simulation";

// ── 라벨 맵 ──

const REGION_LABELS: Record<string, string> = {
  seoul: "서울",
  metropolitan_overcrowded: "수도권 과밀억제권역",
  metropolitan: "광역시",
  others: "기타",
};

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  multi_family: "다가구",
  multi_unit: "다세대/연립",
};

const PROPERTY_TAX_LABELS: Record<string, string> = {
  yes: "있음",
  no: "없음",
  unknown: "모름",
};

// ── 스타일 헬퍼 (xlsx community edition) ──

const HEADER_FILL = { fgColor: { rgb: "4472C4" } };
const DESC_FILL = { fgColor: { rgb: "D6E4F0" } };
const SECTION_FILL = { fgColor: { rgb: "E2EFDA" } };
const SECTION_DESC_FILL = { fgColor: { rgb: "F0F5EB" } };

const headerStyle = {
  fill: HEADER_FILL,
  font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
  alignment: { horizontal: "center" as const, vertical: "center" as const },
  border: thinBorder(),
};

const descStyle = {
  fill: DESC_FILL,
  font: { color: { rgb: "666666" }, sz: 9, italic: true },
  alignment: { horizontal: "center" as const, vertical: "center" as const, wrapText: true },
  border: thinBorder(),
};

const sectionHeaderStyle = {
  fill: SECTION_FILL,
  font: { bold: true, color: { rgb: "375623" }, sz: 11 },
  alignment: { horizontal: "center" as const, vertical: "center" as const },
  border: thinBorder(),
};

const sectionDescStyle = {
  fill: SECTION_DESC_FILL,
  font: { color: { rgb: "666666" }, sz: 9, italic: true },
  alignment: { horizontal: "center" as const, vertical: "center" as const, wrapText: true },
  border: thinBorder(),
};

const dataStyle = {
  alignment: { horizontal: "center" as const, vertical: "center" as const },
  border: thinBorder(),
};

function thinBorder() {
  const side = { style: "thin" as const, color: { rgb: "CCCCCC" } };
  return { top: side, bottom: side, left: side, right: side };
}

// ── 공통 빌드 로직 ──

interface IColumnDef {
  header: string;
  desc: string;
  width: number;
}

const BASIC_COLUMNS: IColumnDef[] = [
  { header: "매각가격 *", desc: "필수 · 낙찰가 (원)", width: 18 },
  { header: "집행비용", desc: "선택 · 경매 집행비용 (원)", width: 20 },
  { header: "감정가", desc: "선택 · 감정평가액 (원)", width: 18 },
  { header: "건물 유형", desc: "선택 · 다가구/다세대·연립", width: 18 },
  { header: "지역", desc: "선택 · 서울/수도권 과밀억제권역/광역시/기타", width: 24 },
  { header: "재산세 납부", desc: "선택 · 있음/없음/모름", width: 14 },
  { header: "재산세 금액", desc: "선택 · 원", width: 14 },
  { header: "재산세 법정기일", desc: "선택 · YYYY-MM-DD", width: 16 },
];

const MORTGAGE_COLUMNS: IColumnDef[] = [
  { header: "근저당권자", desc: "선택 · 이름", width: 14 },
  { header: "채권원금", desc: "선택 · 원", width: 18 },
  { header: "채권최고액 *", desc: "필수 · 원", width: 18 },
  { header: "설정일 *", desc: "필수 · YYYY-MM-DD", width: 16 },
];

const TENANT_COLUMNS: IColumnDef[] = [
  { header: "이름", desc: "세입자 이름", width: 14 },
  { header: "보증금 *", desc: "필수 · 원", width: 18 },
  { header: "대항력 발생일 *", desc: "필수 · YYYY-MM-DD", width: 18 },
  { header: "점유 여부", desc: "선택 · 예/아니오", width: 12 },
];

const RESULT_COLUMNS: IColumnDef[] = [
  { header: "순서", desc: "배당 단계", width: 14 },
  { header: "구분", desc: "권리 분류", width: 18 },
  { header: "채권자", desc: "권리자 이름", width: 20 },
  { header: "일자", desc: "기준일자", width: 16 },
  { header: "채권액", desc: "원", width: 18 },
  { header: "배당액", desc: "원", width: 18 },
  { header: "잔액", desc: "배당 후 잔액", width: 18 },
  { header: "비고", desc: "계산 메모", width: 28 },
] as const;

const buildSheet = (
  wb: XLSX.WorkBook,
  sheetName: string,
  sections: {
    title: string;
    columns: IColumnDef[];
    rows: unknown[][];
    isGreen?: boolean;
  }[]
): void => {
  const ws: XLSX.WorkSheet = {};
  let maxCol = 0;

  // 각 섹션 순서대로 배치 (열 방향으로 이어붙임)
  let colOffset = 0;

  for (const section of sections) {
    const cols = section.columns;
    const hStyle = section.isGreen ? sectionHeaderStyle : headerStyle;
    const dStyle = section.isGreen ? sectionDescStyle : descStyle;

    for (let c = 0; c < cols.length; c++) {
      const col = colOffset + c;
      const headerRef = XLSX.utils.encode_cell({ r: 0, c: col });
      const descRef = XLSX.utils.encode_cell({ r: 1, c: col });

      ws[headerRef] = { v: cols[c].header, t: "s", s: hStyle };
      ws[descRef] = { v: cols[c].desc, t: "s", s: dStyle };

      // 데이터 행
      for (let r = 0; r < section.rows.length; r++) {
        const dataRef = XLSX.utils.encode_cell({ r: r + 2, c: col });
        const val = section.rows[r]?.[c];
        if (val !== undefined && val !== null && val !== "") {
          ws[dataRef] = {
            v: val,
            t: typeof val === "number" ? "n" : "s",
            s: dataStyle,
          };
        } else {
          ws[dataRef] = { v: "", t: "s", s: dataStyle };
        }
      }
    }

    colOffset += cols.length;
    if (colOffset > maxCol) maxCol = colOffset;
  }

  // 최대 행 수 계산
  const maxRow = 2 + Math.max(...sections.map((s) => s.rows.length));

  ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: maxRow - 1, c: maxCol - 1 } });

  // 열 너비 설정
  const allCols = sections.flatMap((s) => s.columns);
  ws["!cols"] = allCols.map((c) => ({ wch: c.width }));

  // 행 높이: 설명 행 약간 높게
  ws["!rows"] = [{ hpt: 24 }, { hpt: 30 }];

  XLSX.utils.book_append_sheet(wb, ws, sheetName);
};

// ── 데이터 → 엑셀 ──

const appendSimulationInputSheets = (
  wb: XLSX.WorkBook,
  input: ISimulationInput,
) => {
  // 기본정보 + 근저당 (1행)
  const basicRow = [
    input.salePrice,
    input.executionCost,
    input.appraisalValue,
    PROPERTY_TYPE_LABELS[input.propertyType] ?? input.propertyType,
    REGION_LABELS[input.region] ?? input.region,
    PROPERTY_TAX_LABELS[input.propertyTaxOption] ?? input.propertyTaxOption,
    input.propertyTaxAmount || "",
    input.propertyTaxLegalDate || "",
  ];

  const mortgageRow = [
    input.mortgageName,
    input.mortgagePrincipal,
    input.mortgageMaxClaim,
    input.mortgageRegDate,
  ];

  buildSheet(wb, "매각·근저당", [
    { title: "매각 정보", columns: BASIC_COLUMNS, rows: [basicRow] },
    { title: "근저당", columns: MORTGAGE_COLUMNS, rows: [mortgageRow], isGreen: true },
  ]);

  // 세입자 목록 (내 정보 + 다른 세입자)
  const myRow = [
    input.myName || "나",
    input.myDeposit,
    input.myOpposabilityDate,
    input.myHasOccupancy ? "예" : "아니오",
  ];

  const otherRows = input.otherTenants.map((t) => [
    t.name,
    t.deposit,
    t.opposabilityDate,
    t.hasOccupancy ? "예" : "아니오",
  ]);

  buildSheet(wb, "세입자 목록", [
    { title: "세입자", columns: TENANT_COLUMNS, rows: [myRow, ...otherRows], isGreen: true },
  ]);

};

export const buildSimulationInputWorkbook = (input: ISimulationInput): XLSX.WorkBook => {
  const wb = XLSX.utils.book_new();
  appendSimulationInputSheets(wb, input);
  return wb;
};

const appendSimulationResultSheet = (
  wb: XLSX.WorkBook,
  result: ISimulationResult,
) => {
  const resultRows = result.rows.map((row) => [
    row.step,
    row.category,
    row.creditorName,
    row.keyDate ?? "",
    row.claimAmount,
    row.distributedAmount,
    row.remainingPool,
    row.note ?? "",
  ]);

  buildSheet(wb, "배당 결과", [
    { title: "배당 결과", columns: RESULT_COLUMNS, rows: resultRows, isGreen: true },
  ]);
};

export const buildSimulationResultWorkbook = (
  input: ISimulationInput,
  result: ISimulationResult,
): XLSX.WorkBook => {
  const wb = XLSX.utils.book_new();
  appendSimulationInputSheets(wb, input);
  appendSimulationResultSheet(wb, result);
  return wb;
};

export const downloadSimulationExcel = (
  input: ISimulationInput,
  filename = "배당시뮬레이션_데이터"
) => {
  const wb = buildSimulationInputWorkbook(input);
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const downloadSimulationResultExcel = (
  input: ISimulationInput,
  result: ISimulationResult,
  filename = "배당시뮬레이션_결과"
) => {
  const wb = buildSimulationResultWorkbook(input, result);
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

// ── 빈 양식 ──

export const downloadTemplate = () => {
  const wb = XLSX.utils.book_new();

  buildSheet(wb, "매각·근저당", [
    { title: "매각 정보", columns: BASIC_COLUMNS, rows: [[]] },
    { title: "근저당", columns: MORTGAGE_COLUMNS, rows: [[]], isGreen: true },
  ]);

  // 세입자: 빈 20행 (충분한 여유)
  const emptyRows = Array.from({ length: 20 }, () => ([] as unknown[]));
  buildSheet(wb, "세입자 목록", [
    { title: "세입자", columns: TENANT_COLUMNS, rows: emptyRows, isGreen: true },
  ]);

  XLSX.writeFile(wb, "배당시뮬레이션_양식.xlsx");
};
