"use client";

import { REGION_LABELS } from "@/app/simulate/helpers";
import {
  Card,
  DateInput,
  FieldLabel,
  FieldTip,
  InfoChip,
  InputField,
  MoneyInput,
  SectionTitle,
} from "@/app/simulate/components/form-primitives";

import type { IPropertySectionProps } from "@/app/simulate/components/section-types";

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
