"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect, Suspense } from "react";
import type { Provider as SupabaseProvider } from "@supabase/supabase-js";

type Provider = "google" | "kakao" | "naver";

const providers: { id: Provider; label: string; emoji: string }[] = [
  { id: "google", label: "Google로 시작하기", emoji: "🔵" },
  { id: "kakao", label: "카카오로 시작하기", emoji: "💛" },
  { id: "naver", label: "네이버로 시작하기", emoji: "💚" },
];

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const redirectTo = searchParams.get("redirect") || "/";

  // 이미 로그인 상태면 리다이렉트
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
    <div className="max-w-screen-sm mx-auto px-4 py-16 flex flex-col items-center">
      <div className="text-5xl mb-6">🔐</div>
      <h1 className="text-2xl font-bold mb-2">로그인</h1>
      <p className="text-sub-text text-sm mb-8">
        소셜 계정으로 간편하게 시작하세요
      </p>

      <div className="w-full max-w-xs flex flex-col gap-3">
        {providers.map((provider) => (
          <button
            key={provider.id}
            onClick={() => handleLogin(provider.id)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-card-border bg-card-bg hover:bg-hover-bg transition-colors cursor-pointer text-sm font-medium"
          >
            <span>{provider.emoji}</span>
            <span>{provider.label}</span>
          </button>
        ))}
      </div>

      <p className="text-xs text-sub-text mt-8 text-center leading-relaxed">
        로그인 시 이용약관 및 개인정보처리방침에 동의하게 됩니다.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-screen-sm mx-auto px-4 py-16 flex justify-center">
          <p className="text-sub-text">로딩 중...</p>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
