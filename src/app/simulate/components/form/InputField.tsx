import type { InputHTMLAttributes } from "react";

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
