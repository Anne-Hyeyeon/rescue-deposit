export const AssumptionsPanel = () => (
  <div className="rounded-2xl border border-card-border bg-card-bg p-5">
    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-yellow-500"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      이 결과의 전제 조건
    </h3>
    <ul className="space-y-1.5 text-xs leading-relaxed text-sub-text">
      <li className="flex items-start gap-1.5">
        <span className="mt-0.5 shrink-0 text-yellow-500">&#8226;</span>
        <span>배당요구를 한 세입자만 계산에 포함되었습니다.</span>
      </li>
      <li className="flex items-start gap-1.5">
        <span className="mt-0.5 shrink-0 text-yellow-500">&#8226;</span>
        <span>
          대항력 발생일이 입력되면 대항력이 있는 것으로 가정했습니다.
          경매개시결정 등기 전 대항요건 구비 여부는 별도로 검증하지 않았습니다.
        </span>
      </li>
      <li className="flex items-start gap-1.5">
        <span className="mt-0.5 shrink-0 text-yellow-500">&#8226;</span>
        <span>
          증액된 보증금은 반영되지 않았습니다. 계약 갱신으로 보증금이 변동된
          경우 소액임차인 판정이 달라질 수 있습니다.
        </span>
      </li>
      <li className="flex items-start gap-1.5">
        <span className="mt-0.5 shrink-0 text-yellow-500">&#8226;</span>
        <span>
          소액임차인 기준표의 지역 구간은 근저당 설정일 시점의 법령을 기준으로
          판단했습니다. 같은 도시라도 시기에 따라 구간이 달라질 수 있습니다.
        </span>
      </li>
    </ul>
  </div>
);
