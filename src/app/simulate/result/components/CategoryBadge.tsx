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
      className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-medium leading-tight ${
        categoryColors[category] ?? "bg-badge-bg text-muted"
      }`}
    >
      {wrap ? (
        <>
          <span className="hidden sm:inline">
            {wrap[0]} {wrap[1]}
          </span>
          <span className="sm:hidden">
            {wrap[0]}
            <br />
            {wrap[1]}
          </span>
        </>
      ) : (
        category
      )}
    </span>
  );
};
