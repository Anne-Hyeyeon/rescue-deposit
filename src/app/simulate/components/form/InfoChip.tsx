import type { ReactNode } from "react";

interface IChildrenProps {
  children: ReactNode;
}

export const InfoChip = ({ children }: IChildrenProps) => (
  <div className="mt-2 rounded-lg bg-accent-bg px-3 py-2 text-xs leading-relaxed text-accent">
    {children}
  </div>
);

export const WarningChip = ({ children }: IChildrenProps) => (
  <div className="mt-2 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs leading-relaxed text-yellow-800 dark:border-yellow-800/40 dark:bg-yellow-900/20 dark:text-yellow-300">
    {children}
  </div>
);
