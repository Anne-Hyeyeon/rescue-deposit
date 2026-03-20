"use client";

import {
  AccordionSection,
  DateInput,
  FieldLabel,
  MoneyInput,
  OtherTenantRow,
  WarningChip,
} from "@/app/simulate/components/form-primitives";
import type { PropertyTaxOption } from "@/types/simulation";

import type { IOptionalSectionProps } from "@/app/simulate/components/section-types";

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
      <AccordionSection
        title="다른 세입자 정보 (선택)"
        forceOpen={input.otherTenants.length > 0}
      >
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

      <AccordionSection
        title="재산세 / 당해세 (선택)"
        forceOpen={input.propertyTaxOption === "yes"}
      >
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
