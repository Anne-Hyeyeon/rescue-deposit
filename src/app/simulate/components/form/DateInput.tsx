import type { InputHTMLAttributes } from "react";
import { InputField } from "./InputField";

export const DateInput = (props: InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }) => (
  <InputField
    type="date"
    {...props}
    className="[color-scheme:light] dark:[color-scheme:dark]"
  />
);
