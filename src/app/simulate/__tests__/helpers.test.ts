import {
  buildResultViewModel,
  canAccessSimulationResult,
  createEmptyOtherTenant,
  defaultVisibleOtherTenants,
  hasMyTenantInput,
  hasValidOtherTenant,
  validateSimulationInput,
} from "@/app/simulate/helpers";
import { defaultSimulationInput, type ISimulationInput } from "@/types/simulation";

const createInput = (
  overrides: Partial<ISimulationInput> = {},
): ISimulationInput => ({
  ...defaultSimulationInput,
  salePrice: 2_010_000_000,
  executionCost: 10_000_000,
  mortgageRegDate: "2020-09-03",
  mortgageMaxClaim: 866_000_000,
  ...overrides,
});

describe("simulate helpers", () => {
  it("treats my tenant input as optional when deposit is zero", () => {
    expect(hasMyTenantInput(createInput())).toBe(false);
    expect(
      hasMyTenantInput(
        createInput({
          myDeposit: 100_000_000,
          myOpposabilityDate: "2022-07-04",
        }),
      ),
    ).toBe(true);
  });

  it("recognizes a valid other tenant only when deposit and date exist", () => {
    expect(hasValidOtherTenant(createEmptyOtherTenant())).toBe(false);
    expect(
      hasValidOtherTenant({
        ...createEmptyOtherTenant(),
        deposit: 120_000_000,
        opposabilityDate: "2022-07-04",
      }),
    ).toBe(true);
  });

  it("requires another tenant when my deposit is empty", () => {
    const errors = validateSimulationInput(
      createInput({
        otherTenants: [createEmptyOtherTenant()],
      }),
    );

    expect(errors.myDeposit).toBeUndefined();
    expect(errors.myOpposabilityDate).toBeUndefined();
    expect(errors.otherTenants).toBe("다른 세입자 정보를 1명 이상 입력해주세요");
  });

  it("allows submission without other tenants when my deposit exists", () => {
    const errors = validateSimulationInput(
      createInput({
        myDeposit: 130_000_000,
        myOpposabilityDate: "2022-07-04",
        otherTenants: [createEmptyOtherTenant()],
      }),
    );

    expect(errors.otherTenants).toBeUndefined();
  });

  it("requires my opposability date before asking for other tenants", () => {
    const errors = validateSimulationInput(
      createInput({
        myDeposit: 130_000_000,
        myOpposabilityDate: "",
        otherTenants: [createEmptyOtherTenant()],
      }),
    );

    expect(errors.myOpposabilityDate).toBe("대항력 발생일을 입력해주세요");
    expect(errors.otherTenants).toBeUndefined();
  });

  it("normalizes empty other tenant rows for the initial screen", () => {
    expect(defaultVisibleOtherTenants([])).toHaveLength(1);
    expect(
      defaultVisibleOtherTenants([
        { ...createEmptyOtherTenant(), deposit: 100_000_000, opposabilityDate: "2022-07-04" },
      ]),
    ).toHaveLength(1);
  });

  it("allows result access without my deposit when another tenant is valid", () => {
    const input = createInput({
      otherTenants: [
        {
          ...createEmptyOtherTenant(),
          deposit: 120_000_000,
          opposabilityDate: "2022-07-04",
        },
      ],
    });

    expect(canAccessSimulationResult(input)).toBe(true);
    expect(buildResultViewModel(input)).toEqual({
      showHero: false,
      showRiskPanel: false,
      highlightMyTenant: false,
    });
  });

  it("shows personal summary when my deposit exists", () => {
    const input = createInput({
      myDeposit: 120_000_000,
      myOpposabilityDate: "2022-07-04",
    });

    expect(canAccessSimulationResult(input)).toBe(true);
    expect(buildResultViewModel(input)).toEqual({
      showHero: true,
      showRiskPanel: true,
      highlightMyTenant: true,
    });
  });
});
