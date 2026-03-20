"use client";

import {
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

import { formatKRW } from "@/app/simulate/helpers";
import type { IOtherTenant } from "@/types/simulation";

interface ISectionTitleProps {
  step: string;
  title: string;
  sub?: string;
}

export const SectionTitle = ({ step, title, sub }: ISectionTitleProps) => (
  <div className="mb-5">
    <span className="text-xs font-medium text-accent uppercase tracking-widest">
      {step}
    </span>
    <h2 className="mt-0.5 text-lg font-bold text-foreground">{title}</h2>
    {sub && <p className="mt-1 text-sm leading-relaxed text-sub-text">{sub}</p>}
  </div>
);

interface IFieldLabelProps {
  htmlFor: string;
  children: ReactNode;
  info?: string;
}

export const FieldLabel = ({
  htmlFor,
  children,
  info,
}: IFieldLabelProps) => {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="mb-1.5 flex items-center gap-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground">
        {children}
      </label>
      {info && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowInfo((value) => !value)}
            className="flex h-4 w-4 items-center justify-center rounded-full bg-card-border text-[10px] font-bold text-muted transition-colors hover:bg-accent hover:text-white"
            aria-label="안내"
          >
            i
          </button>
          {showInfo && (
            <div className="absolute left-6 top-0 z-10 w-64 rounded-lg bg-foreground px-3 py-2 text-xs leading-relaxed text-background shadow-lg">
              {info}
              <button
                type="button"
                onClick={() => setShowInfo(false)}
                className="mt-1 block text-[10px] text-accent underline"
              >
                닫기
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const InputField = (props: InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }) => {
  const { hasError, className, ...rest } = props;
  return (
    <input
      {...rest}
      aria-invalid={hasError || undefined}
      className={`w-full rounded-xl border bg-background px-3 py-2.5 text-sm text-foreground transition-colors duration-150 placeholder:text-muted focus:outline-none focus:ring-2 ${
        hasError
          ? "border-error focus:border-error focus:ring-error/40"
          : "border-card-border focus:border-accent focus:ring-accent/40"
      } ${className ?? ""}`}
    />
  );
};

const MONEY_BUTTONS = [
  { label: "+1억", value: 100_000_000 },
  { label: "+1000만", value: 10_000_000 },
  { label: "+100만", value: 1_000_000 },
] as const;

interface IMoneyInputProps {
  id: string;
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  compact?: boolean;
  hasError?: boolean;
}

export const MoneyInput = ({
  id,
  value,
  onChange,
  placeholder = "0",
  compact = false,
  hasError = false,
}: IMoneyInputProps) => {
  const [raw, setRaw] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const inputValue = isFocused ? raw : value ? value.toLocaleString("ko-KR") : "";

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value.replace(/[^0-9]/g, "");
    const nextValue = input ? Number(input) : 0;
    setRaw(input ? nextValue.toLocaleString("ko-KR") : "");
    onChange(nextValue);
  };

  const handleFocus = () => {
    setIsFocused(true);
    setRaw(value ? String(value) : "");
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const addAmount = (amount: number) => {
    onChange(value + amount);
  };

  return (
    <div>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={inputValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        aria-invalid={hasError || undefined}
        className={`w-full rounded-xl border bg-background px-3 py-2.5 text-sm text-foreground transition-colors duration-150 placeholder:text-muted focus:outline-none focus:ring-2 tabular-nums ${
          hasError
            ? "border-error focus:border-error focus:ring-error/40"
            : "border-card-border focus:border-accent focus:ring-accent/40"
        }`}
      />
      {!compact && (
        <div className="mt-2 flex gap-1.5">
          {MONEY_BUTTONS.map(({ label, value: amount }) => (
            <button
              key={label}
              type="button"
              onClick={() => addAmount(amount)}
              className="rounded-lg border border-card-border bg-background px-2.5 py-1.5 text-xs font-medium text-sub-text transition-colors duration-150 hover:border-accent hover:text-accent active:bg-accent-bg"
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              onChange(0);
              setRaw("");
            }}
            className="rounded-lg border border-card-border bg-background px-2.5 py-1.5 text-xs font-medium text-muted transition-colors duration-150 hover:border-error hover:text-error active:bg-error-bg"
          >
            초기화
          </button>
        </div>
      )}
      {value > 0 && <p className="mt-1.5 text-xs text-sub-text">{formatKRW(value)}</p>}
    </div>
  );
};

export const DateInput = (props: InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }) => (
  <InputField
    type="date"
    {...props}
    className="[color-scheme:light] dark:[color-scheme:dark]"
  />
);

interface IChildrenProps {
  children: ReactNode;
}

export const InfoChip = ({ children }: IChildrenProps) => (
  <div className="mt-2 rounded-lg bg-accent-bg px-3 py-2 text-xs leading-relaxed text-accent">
    {children}
  </div>
);

interface IFieldTipProps {
  label?: string;
  children: ReactNode;
}

export const FieldTip = ({
  label = "도움말",
  children,
}: IFieldTipProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded text-xs text-sub-text transition-colors duration-150 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span>{label}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="mt-2 space-y-2 rounded-xl border border-card-border bg-card-bg px-4 py-3 text-xs leading-relaxed text-sub-text animate-in fade-in slide-in-from-top-1 duration-200">
          {children}
        </div>
      )}
    </div>
  );
};

export const WarningChip = ({ children }: IChildrenProps) => (
  <div className="mt-2 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs leading-relaxed text-yellow-800 dark:border-yellow-800/40 dark:bg-yellow-900/20 dark:text-yellow-300">
    {children}
  </div>
);

interface ICardProps {
  children: ReactNode;
  className?: string;
}

export const Card = ({ children, className = "" }: ICardProps) => (
  <div className={`rounded-2xl border border-card-border bg-card-bg p-5 ${className}`}>
    {children}
  </div>
);

interface IAccordionSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  forceOpen?: boolean;
}

