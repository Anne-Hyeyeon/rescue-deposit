import {
  categoryColors,
  categoryWrap,
} from "@/app/simulate/result/helpers";

interface ICategoryBadgeProps {
  category: string;
}

export const CategoryBadge = ({ category }: ICategoryBadgeProps) => {
  const wrap = categoryWrap[category];

  return (
    <span
      className={`inline-flex flex-col items-center sm:inline rounded px-1.5 py-0.5 text-[11px] font-medium leading-tight text-center ${
        categoryColors[category] ?? "bg-badge-bg text-muted"
      }`}
    >
      {wrap ? (
        <>
          <span className="hidden sm:inline whitespace-nowrap">
            {wrap[0]} {wrap[1]}
          </span>
          <span className="sm:hidden whitespace-nowrap">{wrap[0]}</span>
          <span className="sm:hidden whitespace-nowrap">{wrap[1]}</span>
        </>
      ) : (
        <span className="whitespace-nowrap">{category}</span>
      )}
    </span>
  );
};
