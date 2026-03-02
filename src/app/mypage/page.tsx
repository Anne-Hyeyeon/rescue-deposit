"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { getProfile, upsertProfile } from "@/lib/supabase/profiles";

export default function MyPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const signOut = useAuthStore((s) => s.signOut);

  const [nickname, setNickname] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login?redirect=/mypage");
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    getProfile(user.id).then((profile) => {
      if (cancelled) return;
      setNickname(
        profile?.nickname ??
          user.user_metadata?.full_name ??
          user.user_metadata?.name ??
          ""
      );
    });

    return () => { cancelled = true; };
  }, [user]);

  const saveNickname = async () => {
    if (!user || !nickname.trim()) return;
    setSaving(true);
    await upsertProfile({ id: user.id, nickname: nickname.trim() });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (isLoading || !user) return null;

  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
  const displayName = nickname || user.email || "사용자";

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
            {displayName[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-semibold text-base tracking-tight">{displayName}</p>
          <p className="text-sub-text text-sm mt-0.5">{user.email}</p>
        </div>
      </div>

      <div className="flex flex-col divide-y divide-divider">
        {/* 닉네임 */}
        <section className="pb-8">
          <h2 className="text-xs font-semibold text-muted uppercase tracking-widest mb-4">
            닉네임
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveNickname()}
              maxLength={20}
              placeholder="닉네임 입력"
              className="flex-1 px-4 py-3 rounded-xl border border-card-border bg-card-bg text-sm focus:outline-none focus:border-foreground/40 transition-colors"
            />
            <button
              type="button"
              onClick={saveNickname}
              disabled={saving || !nickname.trim()}
              className="px-5 py-3 rounded-xl border border-card-border text-sm text-sub-text hover:text-foreground hover:border-foreground/40 transition-colors disabled:opacity-40 cursor-pointer whitespace-nowrap"
            >
              {saved ? "저장됨" : saving ? "저장 중" : "저장"}
            </button>
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
