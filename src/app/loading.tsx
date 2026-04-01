export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto px-6 pt-24 pb-20 flex justify-center">
      <div className="flex items-center gap-2 text-sm text-sub-text">
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <span>불러오는 중...</span>
      </div>
    </div>
  );
}
