"use client";

import { useState } from "react";
import { nanoid } from "nanoid";
import { useAuthStore } from "@/store/useAuthStore";
import { createSharedResult, deleteSharedResult, getSharedResultsByUserId } from "@/lib/supabase/shared-results";
import type { ISimulationInput, ISimulationResult } from "@/types/simulation";

const MAX_SHARED_RESULTS = 5;

type Status = "idle" | "saving" | "saved" | "copied" | "error";

interface IResultActionsProps {
  input: ISimulationInput;
  result: ISimulationResult;
}

export const ResultActions = ({ input, result }: IResultActionsProps) => {
  const user = useAuthStore((s) => s.user);
  const [status, setStatus] = useState<Status>("idle");
  const [savedShareId, setSavedShareId] = useState<string | null>(null);
  const [showMyInfo, setShowMyInfo] = useState(true);
  const [showLoginHint, setShowLoginHint] = useState(false);

  const requireLogin = () => {
    setShowLoginHint(true);
    setTimeout(() => setShowLoginHint(false), 3000);
  };

  const ensureSaved = async (forceNew = false): Promise<string | null> => {
    if (!user) return null;
    if (savedShareId && !forceNew) return savedShareId;

    const existing = await getSharedResultsByUserId(user.id);
    if (existing.length >= MAX_SHARED_RESULTS) {
      const oldest = existing[existing.length - 1];
      await deleteSharedResult(oldest.id, user.id);
    }

    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const userName = input.myName || user.email?.split("@")[0] || "";
    const title = `${today}_${userName}_배당 시뮬레이션 결과`;

    const shareId = nanoid(12);
    await createSharedResult({
      share_id: shareId,
      user_id: user.id,
      title,
      input,
      result,
      show_my_info: showMyInfo,
    });
    setSavedShareId(shareId);
    return shareId;
  };

  const handleSave = async () => {
    if (!user) { requireLogin(); return; }
    setStatus("saving");
    try {
      await ensureSaved();
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2500);
    }
  };

  const handleCopyLink = async () => {
    if (!user) { requireLogin(); return; }
    setStatus("saving");
    try {
      const shareId = await ensureSaved();
      if (!shareId) return;
      const url = `${window.location.origin}/share/${shareId}`;
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        // fallback: user can manually copy from mypage
      }
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2500);
    }
  };

  const isBusy = status === "saving";

  const primaryBtn =
    "inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer";

  return (
    <div className="relative">
      {/* 내 정보 표시 토글 */}
      <label className="mb-3 flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={showMyInfo}
          onChange={(e) => {
            setShowMyInfo(e.target.checked);
            setSavedShareId(null);
          }}
          className="h-4 w-4 rounded border-card-border text-accent accent-accent cursor-pointer"
        />
        <span className="text-sm text-sub-text">공유 시 내 정보 (이름, 배당액) 표시</span>
      </label>

      <div className="grid grid-cols-2 gap-2">
        {/* 저장하기 */}
        <button
          type="button"
          onClick={handleSave}
          disabled={isBusy || status === "saved"}
          className={`${primaryBtn} border-2 border-accent text-accent hover:bg-accent-bg`}
        >
          {status === "saved" ? (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              저장됨
            </>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              {isBusy ? "저장 중..." : "마이페이지에 저장"}
            </>
          )}
        </button>

        {/* 링크 복사 */}
        <button
          type="button"
          onClick={handleCopyLink}
          disabled={isBusy}
          className={`${primaryBtn} bg-accent-solid text-white hover:opacity-90`}
        >
          {status === "copied" ? (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              링크 복사됨!
            </>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              {isBusy ? "준비 중..." : "공유 링크 복사"}
            </>
          )}
        </button>
      </div>

      {/* Login hint */}
      {showLoginHint && (
        <div className="absolute right-0 top-full z-10 mt-2 w-56 rounded-xl border border-card-border bg-card-bg p-3 shadow-lg">
          <p className="text-xs text-sub-text">
            로그인 후 이용할 수 있습니다.{" "}
            <a href="/login?redirect=/simulate/result" className="text-accent underline underline-offset-2">
              로그인
            </a>
          </p>
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div className="absolute right-0 top-full z-10 mt-2 w-56 rounded-xl border border-card-border bg-card-bg p-3 shadow-lg">
          <p className="text-xs text-error">오류가 발생했습니다. 다시 시도해주세요.</p>
        </div>
      )}
    </div>
  );
};
