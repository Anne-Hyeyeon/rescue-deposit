import { ServiceCard } from "@/components/ServiceCard";

const services = [
  {
    href: "/calculator",
    title: "배당표 계산기",
    description: "예상 배당금을 직접 계산해보세요",
  },
  {
    href: "/chat",
    title: "AI 챗봇",
    description: "경매·배당 관련 질문을 AI에게",
  },
  {
    href: "/qna",
    title: "보증금 Q&A",
    description: "헤요미가 직접 답변해드려요",
  },
  {
    href: "/mypage",
    title: "마이페이지",
    description: "저장한 배당표와 내 활동",
  },
];

export default function Home() {
  return (
    <div className="max-w-2xl mx-auto px-6">
      {/* 히어로 섹션 */}
      <section className="py-8">
        <div className="flex flex-col">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight mb-5">
            보증금,
            <br />
            다시 되찾을때까지.
          </h1>
          <p className="text-sub-text text-base leading-relaxed max-w-sm mb-6">
            다가구 피해자가 직접 만든 사이트입니다.
            <br />
            같은 아픔을 겪는 분들이 덜 헤매시길 바라며.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-badge-bg border border-card-border text-xs text-sub-text w-fit">
            👷‍♀️
            피해자가 직접 운영합니다
          </div>
        </div>
      </section>

      {/* 서비스 목록 */}
      <section className="py-8">
        <p className="text-xs text-muted uppercase tracking-widest mb-4">
          서비스
        </p>
        <div className="border-t border-divider">
          {services.map((service, i) => (
            <div key={service.href} className="border-b border-divider">
              <ServiceCard index={i + 1} {...service} />
            </div>
          ))}
        </div>
      </section>

      {/* 공지 / 면책 박스 */}
      <section className="py-8">
        <div className="pl-5 pr-6 py-4 border-l-2 border-muted">
          <p className="text-sm font-medium mb-2 text-foreground">
            알려드립니다
          </p>
          <div className="text-sm text-sub-text leading-relaxed space-y-1">
            <p>이 사이트는 법률 자문을 제공하지 않습니다.</p>
            <p>실제 배당 결과는 법원 판단에 따라 달라질 수 있으며,</p>
            <p>정확한 상담은 전문가에게 문의해주세요.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
