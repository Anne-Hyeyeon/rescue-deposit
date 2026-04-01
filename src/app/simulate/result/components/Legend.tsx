import { CategoryBadge } from "./CategoryBadge";

const LEGEND_CATEGORIES = [
  "집행비용",
  "최선순위 소액임차인",
  "상대적 소액임차인",
  "당해세",
  "담보물권",
  "확정일자 임차인",
  "임금채권",
  "조세채권",
  "공과금",
  "일반채권",
] as const;

interface ILegendProps {
  showMyTenant?: boolean;
}

export const Legend = ({ showMyTenant = true }: ILegendProps) => (
  <div className="flex flex-wrap gap-x-4 gap-y-2 px-1">
    {LEGEND_CATEGORIES.map((category) => (
      <div key={category} className="flex items-center gap-1.5">
        <CategoryBadge category={category} />
      </div>
    ))}
    {showMyTenant && (
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-accent">★</span>
        <span className="text-xs text-muted">나의 임차권</span>
      </div>
    )}
  </div>
);
