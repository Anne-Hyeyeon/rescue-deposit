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
