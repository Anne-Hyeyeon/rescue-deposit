import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "마이페이지 | 절대지켜",
  description: "프로필 관리 및 배당 시뮬레이션 데이터 관리",
};

export default function MyPageLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
