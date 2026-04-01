import * as XLSX from "xlsx";

import { buildSimulationResultWorkbook } from "@/lib/excel/generator";
import type { ISimulationInput, ISimulationResult } from "@/types/simulation";

const createInput = (): ISimulationInput => ({
  salePrice: 2_010_000_000,
  executionCost: 11_055_000,
  appraisalValue: 2_300_000_000,
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
    {
      id: "tenant-1",
      name: "정○○(503)",
      deposit: 130_000_000,
      opposabilityDate: "2020-09-04",
      hasOccupancy: true,
    },
  ],
});

const createResult = (): ISimulationResult => ({
  salePrice: 2_010_000_000,
  executionCost: 11_055_000,
  myDistributedAmount: 0,
  remainingBalance: 100_000_000,
  rows: [
    {
      step: "집행비용",
      category: "집행비용",
      creditorId: "execution_cost",
      creditorName: "집행기관",
      claimAmount: 11_055_000,
      distributedAmount: 11_055_000,
      remainingPool: 1_998_945_000,
      isMyTenant: false,
    },
    {
      step: "STEP 3",
      category: "확정일자 임차인",
      creditorId: "tenant-1",
      creditorName: "정○○(503)",
      claimAmount: 130_000_000,
      distributedAmount: 130_000_000,
      remainingPool: 1_868_945_000,
      isMyTenant: false,
      keyDate: "2020-09-04",
      note: "확정일자 임차인",
    },
  ],
});

describe("buildSimulationResultWorkbook", () => {
  it("creates workbook with input sheets and result sheet", () => {
    const workbook = buildSimulationResultWorkbook(createInput(), createResult());

    expect(workbook.SheetNames).toEqual(["매각·근저당", "세입자 목록", "배당 결과"]);
  });

  it("writes result rows into the result sheet", () => {
    const workbook = buildSimulationResultWorkbook(createInput(), createResult());
    const sheet = workbook.Sheets["배당 결과"];
    const rows = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, {
      header: 1,
      raw: true,
    });

    expect(rows[0]).toEqual([
      "순서",
      "구분",
      "채권자",
      "일자",
      "채권액",
      "배당액",
      "잔액",
      "비고",
    ]);
    // Row 0=header, Row 1=desc, Row 2+=data (result sheet has no notice row)
    expect(rows[2]).toEqual([
      "집행비용",
      "집행비용",
      "집행기관",
      "",
      11_055_000,
      11_055_000,
      1_998_945_000,
      "",
    ]);
    expect(rows[3]).toEqual([
      "STEP 3",
      "확정일자 임차인",
      "정○○(503)",
      "2020-09-04",
      130_000_000,
      130_000_000,
      1_868_945_000,
      "확정일자 임차인",
    ]);
  });
});
