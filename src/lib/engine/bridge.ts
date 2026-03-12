import { calculateDistribution } from "./index";
import type {
  ISimulationInput,
  ISimulationResult,
} from "@/types/simulation";
import {
  buildAuctionCase,
  buildCreditors,
  buildDateLookup,
  buildStoreRows,
  calculateMyDistributedAmount,
} from "@/lib/engine/bridge-helpers";

export const runSimulation = (input: ISimulationInput): ISimulationResult => {
  const auctionCase = buildAuctionCase(input);
  const creditors = buildCreditors(input);
  const engineResult = calculateDistribution(auctionCase, creditors);
  const dateLookup = buildDateLookup(creditors);
  const storeRows = buildStoreRows(input, engineResult, dateLookup);
  const myDistributedAmount = calculateMyDistributedAmount(engineResult.rows);

  return {
    salePrice: input.salePrice,
    executionCost: input.executionCost,
    rows: storeRows,
    myDistributedAmount,
    remainingBalance: engineResult.remainder,
  };
};
