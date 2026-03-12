import { create } from "zustand";
import {
  defaultSimulationInput,
  type ISimulationInput,
  type ISimulationResult,
} from "@/types/simulation";

export type {
  IDistributionRow,
  IOtherTenant,
  PropertyTaxOption,
  PropertyType,
  Region,
  ISimulationInput,
  ISimulationResult,
} from "@/types/simulation";

// ── Store ─────────────────────────────────────────────────────────────────────

interface ISimulationStore {
  input: ISimulationInput;
  result: ISimulationResult | null;
  setInput: (partial: Partial<ISimulationInput>) => void;
  setResult: (result: ISimulationResult | null) => void;
  reset: () => void;
}

export const useSimulationStore = create<ISimulationStore>((set) => ({
  input: defaultSimulationInput,
  result: null,
  setInput: (partial) =>
    set((state) => ({ input: { ...state.input, ...partial } })),
  setResult: (result) => set({ result }),
  reset: () => set({ input: defaultSimulationInput, result: null }),
}));
