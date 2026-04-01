import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "배당 시뮬레이션 결과 | 절대지켜",
  description: "경매 배당 시뮬레이션 결과를 공유합니다.",
};

export default function ShareLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
