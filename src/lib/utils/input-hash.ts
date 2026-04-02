import type { ISimulationInput } from "@/types/simulation";

const canonicalizeInput = (input: ISimulationInput) => {
  const tenants = [...input.otherTenants]
    .map((t) => ({
      deposit: t.deposit,
      opposabilityDate: t.opposabilityDate,
      hasOccupancy: t.hasOccupancy,
    }))
    .sort((a, b) =>
      a.opposabilityDate.localeCompare(b.opposabilityDate) ||
      a.deposit - b.deposit,
    );

  return {
    salePrice: input.salePrice,
    executionCost: input.executionCost,
    appraisalValue: input.appraisalValue,
    myDeposit: input.myDeposit,
    myOpposabilityDate: input.myOpposabilityDate,
    myHasOccupancy: input.myHasOccupancy,
    mortgagePrincipal: input.mortgagePrincipal,
    mortgageMaxClaim: input.mortgageMaxClaim,
    mortgageRegDate: input.mortgageRegDate,
    propertyType: input.propertyType,
    region: input.region,
    propertyTaxOption: input.propertyTaxOption,
    propertyTaxAmount: input.propertyTaxAmount,
    propertyTaxLegalDate: input.propertyTaxLegalDate,
    tenants,
  };
};

export const computeInputHash = async (
  input: ISimulationInput,
): Promise<string> => {
  const canonical = canonicalizeInput(input);
  const json = JSON.stringify(canonical);
  const encoder = new TextEncoder();
  const data = encoder.encode(json);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};
