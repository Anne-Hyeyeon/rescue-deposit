"use client";

import { useState, type ChangeEvent } from "react";
import { formatKRW } from "@/app/simulate/helpers";

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
