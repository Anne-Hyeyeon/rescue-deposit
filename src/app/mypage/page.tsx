"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { getProfile, upsertProfile } from "@/lib/supabase/profiles";

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

  const profileLoading = Boolean(user) && loadedProfileUserId !== user.id;

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
