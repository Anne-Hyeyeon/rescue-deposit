"use client";

import {
  REGION_LABELS,
  formatKRW,
  type BidRateOption,
  type SimulationFormErrors,
} from "@/app/simulate/helpers";
import {
  AccordionSection,
  Card,
  DateInput,
  FieldLabel,
  FieldTip,
  InfoChip,
  InputField,
  MoneyInput,
  OtherTenantRow,
  SectionTitle,
  WarningChip,
} from "@/app/simulate/components/form-primitives";
import type {
  IOtherTenant,
  ISimulationInput,
  PropertyTaxOption,
} from "@/types/simulation";

type AppraisalMode = "known" | "unknown";

interface IUpdateInput {
  (partial: Partial<ISimulationInput>): void;
}

interface ISalePriceSectionProps {
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
  onInputChange: IUpdateInput;
}

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
                />
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
                  />
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

interface IMyTenantSectionProps {
  input: ISimulationInput;
  errors: SimulationFormErrors;
  onInputChange: IUpdateInput;
}

export const MyTenantSection = ({
  input,
  errors,
  onInputChange,
}: IMyTenantSectionProps) => (
  <Card>
    <SectionTitle
      step="Section 2"
      title="나의 임차 정보"
      sub="등기부등본 전입세대 열람과 임대차계약서를 기준으로 입력하세요."
    />

    <div className="flex flex-col gap-4">
      <div>
        <FieldLabel htmlFor="myName">이름</FieldLabel>
        <div className="flex items-center gap-2">
          <InputField
            id="myName"
            type="text"
            value={input.myName}
            onChange={(event) => onInputChange({ myName: event.target.value })}
            placeholder="홍길동"
            disabled={input.myName === "모름"}
          />
          <label className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap">
            <input
              type="checkbox"
              checked={input.myName === "모름"}
              onChange={(event) =>
                onInputChange({ myName: event.target.checked ? "모름" : "" })
              }
              className="h-4 w-4 accent-accent"
            />
            <span className="text-xs text-sub-text">이름 모름</span>
          </label>
        </div>
      </div>

      <div>
        <FieldLabel htmlFor="myDeposit">보증금 (원)</FieldLabel>
        <MoneyInput
          id="myDeposit"
          value={input.myDeposit}
          onChange={(value) => onInputChange({ myDeposit: value })}
          placeholder="50,000,000"
        />
        {errors.myDeposit && (
          <p className="mt-1 text-xs text-error" role="alert">
            {errors.myDeposit}
          </p>
        )}
        <WarningChip>
          계약 갱신으로 보증금이 증액된 경우, <strong>현재 보증금</strong>을 입력하세요.
          증액 전 보증금과의 차이에 따른 소액임차인 판정 변동은 반영되지 않습니다.
        </WarningChip>
      </div>

      <div>
        <FieldLabel
          htmlFor="myOpposabilityDate"
          info="전입신고일의 다음날이 대항력 발생일입니다. 확정일자가 더 늦으면 확정일자가 기준일이 됩니다."
        >
          대항력 발생일
        </FieldLabel>
        <DateInput
          id="myOpposabilityDate"
          value={input.myOpposabilityDate}
          onChange={(event) =>
            onInputChange({ myOpposabilityDate: event.target.value })
          }
        />
        {errors.myOpposabilityDate && (
          <p className="mt-1 text-xs text-error" role="alert">
            {errors.myOpposabilityDate}
          </p>
        )}
        <FieldTip label="대항력 발생일 계산법">
          <p>
            <span className="font-medium text-foreground">대항력 발생일</span>{" "}
            = 전입신고일 다음날과 확정일자 중 <strong>더 늦은 날</strong>입니다.
          </p>
          <div className="mt-1 space-y-1">
            <p>
              <span className="font-medium text-foreground">예시 1:</span>{" "}
              전입신고 3/1, 확정일자 3/1 → 대항력 발생일 <strong>3/2</strong>
            </p>
            <p>
              <span className="font-medium text-foreground">예시 2:</span>{" "}
              전입신고 3/1, 확정일자 3/5 → 대항력 발생일 <strong>3/5</strong>
            </p>
          </div>
          <p className="mt-1">
            전입신고일은 주민센터 방문일이며, 확정일자는 임대차계약서에
            확정일자 도장을 받은 날입니다. 두 날짜 모두 임대차계약서와 전입세대
            열람으로 확인할 수 있어요.
          </p>
        </FieldTip>
      </div>

      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          id="myHasOccupancy"
          checked={input.myHasOccupancy}
          onChange={(event) =>
            onInputChange({ myHasOccupancy: event.target.checked })
          }
          className="h-4 w-4 accent-accent"
        />
        <span className="text-sm text-foreground">
          현재 해당 주소에 실거주 중 (점유 유지)
        </span>
      </label>
    </div>
  </Card>
);

