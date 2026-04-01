"use client";

import { useState, useRef } from "react";
import type { ISimulationData } from "@/lib/supabase/simulation-data";

interface ISimDataCardProps {
  item: ISimulationData;
  deleting: boolean;
  onDownload: () => void;
  onOverwrite: (file: File) => void;
  onDelete: () => void;
}

export const SimDataCard = ({
  item,
  deleting,
  onDownload,
  onOverwrite,
  onDelete,
}: ISimDataCardProps) => {
  const overwriteRef = useRef<HTMLInputElement>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const tenantCount = item.data.otherTenants?.length ?? 0;
  const updatedLabel = new Date(item.updated_at).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-card-border bg-card-bg transition-colors hover:border-foreground/20 group">
      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-accent-bg flex items-center justify-center">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {item.title || "배당 데이터"}
        </p>
        <p className="text-xs text-sub-text mt-0.5">
          임차인 {tenantCount}명 &middot; {updatedLabel}
        </p>
      </div>

      <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={onDownload}
          className="p-1.5 rounded-lg hover:bg-badge-bg transition-colors cursor-pointer"
          aria-label="엑셀 다운로드"
          title="엑셀 다운로드"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => overwriteRef.current?.click()}
          className="p-1.5 rounded-lg hover:bg-badge-bg transition-colors cursor-pointer"
          aria-label="파일로 수정"
          title="파일로 수정"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            <path d="m15 5 4 4" />
          </svg>
        </button>
        <input
          ref={overwriteRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onOverwrite(file);
            e.target.value = "";
          }}
          className="hidden"
          aria-label="수정할 엑셀 파일 선택"
        />

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
