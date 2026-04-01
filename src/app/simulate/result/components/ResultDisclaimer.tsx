export const ResultDisclaimer = () => (
  <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
    <p className="text-center text-xs leading-relaxed text-muted">
      이 결과는 입력하신 정보를 기반으로 한 <strong>참고용 시뮬레이션</strong>
      입니다. 실제 배당 결과는 법원의 판단에 따라 달라질 수 있으며, 중요한
      결정을 내리기 전에 반드시 법률 전문가와 상담하시기 바랍니다.
      <br />
      <span className="text-yellow-600 dark:text-yellow-400">
        증액보증금 반영 불가 &middot; 배당요구 미신청자 미포함 &middot; 대항요건 구비 시점
        미검증
      </span>
    </p>
  </div>
);
