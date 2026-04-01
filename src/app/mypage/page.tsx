"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuthStore } from "@/store/useAuthStore";
import { downloadSimulationExcel, downloadTemplate } from "@/lib/excel/generator";
import { useNickname } from "@/app/mypage/hooks/useNickname";
import { useSimulationData } from "@/app/mypage/hooks/useSimulationData";
import { useSharedResults } from "@/app/mypage/hooks/useSharedResults";
import { SimDataCard } from "@/app/mypage/components/SimDataCard";
import { SharedResultCard } from "@/app/mypage/components/SharedResultCard";

export default function MyPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const signOut = useAuthStore((s) => s.signOut);

  const nick = useNickname(user);
  const simData = useSimulationData(user);
  const sharedResults = useSharedResults(user);

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login?redirect=/mypage");
  }, [user, isLoading, router]);

  if (isLoading || !user) return null;

  const avatarUrl =
    typeof user.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : undefined;
  const headerName = nick.savedNickname || user.email || "사용자";

  return (
    <div className="max-w-2xl mx-auto px-6 pt-14 pb-20">
      {/* 프로필 헤더 */}
      <div className="flex items-center gap-4 mb-12">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt=""
            width={56}
            height={56}
            className="rounded-full border border-card-border"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-badge-bg border border-card-border flex items-center justify-center text-xl font-medium text-sub-text">
            {nick.profileLoading ? null : headerName[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-semibold text-base tracking-tight">
            {nick.profileLoading ? (
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
                value={nick.nickname}
                onChange={(e) => nick.handleNicknameChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && nick.saveNickname()}
                maxLength={20}
                placeholder="닉네임 입력"
                aria-invalid={nick.message?.type === "error"}
                aria-describedby="nickname-msg"
                className="w-full sm:w-48 px-4 py-3 rounded-xl border bg-card-bg text-sm focus:outline-none transition-colors aria-[invalid=true]:border-error border-card-border focus:border-foreground/40"
              />
              <button
                type="button"
                onClick={nick.saveNickname}
                disabled={nick.saving || nick.nickname.trim() === nick.savedNickname}
                className="px-5 py-3 rounded-xl bg-foreground text-background text-sm font-medium hover:bg-foreground/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
              >
                저장
              </button>
            </div>
            <div
              className={`overflow-hidden transition-all duration-300 ${
                nick.message ? "max-h-10 opacity-100 mt-2" : "max-h-0 opacity-0"
              }`}
            >
              <p
                id="nickname-msg"
                className={`text-xs font-medium px-3 py-1.5 rounded-lg w-fit ${
                  nick.message?.type === "error"
                    ? "text-error bg-error-bg"
                    : "text-accent bg-accent-bg"
                }`}
              >
                {nick.message?.text}
              </p>
            </div>
          </div>
        </section>

        {/* 내 데이터 관리 */}
        <section className="py-8">
          <h2 className="text-xs font-semibold text-muted uppercase tracking-widest mb-4">
            내 데이터 관리
          </h2>

          {simData.message && (
            <div
              className={`mb-4 text-xs font-medium px-3 py-2 rounded-lg w-fit ${
                simData.message.type === "error"
                  ? "text-error bg-error-bg"
                  : "text-accent bg-accent-bg"
              }`}
              role="alert"
            >
              {simData.message.text}
            </div>
          )}

          {simData.loading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-sub-text">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              불러오는 중...
            </div>
          ) : simData.dataList.length > 0 ? (
            <div className="flex flex-col gap-2">
              <SimDataCard
                item={simData.dataList[0]}
                deleting={simData.deletingId === simData.dataList[0].id}
                onDownload={() => downloadSimulationExcel(simData.dataList[0].data, simData.dataList[0].title || "배당표")}
                onOverwrite={(file) => simData.handleOverwrite(simData.dataList[0], file)}
                onDelete={() => simData.handleDelete(simData.dataList[0].id)}
              />
            </div>
          ) : (
            <div className="rounded-xl border border-card-border bg-card-bg p-6">
              <p className="text-sm text-sub-text mb-3">
                배당 시뮬레이션에 사용할 데이터를 엑셀로 관리할 수 있습니다.
              </p>
              <div className="flex items-start gap-2.5 rounded-lg bg-accent-bg px-3.5 py-2.5 mb-4">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0 text-accent" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
                <div className="text-xs leading-relaxed text-accent space-y-1">
                  <p>
                    <a href="/simulate" className="font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity">배당 시뮬레이터</a>에서
                    정보를 입력한 뒤 하단의 "엑셀로 저장" 버튼을 누르면, 양식 대신 사용할 수 있는 파일이 다운로드됩니다.
                  </p>
                  <p>저장한 데이터는 배당 시뮬레이터에서 바로 불러오기 가능합니다.</p>
                </div>
              </div>
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
                  onClick={() => simData.fileInputRef.current?.click()}
                  disabled={simData.uploading}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-foreground text-background text-sm font-medium hover:bg-foreground/80 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  {simData.uploading ? "업로드 중..." : "엑셀 업로드"}
                </button>
              </div>
              <input
                ref={simData.fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={simData.handleFileChange}
                className="hidden"
                aria-label="엑셀 파일 업로드"
              />
            </div>
          )}
        </section>

        {/* 결과지 관리 */}
        <section className="py-8">
          <h2 className="text-xs font-semibold text-muted uppercase tracking-widest mb-4">
            결과지 관리
          </h2>

          {sharedResults.message && (
            <div
              className={`mb-4 text-xs font-medium px-3 py-2 rounded-lg w-fit ${
                sharedResults.message.type === "error"
                  ? "text-error bg-error-bg"
                  : "text-accent bg-accent-bg"
              }`}
              role="alert"
            >
              {sharedResults.message.text}
            </div>
          )}

          {sharedResults.loading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-sub-text">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              불러오는 중...
            </div>
          ) : sharedResults.dataList.length > 0 ? (
            <div className="flex flex-col gap-2">
              {sharedResults.dataList.map((item) => (
                <SharedResultCard
                  key={item.id}
                  item={item}
                  deleting={sharedResults.deletingId === item.id}
                  onCopyLink={() => sharedResults.handleCopyLink(item.share_id)}
                  onDelete={() => sharedResults.handleDelete(item.id)}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-sub-text py-4">
              공유한 결과지가 없습니다. 배당 시뮬레이션 결과 페이지에서 공유 버튼을 눌러보세요.
            </p>
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
