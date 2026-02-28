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
      className="group block p-5 rounded-xl border border-card-border bg-card-bg hover:bg-hover-bg transition-colors"
    >
      <div className="text-3xl mb-3">{emoji}</div>
      <h3 className="font-bold text-base mb-1">{title}</h3>
      <p className="text-sm text-sub-text">{description}</p>
      <span className="inline-block mt-3 text-sm text-sub-text group-hover:text-foreground transition-colors">
        →
      </span>
    </Link>
  );
}
