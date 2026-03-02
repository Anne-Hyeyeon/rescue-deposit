import { AuthGate } from "@/components/AuthGate";

export default function ChatPage() {
  return (
    <AuthGate level="login">
      <div className="max-w-2xl mx-auto px-6 pt-24 pb-20 flex flex-col items-center text-center">
        <h1 className="text-2xl font-bold tracking-tight mb-3">AI 상담</h1>
        <p className="text-sub-text text-sm leading-relaxed">
          준비 중입니다.
          <br />
          곧 만나실 수 있어요.
        </p>
      </div>
    </AuthGate>
  );
}
