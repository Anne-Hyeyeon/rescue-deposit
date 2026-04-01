import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto px-6 pt-24 pb-20 flex flex-col items-center gap-6">
      <h2 className="text-lg font-bold text-foreground">
        페이지를 찾을 수 없습니다
      </h2>
      <p className="text-sm text-sub-text">
        요청하신 페이지가 존재하지 않거나 이동되었습니다.
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-xl bg-accent-solid text-white text-sm font-medium hover:opacity-90 transition-opacity"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