export const AccordionSection = ({
  title,
  children,
  defaultOpen = false,
  forceOpen = false,
}: IAccordionSectionProps) => {
  const [open, setOpen] = useState(defaultOpen);
  const [wasForced, setWasForced] = useState(false);

  // 데이터가 채워지면 자동으로 열기 (한 번만)
  if (forceOpen && !open && !wasForced) {
    setOpen(true);
    setWasForced(true);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-card-border">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-5 py-3.5 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-hover-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <span>{title}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="border-t border-card-border bg-card-bg px-5 pb-5 pt-1">
          {children}
        </div>
      )}
    </div>
  );
};

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

export const AssumptionsBanner = () => (
  <Card className="border-yellow-200 bg-yellow-50/50 dark:border-yellow-800/40 dark:bg-yellow-900/10">
    <div className="flex items-start gap-3">
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="mt-0.5 shrink-0 text-yellow-600 dark:text-yellow-400"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <div>
        <p className="mb-2 text-sm font-semibold text-yellow-800 dark:text-yellow-300">
          시뮬레이션 전제 조건
        </p>
        <ul className="space-y-1.5 text-xs leading-relaxed text-yellow-700 dark:text-yellow-400">
          <li className="flex items-start gap-1.5">
            <span className="mt-0.5 shrink-0">•</span>
            <span>
              <strong>배당요구를 한 세입자만</strong> 계산에 포함됩니다.
              배당요구를 하지 않은 세입자는 배당 대상에서 제외됩니다.
            </span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="mt-0.5 shrink-0">•</span>
            <span>
              대항력 발생일이 입력되면 <strong>대항력이 있는 것으로 가정</strong>합니다.
              경매개시결정 등기 전 대항요건 구비 여부는 별도로 검증하지 않습니다.
            </span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="mt-0.5 shrink-0">•</span>
            <span>
              <strong>증액된 보증금은 반영되지 않습니다.</strong>
              계약 갱신 시 보증금이 올라간 경우 소액임차인 여부가 달라질 수 있으나
              이 시뮬레이터는 현재 입력된 보증금만으로 판단합니다.
            </span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="mt-0.5 shrink-0">•</span>
            <span>
              이 결과는 <strong>참고용</strong>이며, 실제 배당 결과는 법원의 판단에 따라 달라질 수 있습니다.
            </span>
          </li>
        </ul>
      </div>
    </div>
  </Card>
);
