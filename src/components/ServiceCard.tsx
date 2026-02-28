import Link from "next/link";

interface ServiceCardProps {
  href: string;
  emoji: string;
  title: string;
  description: string;
}

export function ServiceCard({ href, emoji, title, description }: ServiceCardProps) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col justify-between p-6 rounded-2xl border border-card-border bg-card-bg hover:border-muted hover:-translate-y-0.5 hover:shadow-sm min-h-[180px]"
    >
      <div>
        <span className="inline-block text-2xl mb-4 opacity-80 group-hover:opacity-100">
          {emoji}
        </span>
        <h3 className="font-semibold text-[15px] mb-1.5 tracking-tight">{title}</h3>
        <p className="text-[13px] text-sub-text leading-relaxed">{description}</p>
      </div>
      <span className="mt-4 text-[13px] text-muted group-hover:text-foreground group-hover:translate-x-0.5 inline-block">
        →
      </span>
    </Link>
  );
}
