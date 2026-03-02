"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { LockIcon } from "@/components/icons";

/**
 * "login" → Google login required (short-term)
 * "phone" → phone verification required (long-term, Solapi)
 */
export type AuthLevel = "login" | "phone";

interface AuthGateProps {
  children: React.ReactNode;
  level?: AuthLevel;
}

export function AuthGate({ children, level = "login" }: AuthGateProps) {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const pathname = usePathname();

  if (isLoading) return null;

  // Not logged in
  if (!user) {
    return (
      <GateBlock
        icon={<LockIcon size={28} className="text-muted" />}
        title="로그인이 필요합니다"
        description="이 기능을 이용하려면 로그인하세요."
        action={
          <Link
            href={`/login?redirect=${encodeURIComponent(pathname)}`}
            className="inline-flex items-center px-5 py-2.5 rounded-full border border-card-border text-[13px] text-sub-text hover:text-foreground hover:border-foreground/40 transition-colors"
          >
            로그인하기
          </Link>
        }
      />
    );
  }

  // TODO (long-term): phone verification gate
  // if (level === "phone" && !phoneVerified) {
  //   return <GateBlock ... 전화번호 인증 안내 ... />;
  // }

  return <>{children}</>;
}

function GateBlock({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="max-w-2xl mx-auto px-6 pt-24 pb-20 flex flex-col items-center text-center gap-4">
      <div className="w-14 h-14 rounded-full bg-badge-bg flex items-center justify-center mb-2">
        {icon}
      </div>
      <h2 className="text-[17px] font-semibold tracking-tight">{title}</h2>
      <p className="text-sub-text text-[14px]">{description}</p>
      {action}
    </div>
  );
}
