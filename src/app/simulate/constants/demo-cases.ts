import type { ISimulationInput } from "@/types/simulation";
import {
  DEMO_SIMULATION_INPUT,
  DEMO_SIMULATION_INPUT_2,
  DEMO_SIMULATION_INPUT_3,
  DEMO_SIMULATION_INPUT_4,
  DEMO_SIMULATION_ADDRESS,
  DEMO_SIMULATION_ADDRESS_2,
  DEMO_SIMULATION_ADDRESS_3,
  DEMO_SIMULATION_ADDRESS_4,
} from "@/app/simulate/helpers";

export type DemoSource = "my" | 1 | 2 | 3 | 4 | null;

interface IDemoCaseConfig {
  input: ISimulationInput;
  address: string;
  appraisalValue: number;
  emoji: string;
  title: string;
  description: string;
}

export const DEMO_CASES: Record<1 | 2 | 3 | 4, IDemoCaseConfig> = {
  1: {
    input: DEMO_SIMULATION_INPUT,
    address: DEMO_SIMULATION_ADDRESS,
    appraisalValue: 2_230_942_880,
    emoji: "\u2696\uFE0F",
    title: "실제 사례 1: 2017년 근저당",
    description: "다가구 \u00B7 낙찰가 17.8억 \u00B7 감정가 22.3억 \u00B7 임차인 17명",
  },
  2: {
    input: DEMO_SIMULATION_INPUT_2,
    address: DEMO_SIMULATION_ADDRESS_2,
    appraisalValue: 2_383_575_800,
    emoji: "\uD83C\uDFE2",
    title: "실제 사례 2: 2021년 근저당",
    description: "다가구 \u00B7 근저당 12.96억 \u00B7 낙찰가 16억 \u00B7 임차인 26명",
  },
  3: {
    input: DEMO_SIMULATION_INPUT_3,
    address: DEMO_SIMULATION_ADDRESS_3,
    appraisalValue: 0,
    emoji: "\uD83C\uDFD8\uFE0F",
    title: "실제 사례 3: 2017년 근저당",
    description: "다가구 \u00B7 근저당 9억 \u00B7 낙찰가 17.3억 \u00B7 임차인 20명",
  },
  4: {
    input: DEMO_SIMULATION_INPUT_4,
    address: DEMO_SIMULATION_ADDRESS_4,
    appraisalValue: 0,
    emoji: "\uD83C\uDFDA\uFE0F",
    title: "실제 사례 4: 2020년 근저당",
    description: "다가구 \u00B7 근저당 8.66억 \u00B7 낙찰가 20.1억 \u00B7 임차인 25명",
  },
} as const;
