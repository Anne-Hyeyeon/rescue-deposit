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
    <div className="max-w-screen-sm mx-auto px-4">
      {/* 히어로 섹션 */}
      <section className="py-16 text-center">
        <div className="text-6xl mb-6">🏠</div>
        <h1 className="text-3xl font-bold mb-4">보증금, 지킬 수 있어요</h1>
        <p className="text-sub-text leading-relaxed">
          다가구 피해자가 직접 만든 사이트입니다.
          <br />
          같은 아픔을 겪는 분들이 덜 헤매시길 바라며.
        </p>
        <div className="inline-block mt-6 px-4 py-2 rounded-full bg-badge-bg text-sm text-sub-text">
          🫶 피해자가 직접 운영합니다
        </div>
      </section>

      {/* 서비스 카드 그리드 */}
      <section className="pb-12">
        <p className="text-sm text-sub-text mb-4">서비스</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {services.map((service) => (
            <ServiceCard key={service.href} {...service} />
          ))}
        </div>
      </section>

      {/* 공지 / 면책 박스 */}
      <section className="pb-12">
        <div className="p-5 rounded-xl bg-notice-bg">
          <p className="font-medium text-sm mb-2">🚩 알려드립니다</p>
          <div className="text-sm text-sub-text leading-relaxed">
            <p>이 사이트는 법률 자문을 제공하지 않습니다.</p>
            <p>실제 배당 결과는 법원 판단에 따라 달라질 수 있으며,</p>
            <p>정확한 상담은 전문가에게 문의해주세요.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
