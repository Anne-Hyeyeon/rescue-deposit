"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect, Suspense } from "react";
import type { Provider as SupabaseProvider } from "@supabase/supabase-js";
import { GoogleIcon, KakaoIcon, NaverIcon, LockIcon } from "@/components/icons";

type Provider = "google" | "kakao" | "naver";

const providers: { id: Provider; label: string; Icon: React.ComponentType<{ size?: number }> }[] = [
  { id: "google", label: "Google로 시작하기", Icon: GoogleIcon },
  { id: "kakao", label: "카카오로 시작하기", Icon: KakaoIcon },
  { id: "naver", label: "네이버로 시작하기", Icon: NaverIcon },
];

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const redirectTo = searchParams.get("redirect") || "/";

  useEffect(() => {
    if (user) {
      router.replace(redirectTo);
    }
  }, [user, router, redirectTo]);

  const handleLogin = async (provider: Provider) => {
    const supabase = createClient();
    const callbackUrl = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`;

    await supabase.auth.signInWithOAuth({
      provider: provider as SupabaseProvider,
      options: {
        redirectTo: callbackUrl,
      },
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-6 pt-24 pb-20 sm:pt-32 sm:pb-28 flex flex-col items-center">
      <LockIcon size={36} className="text-foreground mb-8 opacity-80" />
      <h1 className="text-2xl font-bold tracking-tight mb-2">로그인</h1>
      <p className="text-sub-text text-[14px] mb-10">
        소셜 계정으로 간편하게 시작하세요
      </p>

      <div className="w-full max-w-xs flex flex-col gap-3">
        {providers.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => handleLogin(id)}
            className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl border border-card-border bg-card-bg hover:border-muted hover:-translate-y-0.5 hover:shadow-sm transition-[transform,box-shadow,border-color] duration-200 cursor-pointer text-[14px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <p className="text-[12px] text-muted mt-10 text-center leading-relaxed">
        로그인 시 이용약관 및 개인정보처리방침에 동의하게 됩니다.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto px-6 pt-24 pb-20 flex justify-center">
          <p className="text-muted text-[14px]">로딩 중...</p>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
