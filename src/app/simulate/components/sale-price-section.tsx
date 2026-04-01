"use client";

import {
  formatKRW,
  type BidRateOption,
} from "@/app/simulate/helpers";
import {
  AccordionSection,
  Card,
  FieldLabel,
  FieldTip,
  InfoChip,
  InputField,
  MoneyInput,
  SectionTitle,
} from "@/app/simulate/components/form-primitives";
import type { ISimulationInput } from "@/types/simulation";

import type {
  AppraisalMode,
  ISalePriceSectionProps,
} from "@/app/simulate/components/section-types";

const BID_RATE_OPTIONS = [
  ["100", "100%"],
  ["90", "90%"],
  ["86", "86%"],
  ["80", "80%"],
  ["custom", "직접"],
] as const satisfies ReadonlyArray<readonly [BidRateOption, string]>;

const APPRAISAL_MODE_OPTIONS = [
  ["known", "알고 있어요"],
  ["unknown", "모릅니다"],
] as const satisfies ReadonlyArray<readonly [AppraisalMode, string]>;

const SOLD_STATE_OPTIONS = [
  [true, "네, 낙찰되었어요"],
  [false, "아직 낙찰 전이에요"],
] as const satisfies ReadonlyArray<readonly [boolean, string]>;

interface IAppraisalRateHelperProps {
  appraisalValue: number;
  input: ISimulationInput;
  bidRateOption: BidRateOption;
  customBidRate: number;
  onBidRateSelect: (option: BidRateOption, baseAmount: number) => void;
  onCustomBidRateChange: (rate: number, baseAmount: number) => void;
}

const AppraisalRateHelper = ({
  appraisalValue,
  input,
  bidRateOption,
  customBidRate,
  onBidRateSelect,
  onCustomBidRateChange,
}: IAppraisalRateHelperProps) => (
  <div>
    <p className="mb-2 text-xs font-medium text-sub-text">낙찰가율로 자동 계산</p>
    <div className="grid grid-cols-5 gap-2">
      {BID_RATE_OPTIONS.map(([value, label]) => (
        <button
          key={value}
          type="button"
          onClick={() => onBidRateSelect(value, appraisalValue)}
          className={`rounded-lg border py-2 text-xs font-medium transition-colors duration-150 ${bidRateOption === value ? "border-accent bg-accent-bg text-accent" : "border-card-border bg-background text-sub-text hover:border-accent/50"}`}
        >
          {label}
        </button>
      ))}
    </div>
    {bidRateOption === "custom" && (
      <div className="mt-2 flex items-center gap-2">
        <InputField
          id="customBidRate"
          type="number"
          min={1}
          max={150}
          step={1}
          value={customBidRate}
          onChange={(event) =>
            onCustomBidRateChange(Number(event.target.value), appraisalValue)
          }
          className="max-w-[100px]"
        />
        <span className="text-sm text-sub-text">%</span>
      </div>
    )}
    {bidRateOption !== "none" && input.salePrice > 0 && (
      <InfoChip>
        감정가 {formatKRW(appraisalValue)}의{" "}
        {bidRateOption === "custom" ? customBidRate : bidRateOption}% =
        {" "}
        <strong>{formatKRW(input.salePrice)}</strong>
      </InfoChip>
    )}
  </div>
);

