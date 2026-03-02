import { AuthGate } from "@/components/AuthGate";

export default function QnAPage() {
  return (
    // TODO: When QnA list is built, move AuthGate to wrap only the "글쓰기" button
    <AuthGate level="login">
      <div className="max-w-2xl mx-auto px-6 pt-24 pb-20 flex flex-col items-center text-center">
        <h1 className="text-2xl font-bold tracking-tight mb-3">보증금 Q&A</h1>
        <p className="text-sub-text text-sm leading-relaxed">
          준비 중입니다.
          <br />
          곧 만나실 수 있어요.
        </p>
      </div>
    </AuthGate>
  );
}
