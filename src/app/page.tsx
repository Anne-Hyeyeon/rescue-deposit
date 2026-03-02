import { ServiceCard } from "@/components/ServiceCard";

const services = [
  {
    href: "/calculator",
    title: "배당표 계산기",
    description: "예상 배당금을 직접 계산해보세요",
  },
  {
    href: "/chat",
    title: "AI 상담",
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
      <section className="pt-12 pb-10 sm:pt-16 sm:pb-14">
        <div className="flex flex-col">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight mb-6">
            보증금,
            <br />
            지킬 수 있어요.
          </h1>
          <p className="text-sub-text text-[15px] leading-relaxed max-w-sm mb-8">
            다가구 피해자가 직접 만든 사이트입니다.
            <br />
            같은 아픔을 겪는 분들이 덜 헤매시길 바라며.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-badge-bg border border-card-border text-[12px] text-sub-text w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
            피해자가 직접 운영합니다
          </div>
        </div>
      </section>

      {/* 서비스 목록 */}
      <section className="py-8 sm:py-10">
        <p className="text-[11px] text-muted uppercase tracking-widest mb-6">
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
      <section className="py-8 sm:py-10">
        <div className="pl-5 pr-6 py-4 border-l-2 border-muted">
          <p className="text-[13px] font-medium mb-2 text-foreground">
            알려드립니다
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
