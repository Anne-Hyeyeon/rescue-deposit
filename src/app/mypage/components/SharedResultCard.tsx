"use client";

import { useState } from "react";
import Link from "next/link";
import type { ISharedResult } from "@/lib/supabase/shared-results";

interface ISharedResultCardProps {
  item: ISharedResult;
  deleting: boolean;
  onCopyLink: () => void;
  onDelete: () => void;
}

export const SharedResultCard = ({
  item,
  deleting,
  onCopyLink,
  onDelete,
}: ISharedResultCardProps) => {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const tenantCount = item.input.otherTenants?.length ?? 0;
  const createdDate = new Date(item.created_at);
  const createdLabel = `${createdDate.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })} ${createdDate.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-card-border bg-card-bg transition-colors hover:border-foreground/20 group">
      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-accent-bg flex items-center justify-center">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent" aria-hidden="true">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      </div>

      <Link
        href={`/share/${item.share_id}`}
        className="flex-1 min-w-0"
      >
        <p className="text-sm font-medium text-foreground truncate hover:text-accent transition-colors">
          {item.title || "배당 시뮬레이션"}
        </p>
        <p className="text-xs text-sub-text mt-0.5">
          임차인 {tenantCount}명 &middot; {createdLabel}
        </p>
      </Link>

      <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
        {/* Copy link */}
        <button
          type="button"
          onClick={onCopyLink}
          className="p-1.5 rounded-lg hover:bg-badge-bg transition-colors cursor-pointer"
          aria-label="링크 복사"
          title="링크 복사"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        </button>

        {/* View */}
        <Link
          href={`/share/${item.share_id}`}
          className="p-1.5 rounded-lg hover:bg-badge-bg transition-colors"
          aria-label="결과 보기"
          title="결과 보기"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </Link>

        {/* Delete */}
        {confirmDelete ? (
          <div className="flex items-center gap-1 ml-1">
            <button
              type="button"
              onClick={() => { onDelete(); setConfirmDelete(false); }}
              disabled={deleting}
              className="px-2 py-1 text-xs rounded-lg bg-error-bg text-error font-medium hover:bg-error/10 transition-colors cursor-pointer disabled:opacity-50"
            >
              {deleting ? "삭제 중" : "확인"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="px-2 py-1 text-xs rounded-lg text-sub-text hover:text-foreground transition-colors cursor-pointer"
            >
              취소
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="p-1.5 rounded-lg hover:bg-error-bg hover:text-error transition-colors cursor-pointer"
            aria-label="삭제"
            title="삭제"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
