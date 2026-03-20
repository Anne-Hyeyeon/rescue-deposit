"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { getProfile, upsertProfile } from "@/lib/supabase/profiles";
import {
  getSimulationDataList,
  upsertSimulationData,
  deleteSimulationData,
  type ISimulationData,
} from "@/lib/supabase/simulation-data";
import { downloadSimulationExcel, downloadTemplate } from "@/lib/excel/generator";
import { parseSimulationExcel } from "@/lib/excel/parser";

interface INicknameMessage {
  type: "error" | "success";
  text: string;
}

export default function MyPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const signOut = useAuthStore((s) => s.signOut);

  const [nickname, setNickname] = useState("");
  const [savedNickname, setSavedNickname] = useState<string | null>(null);
  const [loadedProfileUserId, setLoadedProfileUserId] = useState<string | null>(
    null
  );
  const [saving, setSaving] = useState(false);
  const [nicknameMsg, setNicknameMsg] = useState<INicknameMessage | null>(null);

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login?redirect=/mypage");
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    getProfile(user.id).then((profile) => {
      if (cancelled) return;
      const name =
        profile?.nickname ??
        user.user_metadata?.full_name ??
        user.user_metadata?.name ??
        "";
      setNickname(name);
      setSavedNickname(name);
      setLoadedProfileUserId(user.id);
    });

    return () => { cancelled = true; };
  }, [user]);

  // 배당표 데이터 관리
  const [simDataList, setSimDataList] = useState<ISimulationData[]>([]);
  const [simDataLoading, setSimDataLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [simMsg, setSimMsg] = useState<INicknameMessage | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadSimData = useCallback(async (userId: string) => {
    setSimDataLoading(true);
    try {
      const list = await getSimulationDataList(userId);
      setSimDataList(list);
    } catch {
      setSimDataList([]);
    } finally {
      setSimDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    loadSimData(user.id);
  }, [user, loadSimData]);

  const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB

  const handleFileUpload = useCallback(async (file: File) => {
    if (!user) return;
    if (file.size > MAX_FILE_SIZE) {
      setSimMsg({ type: "error", text: "파일 크기가 3MB를 초과합니다." });
      return;
    }
    setUploading(true);
    setSimMsg(null);
    try {
      const result = await parseSimulationExcel(file);
      if (!result.success) {
        setSimMsg({ type: "error", text: result.error });
        return;
      }
      await upsertSimulationData({
        user_id: user.id,
        title: result.title,
        data: result.data,
      });
      await loadSimData(user.id);
      setSimMsg({ type: "success", text: "데이터가 저장되었습니다." });
      setTimeout(() => setSimMsg(null), 2500);
    } catch {
      setSimMsg({ type: "error", text: "업로드 중 오류가 발생했습니다." });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [user, loadSimData]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload]
  );

  const handleOverwrite = useCallback(async (item: ISimulationData, file: File) => {
    if (!user) return;
    if (file.size > MAX_FILE_SIZE) {
      setSimMsg({ type: "error", text: "파일 크기가 3MB를 초과합니다." });
      return;
    }
    setUploading(true);
    setSimMsg(null);
    try {
      const result = await parseSimulationExcel(file);
      if (!result.success) {
        setSimMsg({ type: "error", text: result.error });
        return;
      }
      await upsertSimulationData({
        id: item.id,
        user_id: user.id,
        title: result.title,
        data: result.data,
      });
      await loadSimData(user.id);
      setSimMsg({ type: "success", text: "데이터가 수정되었습니다." });
      setTimeout(() => setSimMsg(null), 2500);
    } catch {
      setSimMsg({ type: "error", text: "수정 중 오류가 발생했습니다." });
    } finally {
      setUploading(false);
    }
  }, [user, loadSimData]);

  const handleDelete = useCallback(async (id: string) => {
    if (!user) return;
    setDeletingId(id);
    try {
      await deleteSimulationData(id, user.id);
      await loadSimData(user.id);
    } catch {
      setSimMsg({ type: "error", text: "삭제 중 오류가 발생했습니다." });
    } finally {
      setDeletingId(null);
    }
  }, [user, loadSimData]);

  const profileLoading = user ? loadedProfileUserId !== user.id : false;

  const validateNickname = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) return "닉네임을 입력해주세요.";
    if (trimmed.length < 2) return "닉네임은 2자 이상이어야 합니다.";
    if (trimmed.length > 20) return "닉네임은 20자 이하여야 합니다.";
    if (!/^[a-zA-Z0-9가-힣_-]+$/.test(trimmed))
      return "영문, 숫자, 한글, _, - 만 사용할 수 있습니다.";
    return null;
  };

  const saveNickname = async () => {
    if (!user) return;
    const error = validateNickname(nickname);
    if (error) {
      setNicknameMsg({ type: "error", text: error });
      return;
    }
    setSaving(true);
    await upsertProfile({ id: user.id, nickname: nickname.trim() });
    setSavedNickname(nickname.trim());
    setSaving(false);
    setNicknameMsg({ type: "success", text: "닉네임이 저장되었습니다." });
    setTimeout(() => setNicknameMsg(null), 2000);
  };

  if (isLoading || !user) return null;

  const avatarUrl =
    typeof user.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : undefined;
  const headerName = savedNickname || user.email || "사용자";

  return (
    <div className="max-w-2xl mx-auto px-6 pt-14 pb-20">
      {/* 프로필 헤더 */}
      <div className="flex items-center gap-4 mb-12">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt=""
            className="w-14 h-14 rounded-full border border-card-border"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-badge-bg border border-card-border flex items-center justify-center text-xl font-medium text-sub-text">
            {profileLoading ? null : headerName[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-semibold text-base tracking-tight">
            {profileLoading ? (
              <span className="flex gap-1 items-center h-[1.2em]">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce" />
              </span>
            ) : (
              headerName
            )}
          </p>
          <p className="text-sub-text text-sm mt-0.5">{user.email}</p>
        </div>
      </div>

      <div className="flex flex-col divide-y divide-divider">
        {/* 닉네임 */}
        <section className="pb-8">
          <label
            htmlFor="nickname-input"
            className="block text-xs font-semibold text-muted uppercase tracking-widest mb-4"
          >
            닉네임
          </label>
          <div>
            <div className="flex gap-2">
              <input
                id="nickname-input"
                type="text"
                value={nickname}
                onChange={(e) => { setNickname(e.target.value); setNicknameMsg(null); }}
                onKeyDown={(e) => e.key === "Enter" && saveNickname()}
                maxLength={20}
                placeholder="닉네임 입력"
                aria-invalid={nicknameMsg?.type === "error"}
                aria-describedby="nickname-msg"
                className="w-48 px-4 py-3 rounded-xl border bg-card-bg text-sm focus:outline-none transition-colors aria-[invalid=true]:border-error border-card-border focus:border-foreground/40"
              />
              <button
                type="button"
                onClick={saveNickname}
                disabled={saving || nickname.trim() === savedNickname}
                className="px-5 py-3 rounded-xl bg-foreground text-background text-sm font-medium hover:bg-foreground/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
              >
                저장
              </button>
            </div>
            <div
              className={`overflow-hidden transition-all duration-300 ${
                nicknameMsg ? "max-h-10 opacity-100 mt-2" : "max-h-0 opacity-0"
              }`}
            >
              <p
                id="nickname-msg"
                className={`text-xs font-medium px-3 py-1.5 rounded-lg w-fit ${
                  nicknameMsg?.type === "error"
                    ? "text-error bg-error-bg"
                    : "text-accent bg-accent-bg"
                }`}
              >
                {nicknameMsg?.text}
              </p>
            </div>
          </div>
        </section>

        {/* 내 데이터 관리 */}
        <section className="py-8">
          <h2 className="text-xs font-semibold text-muted uppercase tracking-widest mb-4">
            내 데이터 관리
          </h2>

          {/* 메시지 표시 */}
          {simMsg && (
            <div
              className={`mb-4 text-xs font-medium px-3 py-2 rounded-lg w-fit ${
                simMsg.type === "error"
                  ? "text-error bg-error-bg"
                  : "text-accent bg-accent-bg"
              }`}
              role="alert"
            >
              {simMsg.text}
            </div>
          )}

          {simDataLoading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-sub-text">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              불러오는 중...
            </div>
          ) : simDataList.length > 0 ? (
            <div className="flex flex-col gap-2">
              <SimDataCard
                item={simDataList[0]}
                deleting={deletingId === simDataList[0].id}
                onDownload={() => downloadSimulationExcel(simDataList[0].data, simDataList[0].title || "배당표")}
                onOverwrite={(file) => handleOverwrite(simDataList[0], file)}
                onDelete={() => handleDelete(simDataList[0].id)}
              />
            </div>
          ) : (
            /* 데이터 없을 때: 양식 다운로드 + 업로드 */
            <div className="rounded-xl border border-card-border bg-card-bg p-6">
              <p className="text-sm text-sub-text mb-4">
                배당 시뮬레이션에 사용할 데이터를 엑셀로 관리할 수 있습니다.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-card-border text-sm font-medium text-foreground hover:border-foreground/40 transition-colors cursor-pointer"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  양식 다운로드
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-foreground text-background text-sm font-medium hover:bg-foreground/80 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  {uploading ? "업로드 중..." : "엑셀 업로드"}
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                aria-label="엑셀 파일 업로드"
              />
            </div>
          )}
        </section>

        {/* 계정 */}
        <section className="pt-8">
          <h2 className="text-xs font-semibold text-muted uppercase tracking-widest mb-4">
            계정
          </h2>
          <button
            type="button"
            onClick={signOut}
            className="text-sm text-sub-text hover:text-foreground transition-colors cursor-pointer"
          >
            로그아웃
          </button>
        </section>
      </div>
    </div>
  );
}

/* ─── 저장된 데이터 카드 ─── */

interface ISimDataCardProps {
  item: ISimulationData;
  deleting: boolean;
  onDownload: () => void;
  onOverwrite: (file: File) => void;
  onDelete: () => void;
}

const SimDataCard = ({
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
      {/* 아이콘 */}
      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-accent-bg flex items-center justify-center">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      </div>

      {/* 정보 */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {item.title || "배당 데이터"}
        </p>
        <p className="text-xs text-sub-text mt-0.5">
          임차인 {tenantCount}명 · {updatedLabel}
        </p>
      </div>

      {/* 액션 버튼들 */}
      <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
        {/* 다운로드 */}
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

        {/* 수정 (파일 덮어쓰기) */}
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

        {/* 삭제 */}
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