export const SalePriceSection = ({
  input,
  appraisalMode,
  appraisalValue,
  isSold,
  bidRateOption,
  customBidRate,
  errors,
  onAppraisalModeChange,
  onAppraisalValueChange,
  onSoldStateChange,
  onBidRateSelect,
  onCustomBidRateChange,
  onInputChange,
}: ISalePriceSectionProps) => (
  <Card>
    <SectionTitle
      step="Section 1"
      title="건물 감정가 및 예상 매각대금"
      sub="감정가를 알면 낙찰가율로 예상 매각대금을 계산할 수 있어요."
    />

    <fieldset className="mb-4">
      <legend className="mb-3 text-sm font-medium text-foreground">
        건물 감정가를 알고 있나요?
      </legend>
      <div className="flex gap-3">
        {APPRAISAL_MODE_OPTIONS.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => onAppraisalModeChange(value)}
            className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition-colors duration-150 ${appraisalMode === value ? "border-accent bg-accent-bg text-accent" : "border-card-border bg-background text-sub-text hover:border-accent/50"}`}
          >
            {label}
          </button>
        ))}
      </div>
    </fieldset>

    {appraisalMode === "known" ? (
      <div className="flex flex-col gap-4">
        <div>
          <FieldLabel htmlFor="appraisalValue">감정가 (원)</FieldLabel>
          <MoneyInput
            id="appraisalValue"
            value={appraisalValue}
            onChange={onAppraisalValueChange}
            placeholder="500,000,000"
          />
        </div>

        {appraisalValue > 0 && (
          <>
            <fieldset>
              <legend className="mb-3 text-sm font-medium text-foreground">
                건물이 낙찰되었나요?
              </legend>
              <div className="flex gap-3">
                {SOLD_STATE_OPTIONS.map(([value, label]) => (
                  <button
                    key={String(value)}
                    type="button"
                    onClick={() => onSoldStateChange(value)}
                    className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition-colors duration-150 ${isSold === value ? "border-accent bg-accent-bg text-accent" : "border-card-border bg-background text-sub-text hover:border-accent/50"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>

            {isSold ? (
              <div>
                <FieldLabel htmlFor="salePrice-sold">낙찰가 (원)</FieldLabel>
                <MoneyInput
                  id="salePrice-sold"
                  value={input.salePrice}
                  onChange={(value) => onInputChange({ salePrice: value })}
                  placeholder="400,000,000"
                  hasError={!!errors.salePrice}
                />
                {errors.salePrice && (
                  <p className="mt-1 text-xs text-error">{errors.salePrice}</p>
                )}
                {input.salePrice > 0 && appraisalValue > 0 && (
                  <p className="mt-1 text-xs font-medium text-accent">
                    낙찰가율 {((input.salePrice / appraisalValue) * 100).toFixed(1)}%
                  </p>
                )}
              </div>
            ) : (
              <>
                <div>
                  <FieldLabel htmlFor="salePrice-expected">예상 매각대금 (원)</FieldLabel>
                  <MoneyInput
                    id="salePrice-expected"
                    value={input.salePrice}
                    onChange={(value) => onInputChange({ salePrice: value })}
                    placeholder="400,000,000"
                    hasError={!!errors.salePrice}
                  />
                  {errors.salePrice && (
                    <p className="mt-1 text-xs text-error">{errors.salePrice}</p>
                  )}
                </div>
                <AppraisalRateHelper
                  appraisalValue={appraisalValue}
                  input={input}
                  bidRateOption={bidRateOption}
                  customBidRate={customBidRate}
                  onBidRateSelect={onBidRateSelect}
                  onCustomBidRateChange={onCustomBidRateChange}
                />
                <FieldTip label="낙찰가율 안내">
                  <p>
                    <span className="font-medium text-foreground">낙찰가율</span>은
                    감정가 대비 실제 낙찰되는 비율입니다. 유찰될수록 낮아집니다.
                  </p>
                  <div className="mt-1 space-y-0.5">
                    <p><span className="font-medium text-foreground">1회 유찰:</span> 감정가의 80%</p>
                    <p><span className="font-medium text-foreground">2회 유찰:</span> 감정가의 64% (80% x 80%)</p>
                    <p><span className="font-medium text-foreground">3회 유찰:</span> 감정가의 51% (80% x 80% x 80%)</p>
                  </div>
                  <p className="mt-1">서울 다가구 기준 평균 낙찰가율은 약 75~90% 수준입니다.</p>
                </FieldTip>
              </>
            )}
          </>
        )}
      </div>
    ) : (
      <div className="flex flex-col gap-4">
        <div>
          <FieldLabel htmlFor="appraisalGuess">예상 감정가 (원)</FieldLabel>
          <MoneyInput
            id="appraisalGuess"
            value={appraisalValue}
            onChange={onAppraisalValueChange}
            placeholder="500,000,000"
          />
          <FieldTip label="감정가 추정하는 법">
            <p>
              부동산 실거래가 사이트(국토교통부, 네이버 부동산 등)에서
              같은 동네의 비슷한 다가구주택이 <strong>얼마에 거래되었는지</strong> 확인해 보세요.
            </p>
            <p>
              경매 물건은 보통 주변 시세보다 <strong>더 저렴하게</strong> 낙찰되는 경향이 있어,
              인근 거래가를 감정가의 참고 기준으로 삼을 수 있습니다.
            </p>
            <p>
              비교적 최근 지어진 건물이라면 등기부등본이나 건축물대장에서
              <strong> 최초 매입가</strong>를 확인할 수도 있습니다.
            </p>
          </FieldTip>
        </div>

        <div>
          <FieldLabel htmlFor="salePrice-unknown">예상 매각대금 (원)</FieldLabel>
          <MoneyInput
            id="salePrice-unknown"
            value={input.salePrice}
            onChange={(value) => onInputChange({ salePrice: value })}
            placeholder="400,000,000"
            hasError={!!errors.salePrice}
          />
          {errors.salePrice && (
            <p className="mt-1 text-xs text-error" role="alert">
              {errors.salePrice}
            </p>
          )}
        </div>

        {appraisalValue > 0 && (
          <AppraisalRateHelper
            appraisalValue={appraisalValue}
            input={input}
            bidRateOption={bidRateOption}
            customBidRate={customBidRate}
            onBidRateSelect={onBidRateSelect}
            onCustomBidRateChange={onCustomBidRateChange}
          />
        )}
      </div>
    )}

    <div className="mt-4">
      <AccordionSection title="집행비용 설정 (기본값: 1,000만원)">
        <div className="mt-3">
          <FieldLabel htmlFor="executionCost">집행비용 (원)</FieldLabel>
          <MoneyInput
            id="executionCost"
            value={input.executionCost}
            onChange={(value) => onInputChange({ executionCost: value })}
            placeholder="10,000,000"
          />
          <p className="mt-1.5 text-xs text-sub-text">
            실제 집행비용을 모를 경우 기본값(1,000만원)을 사용하세요.
          </p>
        </div>
      </AccordionSection>
    </div>
  </Card>
);
