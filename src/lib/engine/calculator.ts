import type {
  IAuctionCase,
  ICreditor,
  IStepResult,
  IDistributionResult,
} from "./types";
import { resolveRegion } from "./region";
import { preprocessSubrogation, computeTenantDates } from "./preprocessing";
import { classifyAbsoluteSmallTenants } from "./classification";
import { step1AbsolutePriority } from "./steps/step1";
import { step2PropertyTax } from "./steps/step2";
import { step3DateCompetition } from "./steps/step3";
import { step4To7LowerPriority } from "./steps/step4to7";

// ===== Main Function =====

export const calculateDistribution = (
  auctionCase: IAuctionCase,
  creditors: ReadonlyArray<ICreditor>
): IDistributionResult => {
  // Step 0: Basic calculations
  const totalFund =
    auctionCase.salePrice +
    auctionCase.saleInterest +
    auctionCase.delayInterest +
    auctionCase.priorDeposit +
    auctionCase.appealDeposit;

  const initialRemaining = totalFund - auctionCase.executionCost;
  const halfOfPropertyValue = Math.floor(initialRemaining / 2);

  // Resolve region
  const region = auctionCase.address
    ? resolveRegion(auctionCase.address, auctionCase.baseRightDate)
    : auctionCase.region!;

  // Preprocess subrogation
  const preprocessed = preprocessSubrogation(creditors);

  // Compute tenant dates (no classification yet)
  const tenants = computeTenantDates(preprocessed);

  // Classify absolute small tenants
  const absoluteSmalls = classifyAbsoluteSmallTenants(
    tenants,
    region,
    auctionCase.baseRightDate
  );

  // STEP 1-7: reduce pipeline
  const steps = [
    (state: IStepResult) =>
      step1AbsolutePriority(
        absoluteSmalls,
        preprocessed,
        state.remaining,
        halfOfPropertyValue
      ),
    (state: IStepResult) =>
      step2PropertyTax(preprocessed, tenants, state.remaining),
    (state: IStepResult) =>
      step3DateCompetition(
        preprocessed,
        tenants,
        absoluteSmalls,
        state.remaining,
        region,
        auctionCase.baseRightDate
      ),
    (state: IStepResult) =>
      step4To7LowerPriority(preprocessed, state.remaining),
  ] as const;

  const finalResult = steps.reduce<IStepResult>(
    (acc, stepFn) => {
      const result = stepFn(acc);
      return {
        rows: [...acc.rows, ...result.rows],
        remaining: result.remaining,
      };
    },
    { rows: [], remaining: initialRemaining }
  );

  // Re-number rows
  const rows = finalResult.rows.map((row, i) => ({ ...row, order: i + 1 }));

  return {
    totalFund,
    executionCost: auctionCase.executionCost,
    distributableFund: initialRemaining,
    halfOfPropertyValue,
    rows,
    remainder: finalResult.remaining,
  };
};
