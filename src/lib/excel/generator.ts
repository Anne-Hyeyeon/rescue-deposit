import * as XLSX from "xlsx";
import type { ISimulationInput, ISimulationResult } from "@/types/simulation";

// ── 라벨 맵 ──

const REGION_NUMBERS: Record<string, number> = {
  seoul: 1,
  metropolitan_overcrowded: 2,
  metropolitan: 3,
  others: 4,
};

const PROPERTY_TYPE_NUMBERS: Record<string, number> = {
  multi_family: 1,
  multi_unit: 2,
};

const PROPERTY_TAX_NUMBERS: Record<string, number> = {
  yes: 1,
  no: 2,
  unknown: 3,
};

const OCCUPANCY_NUMBER = (val: boolean): number => val ? 1 : 2;

// ── 스타일 ──

const HEADER_FILL = { fgColor: { rgb: "4472C4" } };
const DESC_FILL = { fgColor: { rgb: "D6E4F0" } };
const SECTION_FILL = { fgColor: { rgb: "E2EFDA" } };
const SECTION_DESC_FILL = { fgColor: { rgb: "F0F5EB" } };

function thinBorder() {
  const side = { style: "thin" as const, color: { rgb: "CCCCCC" } };
  return { top: side, bottom: side, left: side, right: side };
}

const noticeStyle = {
  font: { color: { rgb: "CC0000" }, sz: 10, bold: true },
  alignment: { horizontal: "left" as const, vertical: "center" as const },
};

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

const labelStyle = {
  font: { color: { rgb: "999999" }, sz: 9, italic: true },
  alignment: { horizontal: "center" as const, vertical: "center" as const },
};

// ── 컬럼 정의 ──

interface IColumnDef {
  header: string;
  desc: string;
  width: number;
}

const BASIC_COLUMNS: IColumnDef[] = [
  { header: "매각가격 *", desc: "필수 · 낙찰가", width: 18 },
  { header: "집행비용", desc: "선택 · 경매 집행비용", width: 20 },
  { header: "감정가", desc: "선택 · 감정평가액", width: 18 },
  { header: "건물 유형", desc: "1. 다가구  2. 다세대/연립", width: 22 },
  { header: "지역", desc: "1. 서울  2. 수도권 과밀억제권역  3. 광역시  4. 기타", width: 34 },
  { header: "재산세 납부", desc: "1. 있음  2. 없음  3. 모름", width: 18 },
  { header: "재산세 금액", desc: "선택", width: 14 },
  { header: "재산세 법정기일", desc: "선택 · YYYY-MM-DD", width: 16 },
];

const MORTGAGE_COLUMNS: IColumnDef[] = [
  { header: "근저당권자", desc: "선택 · 이름", width: 14 },
  { header: "채권원금", desc: "선택", width: 18 },
  { header: "채권최고액 *", desc: "필수", width: 18 },
  { header: "설정일 *", desc: "필수 · YYYY-MM-DD", width: 16 },
];

