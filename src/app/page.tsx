import { ServiceCard } from "@/components/ServiceCard";

const services = [
  {
    href: "/calculator",
    emoji: "📊",
    title: "배당표 계산기",
    description: "예상 배당금을 직접 계산해보세요",
  },
  {
    href: "/chat",
    emoji: "💬",
    title: "AI 상담",
    description: "경매·배당 관련 질문을 AI에게",
  },
  {
    href: "/qna",
    emoji: "❓",
    title: "보증금 Q&A",
    description: "헤요미가 직접 답변해드려요",
  },
  {
    href: "/mypage",
    emoji: "👤",
    title: "마이페이지",
    description: "저장한 배당표와 내 활동",
  },
];

export default function Home() {
  return (
    <div className="max-w-2xl mx-auto px-6">
      {/* 히어로 섹션 */}
      <section className="pt-24 pb-20 sm:pt-32 sm:pb-28">
        <div className="flex flex-col items-center text-center">
          <span className="text-5xl sm:text-6xl mb-8">🏠</span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-snug mb-5">
            보증금,
            <br />
            지킬 수 있어요
          </h1>
          <p className="text-sub-text text-[15px] leading-relaxed max-w-sm">
            다가구 피해자가 직접 만든 사이트입니다.
            <br />
            같은 아픔을 겪는 분들이 덜 헤매시길 바라며.
          </p>
          <div className="mt-8 px-5 py-2.5 rounded-full bg-badge-bg border border-card-border text-[13px] text-sub-text">
            🫶 피해자가 직접 운영합니다
          </div>
        </div>
      </section>

      {/* 구분선 */}
      <div className="border-t border-divider" />

      {/* 서비스 카드 그리드 */}
      <section className="py-16 sm:py-20">
        <p className="text-[13px] text-muted uppercase tracking-widest mb-6">
          서비스
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {services.map((service) => (
            <ServiceCard key={service.href} {...service} />
          ))}
        </div>
      </section>

      {/* 구분선 */}
      <div className="border-t border-divider" />

      {/* 공지 / 면책 박스 */}
      <section className="py-16 sm:py-20">
        <div className="p-6 sm:p-8 rounded-2xl bg-notice-bg border border-card-border">
          <p className="text-[13px] font-medium mb-3 text-foreground">
            🚩 알려드립니다
          </p>
          <div className="text-[13px] text-sub-text leading-relaxed space-y-1">
            <p>이 사이트는 법률 자문을 제공하지 않습니다.</p>
            <p>실제 배당 결과는 법원 판단에 따라 달라질 수 있으며,</p>
            <p>정확한 상담은 전문가에게 문의해주세요.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
