import type {
  BidRateOption,
  SimulationFormErrors,
} from "@/app/simulate/helpers";
import type { IOtherTenant, ISimulationInput } from "@/types/simulation";

export type AppraisalMode = "known" | "unknown";

export type SimulationInputUpdater = (
  partial: Partial<ISimulationInput>,
) => void;

export interface ISalePriceSectionProps {
  input: ISimulationInput;
  appraisalMode: AppraisalMode;
  appraisalValue: number;
  isSold: boolean;
  bidRateOption: BidRateOption;
  customBidRate: number;
  errors: SimulationFormErrors;
  onAppraisalModeChange: (mode: AppraisalMode) => void;
  onAppraisalValueChange: (value: number) => void;
  onSoldStateChange: (value: boolean) => void;
  onBidRateSelect: (option: BidRateOption, baseAmount: number) => void;
  onCustomBidRateChange: (rate: number, baseAmount: number) => void;
  onInputChange: SimulationInputUpdater;
}

export interface IMyTenantSectionProps {
  input: ISimulationInput;
  errors: SimulationFormErrors;
  onInputChange: SimulationInputUpdater;
}

export interface IPropertySectionProps {
  input: ISimulationInput;
  address: string;
  errors: SimulationFormErrors;
  detectedRegionLabel: string | null;
  thresholdDepositMax: number | null;
  thresholdPriorityMax: number | null;
  onAddressChange: (address: string) => void;
  onAddressSearch: (data: { address: string; sido: string; sigungu: string }) => void;
  onInputChange: SimulationInputUpdater;
  onRegionChange: (value: string) => void;
  onPropertyTypeChange: (value: string) => void;
}

export interface IOptionalSectionProps {
  input: ISimulationInput;
  errors: SimulationFormErrors;
  hasMyTenant: boolean;
  onInputChange: SimulationInputUpdater;
  onAddOtherTenant: () => void;
  onUpdateOtherTenant: (tenantId: string, tenant: IOtherTenant) => void;
  onRemoveOtherTenant: (tenantId: string) => void;
}
