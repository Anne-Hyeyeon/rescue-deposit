import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "배당 시뮬레이터 | 절대지켜",
  description:
    "경매 매각대금에서 내 보증금이 얼마나 돌아올 수 있는지 계산해 보세요. 소액임차인, 근저당, 확정일자 임차인 배당 순서를 시뮬레이션합니다.",
};

export default function SimulateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
