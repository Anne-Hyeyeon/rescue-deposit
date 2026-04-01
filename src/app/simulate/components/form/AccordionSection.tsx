"use client";

import { useState, type ReactNode } from "react";

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
