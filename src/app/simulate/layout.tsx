import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "배당 시뮬레이터 - 전세사기 배당금 계산기 | 절대지켜",
  description:
    "경매 매각대금에서 내 보증금이 얼마나 돌아올 수 있는지 계산해 보세요. 다가구 전세사기 배당금 계산기. 소액임차인 최우선변제금, 상대적 소액임차인, 확정일자 임차인 배당 순서를 시뮬레이션합니다.",
  keywords: [
    "배당 시뮬레이터", "배당금 계산기", "배당 계산기",
    "전세사기 배당금", "경매 배당", "소액임차인",
    "상대적 소액임차인", "최우선변제금", "확정일자 임차인",
  ],
};

export default function SimulateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
