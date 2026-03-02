import Link from "next/link";

interface ServiceCardProps {
  href: string;
  index: number;
  title: string;
  description: string;
}

export function ServiceCard({ href, index, title, description }: ServiceCardProps) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between py-5 -mx-6 px-6 hover:bg-hover-bg transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 focus-visible:rounded-lg"
    >
      <div className="flex items-baseline gap-5">
        <span className="text-[11px] text-muted tabular-nums shrink-0">
          {String(index).padStart(2, "0")}
        </span>
        <div>
          <h3 className="font-semibold text-[16px] tracking-tight mb-0.5">
            {title}
          </h3>
          <p className="text-[13px] text-sub-text">{description}</p>
        </div>
      </div>
      <svg
        className="w-4 h-4 text-muted group-hover:text-foreground group-hover:translate-x-0.5 transition-[color,transform] duration-200 shrink-0 ml-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </Link>
  );
}