const TENANT_COLUMNS: IColumnDef[] = [
  { header: "이름", desc: "세입자 이름", width: 14 },
  { header: "보증금", desc: "세입자 등록 시 필수", width: 18 },
  { header: "대항력 발생일", desc: "세입자 등록 시 필수 · YYYY-MM-DD", width: 22 },
  { header: "점유 여부", desc: "1. 예  2. 아니오", width: 14 },
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

const NOTICE_TEXT = "* 가격 란에는 숫자만 입력해주세요. 날짜 란에는 YYYY-MM-DD 양식으로 입력해 주세요.";

// ── 시트 빌드 ──

// Row 0: 안내 문구 (merged)
// Row 1: 헤더
// Row 2: 설명 (번호 선택지 포함)
// Row 3~: 데이터 ("ex)" 라벨 포함)

const LABEL_COL_WIDTH = 4;
const DATA_START_ROW = 3;

const buildSheet = (
  wb: XLSX.WorkBook,
  sheetName: string,
  sections: {
    title: string;
    columns: IColumnDef[];
    rows: unknown[][];
    isGreen?: boolean;
  }[],
  options?: { showNotice?: boolean },
): void => {
  const ws: XLSX.WorkSheet = {};
  const showNotice = options?.showNotice ?? false;
  const labelColOffset = showNotice ? 1 : 0;
  let maxCol = labelColOffset;

  // 안내 문구 (Row 0, merged)
  if (showNotice) {
    const totalCols = labelColOffset + sections.reduce((sum, s) => sum + s.columns.length, 0);
    const noticeRef = XLSX.utils.encode_cell({ r: 0, c: 0 });
    ws[noticeRef] = { v: NOTICE_TEXT, t: "s", s: noticeStyle };
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } }];
  }

  let colOffset = labelColOffset;

  for (const section of sections) {
    const cols = section.columns;
    const hStyle = section.isGreen ? sectionHeaderStyle : headerStyle;
    const dStyle = section.isGreen ? sectionDescStyle : descStyle;

    for (let c = 0; c < cols.length; c++) {
      const col = colOffset + c;
      const headerRef = XLSX.utils.encode_cell({ r: showNotice ? 1 : 0, c: col });
      const descRef = XLSX.utils.encode_cell({ r: showNotice ? 2 : 1, c: col });

      ws[headerRef] = { v: cols[c].header, t: "s", s: hStyle };
      ws[descRef] = { v: cols[c].desc, t: "s", s: dStyle };

      const dataRowStart = showNotice ? DATA_START_ROW : 2;
      for (let r = 0; r < section.rows.length; r++) {
        const dataRef = XLSX.utils.encode_cell({ r: r + dataRowStart, c: col });
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

  // "ex)" 라벨 (첫 데이터 행에, 데이터가 있을 때만)
  if (showNotice) {
    const hasData = sections.some((s) =>
      s.rows.some((row) => row.some((cell) => cell !== undefined && cell !== null && cell !== ""))
    );
    if (hasData) {
      const exRef = XLSX.utils.encode_cell({ r: DATA_START_ROW, c: 0 });
      ws[exRef] = { v: "ex)", t: "s", s: labelStyle };
    }
  }

  const dataRowStart = showNotice ? DATA_START_ROW : 2;
  const maxRow = dataRowStart + Math.max(...sections.map((s) => s.rows.length));

  ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: maxRow - 1, c: maxCol - 1 } });

  // 열 너비
  const colWidths: { wch: number }[] = [];
  if (showNotice) colWidths.push({ wch: LABEL_COL_WIDTH });
  for (const s of sections) {
    for (const c of s.columns) {
      colWidths.push({ wch: c.width });
    }
  }
  ws["!cols"] = colWidths;

  // 행 높이
  if (showNotice) {
    ws["!rows"] = [{ hpt: 22 }, { hpt: 24 }, { hpt: 28 }];
  } else {
    ws["!rows"] = [{ hpt: 24 }, { hpt: 28 }];
  }

  XLSX.utils.book_append_sheet(wb, ws, sheetName);
};

// ── 데이터 → 엑셀 ──

const appendSimulationInputSheets = (
  wb: XLSX.WorkBook,
  input: ISimulationInput,
) => {
  const basicRow = [
    input.salePrice,
    input.executionCost,
    input.appraisalValue,
    PROPERTY_TYPE_NUMBERS[input.propertyType] ?? 1,
    REGION_NUMBERS[input.region] ?? 1,
    PROPERTY_TAX_NUMBERS[input.propertyTaxOption] ?? 3,
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
  ], { showNotice: true });

  const myRow = [
    input.myName || "나",
    input.myDeposit,
    input.myOpposabilityDate,
    OCCUPANCY_NUMBER(input.myHasOccupancy),
  ];

  const otherRows = input.otherTenants.map((t) => [
    t.name,
    t.deposit,
    t.opposabilityDate,
    OCCUPANCY_NUMBER(t.hasOccupancy),
  ]);

  buildSheet(wb, "세입자 목록", [
    { title: "세입자", columns: TENANT_COLUMNS, rows: [myRow, ...otherRows], isGreen: true },
  ], { showNotice: true });
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

// ── 빈 양식 (예시 데이터 포함) ──

const EXAMPLE_BASIC_ROW = [
  1_784_756_000, 9_811_568, 2_230_942_880,
  1, 1, 2, "", "",
];

const EXAMPLE_MORTGAGE_ROW = [
  "○○저축은행", 784_560_000, 784_560_000, "2017-12-04",
];

const EXAMPLE_TENANT_ROWS = [
  ["김○○", 160_000_000, "2020-08-24", 1],
  ["서○○", 150_000_000, "2019-12-02", 1],
  ["노○○", 300_000_000, "2019-12-27", 1],
];

export const downloadTemplate = () => {
  const wb = XLSX.utils.book_new();

  const emptyBasicRows = Array.from({ length: 3 }, () => ([] as unknown[]));
  buildSheet(wb, "매각·근저당", [
    { title: "매각 정보", columns: BASIC_COLUMNS, rows: [EXAMPLE_BASIC_ROW, ...emptyBasicRows] },
    { title: "근저당", columns: MORTGAGE_COLUMNS, rows: [EXAMPLE_MORTGAGE_ROW, ...emptyBasicRows], isGreen: true },
  ], { showNotice: true });

  const emptyTenantRows = Array.from({ length: 20 }, () => ([] as unknown[]));
  buildSheet(wb, "세입자 목록", [
    { title: "세입자", columns: TENANT_COLUMNS, rows: [...EXAMPLE_TENANT_ROWS, ...emptyTenantRows], isGreen: true },
  ], { showNotice: true });

  XLSX.writeFile(wb, "배당시뮬레이션_양식.xlsx");
};
