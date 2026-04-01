"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "disclaimer_dismissed_date";

const isDismissedToday = (): boolean => {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return false;
  return stored === new Date().toISOString().slice(0, 10);
};

export const DisclaimerSheet = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isDismissedToday()) setVisible(true);
  }, []);

  const handleClose = () => setVisible(false);

  const handleDismissToday = () => {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString().slice(0, 10));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="disclaimer-title"
        className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg animate-slide-up"
      >
        <div className="rounded-t-2xl border border-b-0 border-card-border bg-card-bg px-6 pb-8 pt-6 shadow-lg">
          {/* Handle */}
          <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-divider" />

          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-accent" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <circle cx="12" cy="8" r="0.5" fill="currentColor" />
            </svg>
            <h2
              id="disclaimer-title"
              className="text-base font-semibold text-foreground"
            >
              이용 안내
            </h2>
          </div>

          <div className="mt-4 rounded-xl bg-accent-bg/50 px-4 py-3.5 space-y-2.5 text-sm leading-relaxed text-sub-text">
            <p>
              본 시뮬레이터는 경매 배당 절차를 이해하기 위한
              <strong className="text-accent"> 참고용 도구</strong>이며, 실제 법원의 배당 결과와 다를 수 있습니다.
            </p>
            <p>
              시뮬레이션 결과에 대해 어떠한
              <strong className="text-accent"> 법적 책임도 지지 않으며</strong>,
              중요한 결정은 반드시 법률 전문가와 상담하시기 바랍니다.
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="w-full rounded-xl bg-accent-solid py-3 text-sm font-medium text-white transition-colors hover:opacity-90 cursor-pointer"
            >
              확인했습니다
            </button>
            <button
              type="button"
              onClick={handleDismissToday}
              className="w-full rounded-xl py-2.5 text-xs text-muted transition-colors hover:text-sub-text cursor-pointer"
            >
              오늘 하루 보지 않기
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
