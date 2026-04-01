"use client";

import { useState, type ReactNode } from "react";

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
