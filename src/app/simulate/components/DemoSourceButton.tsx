import type { DemoSource } from "@/app/simulate/constants/demo-cases";

interface IDemoSourceButtonProps {
  isActive: boolean;
  onClick: () => void;
  emoji: string;
  title: string;
  description: string;
}

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    className="text-accent flex-shrink-0" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ChevronIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    className="text-accent flex-shrink-0 group-hover:translate-x-0.5 transition-transform" aria-hidden="true">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export const DemoSourceButton = ({
  isActive,
  onClick,
  emoji,
  title,
  description,
}: IDemoSourceButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl
      transition-colors duration-150 cursor-pointer text-left group
      ${isActive
        ? "bg-accent-bg border-2 border-accent"
        : "bg-accent-bg border border-accent/20 hover:border-accent/50"
      }`}
  >
    <span className="text-lg" aria-hidden="true">{emoji}</span>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-accent">{title}</p>
      <p className="text-xs text-sub-text mt-0.5">{description}</p>
    </div>
    {isActive ? <CheckIcon /> : <ChevronIcon />}
  </button>
);

interface IMyDataButtonProps {
  isActive: boolean;
  isLoading: boolean;
  onClick: () => void;
}

export const MyDataButton = ({
  isActive,
  isLoading,
  onClick,
}: IMyDataButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={isLoading}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl
      transition-colors duration-150 cursor-pointer text-left group disabled:opacity-50
      ${isActive
        ? "bg-card-bg border-2 border-foreground/40"
        : "bg-card-bg border border-card-border hover:border-foreground/30"
      }`}
  >
    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-badge-bg flex items-center justify-center">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
        className="text-foreground" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-foreground">
        {isLoading ? "불러오는 중..." : "내 데이터 입력하기"}
      </p>
      <p className="text-xs text-sub-text mt-0.5">
        마이페이지에 저장한 배당 데이터를 자동으로 입력합니다
      </p>
    </div>
    {isActive ? (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        className="text-accent flex-shrink-0" aria-hidden="true">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ) : (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        className="text-sub-text flex-shrink-0 group-hover:translate-x-0.5 transition-transform" aria-hidden="true">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    )}
  </button>
);
