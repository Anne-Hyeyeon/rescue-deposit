import * as XLSX from "xlsx";

import { buildSimulationInputWorkbook } from "@/lib/excel/generator";
import { parseSimulationExcel } from "@/lib/excel/parser";
import type { ISimulationInput } from "@/types/simulation";

// ── Helper: WorkBook → File-like object ──

const workbookToFile = (wb: XLSX.WorkBook, filename = "test.xlsx"): File => {
  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return new File([buf], filename, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
};

// ── Test data ──

const fullInput: ISimulationInput = {
  salePrice: 1_784_756_000,
  executionCost: 9_811_568,
  appraisalValue: 2_230_942_880,
  myName: "김○○",
  myDeposit: 160_000_000,
  myOpposabilityDate: "2020-08-24",
  myHasOccupancy: true,
  mortgageName: "○○저축은행",
  mortgagePrincipal: 784_560_000,
  mortgageMaxClaim: 784_560_000,
  mortgageRegDate: "2017-12-04",
  propertyType: "multi_family",
  region: "seoul",
  propertyTaxOption: "no",
  propertyTaxAmount: 0,
  propertyTaxLegalDate: "",
  otherTenants: [
    { id: "t-01", name: "서○○", deposit: 150_000_000, opposabilityDate: "2019-12-02", hasOccupancy: true },
    { id: "t-02", name: "노○○", deposit: 300_000_000, opposabilityDate: "2019-12-27", hasOccupancy: true },
  ],
};

const noMyDepositInput: ISimulationInput = {
  salePrice: 2_010_000_000,
  executionCost: 11_055_000,
  appraisalValue: 0,
  myName: "",
  myDeposit: 0,
  myOpposabilityDate: "",
  myHasOccupancy: true,
  mortgageName: "근저당권자",
  mortgagePrincipal: 866_000_000,
  mortgageMaxClaim: 866_000_000,
  mortgageRegDate: "2020-09-03",
  propertyType: "multi_family",
  region: "seoul",
  propertyTaxOption: "unknown",
  propertyTaxAmount: 0,
  propertyTaxLegalDate: "",
  otherTenants: [
    { id: "t-01", name: "정○○", deposit: 130_000_000, opposabilityDate: "2020-09-04", hasOccupancy: true },
    { id: "t-02", name: "조○○", deposit: 100_000_000, opposabilityDate: "2020-09-27", hasOccupancy: true },
  ],
};

// ── Tests ──

describe("parseSimulationExcel", () => {
  describe("roundtrip: generate -> parse", () => {
    it("parses back full input with my deposit correctly", async () => {
      const wb = buildSimulationInputWorkbook(fullInput);
      const file = workbookToFile(wb);
      const result = await parseSimulationExcel(file);

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.salePrice).toBe(fullInput.salePrice);
      expect(result.data.executionCost).toBe(fullInput.executionCost);
      expect(result.data.appraisalValue).toBe(fullInput.appraisalValue);
      expect(result.data.mortgageMaxClaim).toBe(fullInput.mortgageMaxClaim);
      expect(result.data.mortgageRegDate).toBe(fullInput.mortgageRegDate);
      expect(result.data.myName).toBe(fullInput.myName);
      expect(result.data.myDeposit).toBe(fullInput.myDeposit);
      expect(result.data.myOpposabilityDate).toBe(fullInput.myOpposabilityDate);
      expect(result.data.otherTenants).toHaveLength(2);
      expect(result.data.otherTenants[0].deposit).toBe(150_000_000);
      expect(result.data.otherTenants[1].deposit).toBe(300_000_000);
    });

    it("parses back input without my deposit (only other tenants)", async () => {
      const wb = buildSimulationInputWorkbook(noMyDepositInput);
      const file = workbookToFile(wb);
      const result = await parseSimulationExcel(file);

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.salePrice).toBe(noMyDepositInput.salePrice);
      expect(result.data.myDeposit).toBe(0);
      expect(result.data.myName).toBe("");
      expect(result.data.otherTenants.length).toBeGreaterThanOrEqual(2);
      expect(result.data.otherTenants[0].deposit).toBe(130_000_000);
    });
  });

  describe("validation", () => {
    it("rejects file without sheets", async () => {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["foo"]]), "잘못된시트");
      const file = workbookToFile(wb);
      const result = await parseSimulationExcel(file);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("매각·근저당");
      }
    });

    it("rejects file with empty data row", async () => {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([
        ["매각가격 *", "집행비용"],
        ["설명", "설명"],
        // no data row
      ]);
      XLSX.utils.book_append_sheet(wb, ws, "매각·근저당");
      const file = workbookToFile(wb);
      const result = await parseSimulationExcel(file);

      expect(result.success).toBe(false);
    });

    it("rejects file without sale price", async () => {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([
        ["매각가격 *", "채권최고액 *", "설정일 *"],
        ["설명", "설명", "설명"],
        [0, 100_000_000, "2020-01-01"],
      ]);
      XLSX.utils.book_append_sheet(wb, ws, "매각·근저당");
      const file = workbookToFile(wb);
      const result = await parseSimulationExcel(file);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("매각가격");
      }
    });

    it("rejects when no tenants at all", async () => {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([
        ["매각가격 *", "채권최고액 *", "설정일 *"],
        ["설명", "설명", "설명"],
        [500_000_000, 100_000_000, "2020-01-01"],
      ]);
      XLSX.utils.book_append_sheet(wb, ws, "매각·근저당");
      const file = workbookToFile(wb);
      const result = await parseSimulationExcel(file);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("세입자");
      }
    });

    it("rejects when myDeposit > 0 but no opposability date", async () => {
      const wb = XLSX.utils.book_new();
      const basicWs = XLSX.utils.aoa_to_sheet([
        ["매각가격 *", "채권최고액 *", "설정일 *"],
        ["설명", "설명", "설명"],
        [500_000_000, 100_000_000, "2020-01-01"],
      ]);
      XLSX.utils.book_append_sheet(wb, basicWs, "매각·근저당");

      const tenantWs = XLSX.utils.aoa_to_sheet([
        ["이름", "보증금 *", "대항력 발생일 *", "점유 여부"],
        ["설명", "설명", "설명", "설명"],
        ["나", 50_000_000, "", "예"],
      ]);
      XLSX.utils.book_append_sheet(wb, tenantWs, "세입자 목록");
      const file = workbookToFile(wb);
      const result = await parseSimulationExcel(file);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("대항력 발생일");
      }
    });
  });

  describe("edge cases", () => {
    it("handles date as Excel serial number", async () => {
      const wb = XLSX.utils.book_new();
      const basicWs = XLSX.utils.aoa_to_sheet([
        ["매각가격 *", "채권최고액 *", "설정일 *"],
        ["설명", "설명", "설명"],
        [500_000_000, 100_000_000, 44105], // 44105 = 2020-10-01
      ]);
      XLSX.utils.book_append_sheet(wb, basicWs, "매각·근저당");

      const tenantWs = XLSX.utils.aoa_to_sheet([
        ["이름", "보증금 *", "대항력 발생일 *", "점유 여부"],
        ["설명", "설명", "설명", "설명"],
        ["테스트", 50_000_000, 44106, "예"],
      ]);
      XLSX.utils.book_append_sheet(wb, tenantWs, "세입자 목록");
      const file = workbookToFile(wb);
      const result = await parseSimulationExcel(file);

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.mortgageRegDate).toBe("2020-10-01");
      expect(result.data.myOpposabilityDate).toBe("2020-10-02");
    });

    it("handles date with slash separators", async () => {
      const wb = XLSX.utils.book_new();
      const basicWs = XLSX.utils.aoa_to_sheet([
        ["매각가격 *", "채권최고액 *", "설정일 *"],
        ["설명", "설명", "설명"],
        [500_000_000, 100_000_000, "2020/10/01"],
      ]);
      XLSX.utils.book_append_sheet(wb, basicWs, "매각·근저당");

      const tenantWs = XLSX.utils.aoa_to_sheet([
        ["이름", "보증금 *", "대항력 발생일 *", "점유 여부"],
        ["설명", "설명", "설명", "설명"],
        ["테스트", 50_000_000, "2020/10/02", "예"],
      ]);
      XLSX.utils.book_append_sheet(wb, tenantWs, "세입자 목록");
      const file = workbookToFile(wb);
      const result = await parseSimulationExcel(file);

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.mortgageRegDate).toBe("2020-10-01");
      expect(result.data.myOpposabilityDate).toBe("2020-10-02");
    });

    it("skips empty tenant rows gracefully", async () => {
      const wb = XLSX.utils.book_new();
      const basicWs = XLSX.utils.aoa_to_sheet([
        ["매각가격 *", "채권최고액 *", "설정일 *"],
        ["설명", "설명", "설명"],
        [500_000_000, 100_000_000, "2020-01-01"],
      ]);
      XLSX.utils.book_append_sheet(wb, basicWs, "매각·근저당");

      const tenantWs = XLSX.utils.aoa_to_sheet([
        ["이름", "보증금 *", "대항력 발생일 *", "점유 여부"],
        ["설명", "설명", "설명", "설명"],
        ["", 0, "", ""],       // empty - should skip
        ["홍길동", 50_000_000, "2020-06-01", "예"],
        ["", 0, "", ""],       // empty - should skip
        ["", 0, "", ""],       // empty - should skip
      ]);
      XLSX.utils.book_append_sheet(wb, tenantWs, "세입자 목록");
      const file = workbookToFile(wb);
      const result = await parseSimulationExcel(file);

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.myDeposit).toBe(50_000_000);
      expect(result.data.myName).toBe("홍길동");
      expect(result.data.otherTenants).toHaveLength(0);
    });

    it("handles numbered option inputs (1=다가구, 1=서울, etc.)", async () => {
      const wb = XLSX.utils.book_new();
      const basicWs = XLSX.utils.aoa_to_sheet([
        ["매각가격 *", "건물 유형", "지역", "재산세 납부", "채권최고액 *", "설정일 *"],
        ["설명", "설명", "설명", "설명", "설명", "설명"],
        [500_000_000, 1, 2, 3, 100_000_000, "2020-01-01"],
      ]);
      XLSX.utils.book_append_sheet(wb, basicWs, "매각·근저당");

      const tenantWs = XLSX.utils.aoa_to_sheet([
        ["이름", "보증금", "대항력 발생일", "점유 여부"],
        ["설명", "설명", "설명", "설명"],
        ["테스트", 50_000_000, "2020-06-01", 2],
      ]);
      XLSX.utils.book_append_sheet(wb, tenantWs, "세입자 목록");
      const file = workbookToFile(wb);
      const result = await parseSimulationExcel(file);

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.propertyType).toBe("multi_family");
      expect(result.data.region).toBe("metropolitan_overcrowded");
      expect(result.data.propertyTaxOption).toBe("unknown");
      expect(result.data.myHasOccupancy).toBe(false);
    });

    it("handles notice row + label column format (new template)", async () => {
      const wb = buildSimulationInputWorkbook(fullInput);
      const file = workbookToFile(wb);
      const result = await parseSimulationExcel(file);

      expect(result.success).toBe(true);
      if (!result.success) return;

      // Verify the new format with notice row still parses correctly
      expect(result.data.salePrice).toBe(fullInput.salePrice);
      expect(result.data.mortgageMaxClaim).toBe(fullInput.mortgageMaxClaim);
      expect(result.data.myDeposit).toBe(fullInput.myDeposit);
    });

    it("treats file title from filename", async () => {
      const wb = buildSimulationInputWorkbook(fullInput);
      const file = workbookToFile(wb, "2023타경5053_배당표.xlsx");
      const result = await parseSimulationExcel(file);

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.title).toBe("2023타경5053_배당표");
    });
  });
});
