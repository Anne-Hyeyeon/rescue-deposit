import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Noto_Sans_KR } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AuthProvider } from "@/components/AuthProvider";
import "./globals.css";

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "절대지켜 - 다가구 전세사기 배당금 계산기 | 배당 시뮬레이터",
  description: "다가구 전세사기 피해자가 직접 만든 보증금 미반환 대응 플랫폼. 경매 배당금 계산기, 배당 시뮬레이터, 소액임차인 최우선변제금 확인. 상대적 소액임차인, 확정일자 임차인 배당 순서를 시뮬레이션합니다.",
  manifest: "/manifest.json",
  keywords: [
    "다가구", "다가구 전세사기", "전세사기", "전세사기 피해자",
    "배당금", "배당금 계산기", "배당 계산기", "배당 시뮬레이터",
    "전세사기 배당금 계산기", "경매 배당",
    "소액임차인", "상대적 소액임차인", "최우선변제금", "소액임차인 최우선변제금",
    "확정일자 임차인", "보증금 미반환", "보증금 반환",
    "임차인 배당", "경매 배당표", "배당 순서",
  ],
  openGraph: {
    title: "절대지켜 - 다가구 전세사기 배당금 계산기",
    description: "다가구 전세사기 피해자가 직접 만든 사이트입니다. 경매 배당 시뮬레이터로 내 보증금이 얼마나 돌아올 수 있는지 계산해 보세요.",
    siteName: "절대지켜",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "절대지켜 - 다가구 전세사기 배당금 계산기",
    description: "다가구 전세사기 피해자가 직접 만든 사이트입니다. 경매 배당 시뮬레이터로 내 보증금 회수율을 확인하세요.",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head suppressHydrationWarning>
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            async
          />
        )}
      </head>
      <body
        className={`${notoSansKR.className} flex min-h-screen flex-col antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <AuthProvider>
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