interface IPropertySectionProps {
  input: ISimulationInput;
  address: string;
  errors: SimulationFormErrors;
  onAddressChange: (address: string) => void;
  onInputChange: IUpdateInput;
  onRegionChange: (value: string) => void;
  onPropertyTypeChange: (value: string) => void;
}

export const PropertySection = ({
  input,
  address,
  errors,
  onAddressChange,
  onInputChange,
  onRegionChange,
  onPropertyTypeChange,
}: IPropertySectionProps) => (
  <Card>
    <SectionTitle
      step="Section 3"
      title="건물 정보 및 선순위 근저당"
      sub="등기부등본 을구(乙區)에서 가장 오래된 근저당권을 확인하세요."
    />

    <div className="flex flex-col gap-4">
      <div>
        <FieldLabel htmlFor="address">건물 주소</FieldLabel>
        <InputField
          id="address"
          type="text"
          value={address}
          onChange={(event) => onAddressChange(event.target.value)}
          placeholder="예: 서울시 동작구 대방동 393-57"
        />
        <p className="mt-1.5 text-xs text-sub-text">
          주소를 입력하면 소액임차인 기준표의 지역 구간을 자동으로 판단합니다.
        </p>
        {address && (
          <InfoChip>
            자동 판단된 지역: <strong>{REGION_LABELS[input.region]}</strong>
            {" "}다르다면 아래에서 직접 수정하세요.
          </InfoChip>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel htmlFor="region">지역 (직접 선택)</FieldLabel>
          <select
            id="region"
            value={input.region}
            onChange={(event) => onRegionChange(event.target.value)}
            className="w-full rounded-xl border border-card-border bg-background px-3 py-2.5 text-sm text-foreground transition-colors duration-150 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            <option value="seoul">서울특별시</option>
            <option value="metropolitan_overcrowded">수도권 과밀억제권역</option>
            <option value="metropolitan">광역시 등</option>
            <option value="others">그 밖의 지역</option>
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="propertyType">주택 유형</FieldLabel>
          <select
            id="propertyType"
            value={input.propertyType}
            onChange={(event) => onPropertyTypeChange(event.target.value)}
            className="w-full rounded-xl border border-card-border bg-background px-3 py-2.5 text-sm text-foreground transition-colors duration-150 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            <option value="multi_family">다가구</option>
            <option value="multi_unit">다세대</option>
          </select>
        </div>
      </div>

      <div>
        <FieldLabel htmlFor="mortgageName">근저당권자 이름</FieldLabel>
        <div className="flex items-center gap-2">
          <InputField
            id="mortgageName"
            type="text"
            value={input.mortgageName}
            onChange={(event) => onInputChange({ mortgageName: event.target.value })}
            placeholder="예: ○○은행"
            disabled={input.mortgageName === "선순위 근저당"}
          />
          <label className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap">
            <input
              type="checkbox"
              checked={input.mortgageName === "선순위 근저당"}
              onChange={(event) =>
                onInputChange({
                  mortgageName: event.target.checked ? "선순위 근저당" : "",
                })
              }
              className="h-4 w-4 accent-accent"
            />
            <span className="text-xs text-sub-text">이름 모름</span>
          </label>
        </div>
      </div>

      <div>
        <FieldLabel htmlFor="mortgageRegDate">근저당 설정일 (등기부등본 기준)</FieldLabel>
        <DateInput
          id="mortgageRegDate"
          value={input.mortgageRegDate}
          onChange={(event) => onInputChange({ mortgageRegDate: event.target.value })}
        />
        {errors.mortgageRegDate && (
          <p className="mt-1 text-xs text-error" role="alert">
            {errors.mortgageRegDate}
          </p>
        )}
        <FieldTip label="근저당 찾는 법">
          <p>
            등기부등본 <span className="font-medium text-foreground">을구(乙區)</span>에서
            &quot;근저당권설정&quot;이라고 적힌 항목 중{" "}
            <strong>가장 오래된(먼저 설정된) 근저당</strong>의 접수일을 입력하세요.
          </p>
          <p>
            말소된 근저당(밑줄 처리)은 제외하고, 현재 살아 있는 근저당만 확인하면 됩니다.
          </p>
        </FieldTip>
      </div>

      <div>
        <FieldLabel htmlFor="mortgageMaxClaim">채권최고액 (원)</FieldLabel>
        <MoneyInput
          id="mortgageMaxClaim"
          value={input.mortgageMaxClaim}
          onChange={(value) => onInputChange({ mortgageMaxClaim: value })}
          placeholder="120,000,000"
        />
        {errors.mortgageMaxClaim && (
          <p className="mt-1 text-xs text-error" role="alert">
            {errors.mortgageMaxClaim}
          </p>
        )}
        <FieldTip label="채권최고액이란?">
          <p>
            <span className="font-medium text-foreground">채권최고액</span>은
            등기부등본 을구에 기재된 금액으로, 실제 대출금(채권원금)이 아니라
            은행이 우선 변제받을 수 있는 <strong>최대 한도</strong>입니다.
          </p>
          <p>
            보통 대출금의 120~130% 수준으로 설정됩니다.
            예: 대출 1억 → 채권최고액 1.2~1.3억
          </p>
        </FieldTip>
      </div>
    </div>
  </Card>
);

interface IOptionalSectionProps {
  input: ISimulationInput;
  onInputChange: IUpdateInput;
  onAddOtherTenant: () => void;
  onUpdateOtherTenant: (tenantId: string, tenant: IOtherTenant) => void;
  onRemoveOtherTenant: (tenantId: string) => void;
}

const PROPERTY_TAX_OPTIONS: ReadonlyArray<readonly [PropertyTaxOption, string]> = [
  ["yes", "있음"],
  ["no", "없음"],
  ["unknown", "모름"],
];

export const OptionalSection = ({
  input,
  onInputChange,
  onAddOtherTenant,
  onUpdateOtherTenant,
  onRemoveOtherTenant,
}: IOptionalSectionProps) => (
  <div>
    <p className="mb-3 text-xs font-medium uppercase tracking-widest text-sub-text">
      Section 4
    </p>
    <div className="flex flex-col gap-3">
      <AccordionSection title="다른 세입자 정보 (선택)">
        <p className="mb-3 mt-2 text-sm leading-relaxed text-sub-text">
          같은 건물의 다른 세입자 정보를 추가하면 소액임차인 경합 시 더 정확한 결과를 얻을 수 있어요.
        </p>
        <WarningChip>
          <strong>배당요구를 한 세입자만</strong> 추가하세요. 배당요구를 하지 않은 세입자는
          경매 절차에서 배당 대상이 아니므로 여기에 입력하면 결과가 부정확해집니다.
        </WarningChip>
        <div className="mt-4">
          {input.otherTenants.map((otherTenant, index) => (
            <OtherTenantRow
              key={otherTenant.id}
              tenant={otherTenant}
              index={index}
              onChange={(tenant) => onUpdateOtherTenant(otherTenant.id, tenant)}
              onRemove={() => onRemoveOtherTenant(otherTenant.id)}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={onAddOtherTenant}
          className="w-full rounded-xl border border-dashed border-card-border py-2.5 text-sm text-sub-text transition-colors duration-150 hover:border-accent hover:text-accent"
        >
          + 세입자 추가
        </button>
      </AccordionSection>

      <AccordionSection title="재산세 / 당해세 (선택)">
        <p className="mb-4 mt-2 text-sm leading-relaxed text-sub-text">
          재산세(당해세)가 있을 경우 배당 순위에 영향을 줄 수 있어요.
        </p>
        <fieldset>
          <legend className="mb-3 text-sm font-medium text-foreground">
            재산세 존재 여부
          </legend>
          <div className="flex flex-col gap-2">
            {PROPERTY_TAX_OPTIONS.map(([value, label]) => (
              <label key={value} className="flex cursor-pointer items-center gap-3">
                <input
                  type="radio"
                  name="propertyTaxOption"
                  value={value}
                  checked={input.propertyTaxOption === value}
                  onChange={() => onInputChange({ propertyTaxOption: value })}
                  className="h-4 w-4 accent-accent"
                />
                <span className="text-sm text-foreground">{label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        {input.propertyTaxOption === "yes" && (
          <div className="mt-4 flex flex-col gap-3">
            <div>
              <FieldLabel htmlFor="propertyTaxAmount">재산세 금액 (원)</FieldLabel>
              <MoneyInput
                id="propertyTaxAmount"
                value={input.propertyTaxAmount}
                onChange={(value) => onInputChange({ propertyTaxAmount: value })}
                placeholder="5,000,000"
              />
            </div>
            <div>
              <FieldLabel htmlFor="propertyTaxLegalDate">법정기일</FieldLabel>
              <DateInput
                id="propertyTaxLegalDate"
                value={input.propertyTaxLegalDate}
                onChange={(event) =>
                  onInputChange({ propertyTaxLegalDate: event.target.value })
                }
              />
            </div>
          </div>
        )}
      </AccordionSection>
    </div>
  </div>
);
