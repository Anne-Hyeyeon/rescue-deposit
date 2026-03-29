"use client";

import {
  Card,
  DateInput,
  FieldLabel,
  FieldTip,
  InputField,
  MoneyInput,
  SectionTitle,
  WarningChip,
} from "@/app/simulate/components/form-primitives";

import type { IMyTenantSectionProps } from "@/app/simulate/components/section-types";

export const MyTenantSection = ({
  input,
  errors,
  onInputChange,
}: IMyTenantSectionProps) => (
  <Card>
    <SectionTitle
      step="Section 2"
      title="나의 임차 정보"
      sub="본인 보증금을 아는 경우에만 입력하세요. 모르면 비워두고 아래 세입자 정보를 입력하면 됩니다."
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
          hasError={!!errors.myDeposit}
        />
        {errors.myDeposit && (
          <p className="mt-1 text-xs text-error" role="alert">
            {errors.myDeposit}
          </p>
        )}
        <p className="mt-1 text-xs text-sub-text">
          선택 입력입니다. 본인 보증금을 모르면 아래 세입자 정보를 1명 이상 입력하세요.
        </p>
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
          hasError={!!errors.myOpposabilityDate}
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
