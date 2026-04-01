import type { ReactNode } from "react";

interface ICardProps {
  children: ReactNode;
  className?: string;
}

export const Card = ({ children, className = "" }: ICardProps) => (
  <div className={`rounded-2xl border border-card-border bg-card-bg p-5 ${className}`}>
    {children}
  </div>
);
