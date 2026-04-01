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

export type DemoSource = "my" | "prod" | 1 | 2 | 3 | 4 | null;

interface IDemoCaseConfig {
  input: ISimulationInput;
  address: string;
  appraisalValue: number;
  emoji: string;
  title: string;
  description: string;
  devOnly?: boolean;
}

const IS_DEV = process.env.NODE_ENV === "development";

// 프로덕션용 랜덤 이름
const RANDOM_NAMES = [
  "이지은", "박서준", "김하늘", "정우성", "송혜교",
  "한지민", "조인성", "유아인", "전지현", "강동원",
  "배수지", "이준기", "고윤정", "차은우", "문가영",
  "김수현", "박보검",
];

const randomizeTenantNames = (input: ISimulationInput): ISimulationInput => {
  const shuffled = [...RANDOM_NAMES].sort(() => Math.random() - 0.5);
  return {
    ...input,
    myName: shuffled[0],
    otherTenants: input.otherTenants.map((t, i) => ({
      ...t,
      name: shuffled[(i + 1) % shuffled.length],
    })),
  };
};

export const getProdDemoInput = (): ISimulationInput =>
  randomizeTenantNames(DEMO_SIMULATION_INPUT);

export const DEMO_CASES: Record<1 | 2 | 3 | 4, IDemoCaseConfig> = {
  1: {
    input: DEMO_SIMULATION_INPUT,
    address: DEMO_SIMULATION_ADDRESS,
    appraisalValue: 2_230_942_880,
    emoji: "\u2696\uFE0F",
    title: "실제 사례: 서울중앙지법 2023타경5053",
    description: "다가구 \u00B7 낙찰가 17.8억 \u00B7 감정가 22.3억 \u00B7 임차인 17명",
    devOnly: true,
  },
  2: {
    input: DEMO_SIMULATION_INPUT_2,
    address: DEMO_SIMULATION_ADDRESS_2,
    appraisalValue: 2_383_575_800,
    emoji: "\uD83C\uDFE2",
    title: "실제 사례: 2021년 근저당 (26명)",
    description: "다가구 \u00B7 근저당 12.96억 \u00B7 낙찰가 16억 \u00B7 임차인 26명",
    devOnly: true,
  },
  3: {
    input: DEMO_SIMULATION_INPUT_3,
    address: DEMO_SIMULATION_ADDRESS_3,
    appraisalValue: 0,
    emoji: "\uD83C\uDFD8\uFE0F",
    title: "실제 사례: 2017년 근저당 (20명)",
    description: "다가구 \u00B7 근저당 9억 \u00B7 낙찰가 17.3억 \u00B7 임차인 20명",
    devOnly: true,
  },
  4: {
    input: DEMO_SIMULATION_INPUT_4,
    address: DEMO_SIMULATION_ADDRESS_4,
    appraisalValue: 0,
    emoji: "\uD83C\uDFDA\uFE0F",
    title: "실제 사례: 2020년 근저당 (25명)",
    description: "다가구 \u00B7 근저당 8.66억 \u00B7 낙찰가 20.1억 \u00B7 임차인 25명",
    devOnly: true,
  },
} as const;

export const VISIBLE_DEMO_KEYS = IS_DEV
  ? ([1, 2, 3, 4] as const)
  : ([] as const);

export const PROD_DEMO = {
  emoji: "\u2696\uFE0F",
  title: "실제 사례: 서울중앙지법 2023타경5053",
  description: "다가구 \u00B7 낙찰가 17.8억 \u00B7 감정가 22.3억 \u00B7 임차인 17명",
  address: DEMO_SIMULATION_ADDRESS,
  appraisalValue: 2_230_942_880,
} as const;
