"use client";

import type { IOtherTenant } from "@/types/simulation";
import { FieldLabel } from "./FieldLabel";
import { InputField } from "./InputField";
import { MoneyInput } from "./MoneyInput";
import { DateInput } from "./DateInput";

interface IOtherTenantRowProps {
  tenant: IOtherTenant;
  onChange: (tenant: IOtherTenant) => void;
  onRemove: () => void;
  index: number;
}

export const OtherTenantRow = ({
  tenant,
  onChange,
  onRemove,
  index,
}: IOtherTenantRowProps) => (
  <fieldset className="mb-3 rounded-xl border border-card-border p-4">
    <legend className="px-1 text-xs font-medium text-sub-text">
      다른 세입자 {index + 1}
    </legend>
    <div className="mb-2 mt-2">
      <FieldLabel htmlFor={`ot-name-${tenant.id}`}>이름</FieldLabel>
      <div className="flex items-center gap-2">
        <InputField
          id={`ot-name-${tenant.id}`}
          type="text"
          value={tenant.name}
          onChange={(event) => onChange({ ...tenant, name: event.target.value })}
          placeholder="홍길동"
          maxLength={20}
          disabled={tenant.name === "모름"}
        />
        <label className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap">
          <input
            type="checkbox"
            checked={tenant.name === "모름"}
            onChange={(event) =>
              onChange({ ...tenant, name: event.target.checked ? "모름" : "" })
            }
            className="h-4 w-4 accent-accent"
          />
          <span className="text-xs text-sub-text">이름 모름</span>
        </label>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <FieldLabel htmlFor={`ot-deposit-${tenant.id}`}>보증금</FieldLabel>
        <MoneyInput
          id={`ot-deposit-${tenant.id}`}
          value={tenant.deposit}
          onChange={(value) => onChange({ ...tenant, deposit: value })}
          placeholder="0"
          compact
        />
      </div>
      <div>
        <FieldLabel htmlFor={`ot-opposability-${tenant.id}`}>대항력 발생일</FieldLabel>
        <DateInput
          id={`ot-opposability-${tenant.id}`}
          value={tenant.opposabilityDate}
          onChange={(event) =>
            onChange({ ...tenant, opposabilityDate: event.target.value })
          }
        />
      </div>
    </div>
    <button
      type="button"
      onClick={onRemove}
      className="mt-3 text-xs text-error hover:underline"
    >
      삭제
    </button>
  </fieldset>
);
